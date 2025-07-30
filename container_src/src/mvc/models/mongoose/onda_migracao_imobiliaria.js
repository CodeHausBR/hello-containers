import mongoose from "mongoose";
import yup from "yup";
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import onda_errors from "../public/onda_errors.js";

const onda_migracao_imobiliaria = class onda_migracao_imobiliaria {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                usuario: {
                    nome: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                },
                imobiliaria_origem: {
                    nome: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    cnpj: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    data_criacao: {
                        type: Date,
                        required: true,
                    },
                    endereco: {
                        uf: {
                            type: String,
                            required: true,
                            trim: true,
                            length: 2,
                        },
                        cidade: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        rua: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        cep: {
                            type: String,
                            required: true,
                            trim: true,
                            length: 8,
                        },
                    },
                },
                imobiliaria_destino: {
                    nome: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    cnpj: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    data_criacao: {
                        type: Date,
                        required: true,
                    },
                    endereco: {
                        uf: {
                            type: String,
                            required: true,
                            trim: true,
                            length: 2,
                        },
                        cidade: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        rua: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        cep: {
                            type: String,
                            required: true,
                            trim: true,
                            length: 8,
                        },
                    },
                },
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelName = "onda_migracao_imobiliaria";
        this.model = mongoose.model(modelName, this.schema, modelName);
        this.model.syncIndexes();
    }

    async validate({data}) {
        const schema = yup.object().shape({
            usuario: yup.object().shape({
                nome: yup.string().required("Nome do usuário é obrigatório").trim(),
            }),
            imobiliaria_origem: yup.object().shape({
                nome: yup.string().required("Nome da imobiliária de origem é obrigatório").trim(),
                cnpj: yup.string().required("CNPJ da imobiliária de origem é obrigatório").trim(),
                data_criacao: yup.date().required("Data de criação da imobiliária de origem é obrigatória"),
                endereco: yup.object().shape({
                    uf: yup.string().required("UF da imobiliária de origem é obrigatório").length(2, "UF deve ter 2 caracteres").trim(),
                    cidade: yup.string().required("Cidade da imobiliária de origem é obrigatória").trim(),
                    rua: yup.string().required("Rua da imobiliária de origem é obrigatória").trim(),
                    cep: yup.string().required("CEP da imobiliária de origem é obrigatório").length(8, "CEP deve ter 8 caracteres").trim(),
                }),
            }),
            imobiliaria_destino: yup.object().shape({
                nome: yup.string().required("Nome da imobiliária de destino é obrigatório").trim(),
                cnpj: yup.string().required("CNPJ da imobiliária de destino é obrigatório").trim(),
                data_criacao: yup.date().required("Data de criação da imobiliária de destino é obrigatória"),
                endereco: yup.object().shape({
                    uf: yup.string().required("UF da imobiliária de destino é obrigatório").length(2, "UF deve ter 2 caracteres").trim(),
                    cidade: yup.string().required("Cidade da imobiliária de destino é obrigatória").trim(),
                    rua: yup.string().required("Rua da imobiliária de destino é obrigatória").trim(),
                    cep: yup.string().required("CEP da imobiliária de destino é obrigatório").length(8, "CEP deve ter 8 caracteres").trim(),
                }),
            }),
        });
        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async create({data}) {
        const validatedData = await this.validate({data: data});

        try {
            const newTransfer = new this.model(validatedData);
            const savedTransfer = await newTransfer.save();

            return savedTransfer;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_migracao_imobiliaria", statico: "create", message: err});
            return setResponse.WARNING({message: "Erro ao criar transferência", results: []});
        }
    }

    async getAll() {
        try {
            const transfers = await this.model.find();
            return setResponse.SUCCESS({message: "Transferências recuperadas com sucesso", results: transfers});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_migracao_imobiliaria", statico: "getAll", message: err});
            return setResponse.DATABASE_ERROR({message: "Erro ao recuperar transferências"});
        }
    }

    async getOne({_id}) {
        try {
            const transfer = await this.model.findOne({_id: _id});

            if (!transfer) {
                return setResponse.NOT_FOUND({message: "Transferência não encontrada"});
            }
            return setResponse.SUCCESS({message: "Transferência recuperada com sucesso", results: transfer});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_migracao_imobiliaria", statico: "getOne", message: err});
            return setResponse.DATABASE_ERROR({message: "Erro ao recuperar transferência"});
        }
    }
};

export default new onda_migracao_imobiliaria();
