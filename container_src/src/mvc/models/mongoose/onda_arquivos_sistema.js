import mongoose from "mongoose";
import yup from "yup";
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import onda_errors from "../public/onda_errors.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";

const onda_arquivos_sistema = class onda_arquivos_sistema {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                arquivos: [
                    {
                        key: {
                            type: String,
                            required: true,
                            trim: true,
                            unique: true,
                            index: true,
                        },
                        paths: [
                            {
                                type: String,
                                required: true,
                                trim: true,
                            },
                        ],
                        plataforma: {
                            type: String,
                            required: true,
                            trim: true,
                            enum: ["portal", "mobile", "wave", "locatario"],
                        },
                        expired_date: {
                            type: Date,
                            required: false,
                        },
                        start_date: {
                            type: Date,
                            required: true,
                        },
                        title: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        ativo: {
                            type: Boolean,
                            required: true,
                            default: true,
                        },
                        link_externo: {
                            type: String,
                            required: false,
                            trim: true,
                        },
                    },
                ],
                title: {
                    type: String,
                    required: true,
                    trim: true,
                },
                path: {
                    type: String,
                    required: true,
                    trim: true,
                },
                maximo_arquivos: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                tipo_arquivo: {
                    type: String,
                    required: true,
                    enum: ["pdf", "image", "all"],
                    default: "all",
                },
                obrigatorio_ter_arquivo: {
                    type: Boolean,
                    required: true,
                    default: false,
                },
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelName = "onda_arquivos_sistema";
        this.model = mongoose.model(modelName, this.schema, modelName);
        this.model.syncIndexes();
    }

    async validateCreate({data}) {
        const schema = yup.object().shape({
            arquivos: yup.array().of(
                yup.object().shape({
                    key: yup.string().default(gerarCondigoSetores("ARQUIVOS-SISTEMA")),
                    paths: yup.array().of(yup.string().required("Caminho do arquivo é obrigatório").trim()).min(1, "Pelo menos um caminho é obrigatório"),
                    plataforma: yup.string().required("Plataforma é obrigatória").oneOf(["portal", "mobile", "wave", "locatario"]).trim(),
                    expired_date: yup.date().nullable(),
                    start_date: yup.date().required("Data de início é obrigatória"),
                    title: yup.string().required("Título do arquivo é obrigatório").trim(),
                    ativo: yup.boolean().required("Status ativo/inativo é obrigatório"),
                    link_externo: yup.string().nullable().url("Link externo deve ser uma URL válida").trim(),
                })
            ),
            title: yup.string().required("Título é obrigatório").trim(),
            path: yup.string().required("Caminho é obrigatório").trim(),
            maximo_arquivos: yup.number().required("Número máximo de arquivos é obrigatório").min(1),
            tipo_arquivo: yup.string().required("Tipo de arquivo é obrigatório").oneOf(["pdf", "image", "all"]),
            obrigatorio_ter_arquivo: yup.boolean().required("Definição de obrigatoriedade é necessária"),
        });
        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async validateUpdate({data, existingDoc}) {
        const schema = yup.object().shape({
            arquivos: yup
                .array()
                .of(
                    yup.object().shape({
                        key: yup
                            .string()
                            .test("key-validation", "Key inválida ou não encontrada", function (value) {
                                if (!value) return true;
                                return existingDoc.arquivos.some((arquivo) => arquivo.key === value);
                            })
                            .trim(),
                        paths: yup.array().of(yup.string().required("Caminho do arquivo é obrigatório").trim()).min(1, "Pelo menos um caminho é obrigatório"),
                        plataforma: yup.string().required("Plataforma é obrigatória").oneOf(["portal", "mobile", "wave", "locatario"]).trim(),
                        expired_date: yup.date().nullable(),
                        start_date: yup.date().required("Data de início é obrigatória"),
                        title: yup.string().required("Título do arquivo é obrigatório").trim(),
                        ativo: yup.boolean().required("Status ativo/inativo é obrigatório"),
                        link_externo: yup.string().nullable().url("Link externo deve ser uma URL válida").trim(),
                        _id: yup.string(),
                    })
                )
                .test("max-arquivos", "Número de arquivos excede o limite máximo permitido", function (value) {
                    return value.length <= this.parent.maximo_arquivos;
                })
                .required("Pelo menos um arquivo é necessário"),
            title: yup.string().required("Título é obrigatório").trim(),
            path: yup.string().required("Caminho é obrigatório").trim(),
            maximo_arquivos: yup
                .number()
                .required("Número máximo de arquivos é obrigatório")
                .min(1)
                .test("min-current-arquivos", "Não pode ser menor que o número atual de arquivos", function (value) {
                    return value >= this.parent.arquivos.length;
                }),
            tipo_arquivo: yup.string().required("Tipo de arquivo é obrigatório").oneOf(["pdf", "image", "all"]),
            obrigatorio_ter_arquivo: yup.boolean().required("Definição de obrigatoriedade é necessária"),
        });

        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async create({data}) {
        try {
            // Adicionar key para cada arquivo
            const dataWithKeys = {
                ...data,
                arquivos: data.arquivos.map((arquivo) => ({
                    ...arquivo,
                    key: gerarCondigoSetores("ARQUIVOS-SISTEMA"),
                })),
            };

            const validatedData = await this.validateCreate({data: dataWithKeys});

            if (validatedData.arquivos.length > validatedData.maximo_arquivos) {
                return setResponse.WARNING({message: `O número de arquivos excede o limite máximo de ${validatedData.maximo_arquivos}`, results: []});
            }

            const newFile = new this.model(validatedData);
            const savedFile = await newFile.save();

            return savedFile;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_arquivos_sistema", statico: "create", message: err});
            return setResponse.WARNING({message: "Erro ao criar arquivo do sistema", results: err});
        }
    }

    async update({_id, data}) {
        try {
            const existingDoc = await this.model.findById(_id);

            if (!existingDoc) {
                return setResponse.NOT_FOUND({message: "Arquivo do sistema não encontrado"});
            }

            try {
                await this.validateUpdate({data: data, existingDoc: existingDoc});
            } catch (validationError) {
                return setResponse.WARNING({message: "Erro de validação", results: validationError.errors});
            }

            const updatedArquivos = data.arquivos.map((novoArquivo) => {
                const arquivoExistente = existingDoc.arquivos.find((existente) => existente.key === novoArquivo.key);

                if (arquivoExistente) {
                    return {
                        ...novoArquivo,
                        _id: arquivoExistente._id,
                        key: arquivoExistente.key,
                    };
                } else {
                    return {
                        ...novoArquivo,
                        key: gerarCondigoSetores("ARQUIVOS-SISTEMA"),
                    };
                }
            });

            const updatedFile = await this.model.findOneAndUpdate(
                {_id: _id},
                {
                    $set: {
                        ...data,
                        arquivos: updatedArquivos,
                    },
                },
                {new: true, runValidators: true}
            );

            return updatedFile;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_arquivos_sistema", statico: "update", message: err});
            return setResponse.WARNING({message: "Erro ao atualizar arquivo do sistema", results: err});
        }
    }

    // Os métodos getOne, getByKey e getAll permanecem inalterados
    async getOne({_id}) {
        try {
            const file = await this.model.findOne({_id: _id});

            if (!file) {
                return setResponse.NOT_FOUND({message: "Arquivo do sistema não encontrado"});
            }

            return file;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_arquivos_sistema", statico: "getOne", message: err});
            return setResponse.DATABASE_ERROR({message: "Erro ao recuperar arquivo do sistema"});
        }
    }

    async getByKey({key}) {
        try {
            const file = await this.model.findOne({
                arquivos: {
                    $elemMatch: {key: key},
                },
            });

            if (!file) {
                return setResponse.NOT_FOUND({message: "Arquivo do sistema não encontrado"});
            }

            return file;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_arquivos_sistema", statico: "getByKey", message: err});
            return setResponse.DATABASE_ERROR({message: "Erro ao recuperar arquivo do sistema"});
        }
    }

    async getAll() {
        try {
            const files = await this.model.find();
            return files;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_arquivos_sistema", statico: "getAll", message: err});
            return setResponse.DATABASE_ERROR({message: "Erro ao recuperar arquivos do sistema"});
        }
    }
};

export default new onda_arquivos_sistema();
