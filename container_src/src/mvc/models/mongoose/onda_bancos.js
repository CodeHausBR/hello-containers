import mongoose from "mongoose";
import yup from "yup";
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

const onda_bancos = class onda_bancos {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                status: {
                    type: String,
                    required: true,
                    enum: ["ativo", "inativo"],
                },
                configuracao: {
                    descricao: {
                        type: String,
                        required: true,
                        trim: true,
                        index: true,
                    },
                    banco: {
                        type: {
                            id: { type: Number, required: true },
                            value: { type: String, required: true, trim: true },
                        },
                        required: true,
                    },
                    url_imagem: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    cnab: {
                        type: {
                            id: { type: Number, required: true },
                            value: { type: String, required: true, enum: ["240", "400"] },
                        },
                        required: true,
                    },
                },
                conta: {
                    agencia_digito: {
                        type: String,
                        required: true,
                        default: "",
                    },
                    conta_digito: {
                        type: String,
                        required: true,
                        default: "",
                    },
                    cedente_digito: {
                        type: String,
                        required: true,
                        default: "",
                    },
                },
                instrucoes: {
                    primeira_instrucao: {
                        type: {
                            id: { type: Number, required: true },
                            value: { type: String, required: true, trim: true },
                        },
                        required: true,
                    },
                    segunda_instrucao: {
                        type: {
                            id: { type: Number, required: true },
                            value: { type: String, required: true, trim: true },
                        },
                        required: true,
                    },
                    teceira_instrucao: {
                        type: String,
                        required: true,
                        default: "",
                    },
                    quarta_instrucao: {
                        type: String,
                        required: true,
                        default: "",
                    },
                    porcentagem_mensal_juros: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    porcentagem_multa: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    dias_para_processo_ou_negativacao: {
                        type: Number,
                        required: true,
                        default: 7,
                    },
                },
                opcoes_adicionais: {
                    custo_adicional_por_boleto: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                },
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelName = "onda_bancos";
        this.model = mongoose.model(modelName, this.schema, modelName);
        this.model.syncIndexes();
    }

    async validate({ data }) {
        const schema = yup.object().shape({
            status: yup.string().required("CNAB é obrigatório").oneOf(["ativo", "inativo"], "Status deve ser ativo ou inativo"),
            configuracao: yup.object().shape({
                descricao: yup.string().required("Descrição é obrigatória").trim(),
                banco: yup.object({
                    id: yup.number().required("ID é obrigatório"),
                    value: yup.string().required("Banco é obrigatório").trim(),
                }),
                url_imagem: yup.string().required("Url é obrigatório").trim(),
                cnab: yup.object({
                    id: yup.number().required("ID é obrigatório"),
                    value: yup.string().required("CNAB é obrigatório").oneOf(["240", "400"], "CNAB deve ser 240 ou 400"),
                }),
            }),
            conta: yup.object().shape({
                agencia_digito: yup.string().required("Agência e dígito são obrigatórios"),
                conta_digito: yup.string().required("Conta e dígito são obrigatórios"),
                cedente_digito: yup.string().required("Cedente e dígito são obrigatórios"),
            }),
            instrucoes: yup.object().shape({
                primeira_instrucao: yup.object({
                    id: yup.number().required("ID é obrigatório"),
                    value: yup.string().required("Banco é obrigatório").trim(),
                }),
                segunda_instrucao: yup.object({
                    id: yup.number().required("ID é obrigatório"),
                    value: yup.string().required("Banco é obrigatório").trim(),
                }),
                teceira_instrucao: yup.string().required("Terceira instrução é obrigatória"),
                quarta_instrucao: yup.string().required("Quarta instrução é obrigatória"),
                porcentagem_mensal_juros: yup.number().required("Porcentagem mensal de juros é obrigatória").min(0, "Porcentagem mensal de juros deve ser maior ou igual a 0"),
                porcentagem_multa: yup.number().required("Porcentagem de multa é obrigatória").min(0, "Porcentagem de multa deve ser maior ou igual a 0"),
                dias_para_processo_ou_negativacao: yup
                    .number()
                    .required("Dias para processo ou negativação é obrigatório")
                    .min(0, "Dias para processo ou negativação deve ser maior ou igual a 0"),
            }),
            opcoes_adicionais: yup.object().shape({
                custo_adicional_por_boleto: yup
                    .number()
                    .default(0)
                    .required("Custo adicional por boleto é obrigatório")
                    .min(0, "Custo adicional por boleto deve ser maior ou igual a 0"),
            }),
        });
        return await yupSchemaValidate(schema, data, { abortEarly: false });
    }

    async create({ data }) {
        const validatedData = await this.validate({ data: data });

        try {
            const newAccount = new this.model(validatedData);
            const newNonta = await newAccount.save();

            return newNonta;
        } catch (err) {
            await onda_errors.postNotRes({ classe: "onda_bancos", statico: "create", message: JSON.stringify(err)?.slice(0, 4900) });
            return setResponse.WARNING({ message: "Error creating bank account", results: [] });
        }
    }

    async update({ data }) {
        const arrayAtualizado = [];
        for (const item of data) {
            const validatedData = await this.validate({ data: item });

            const updateBanco = await this.model.findOneAndUpdate({ _id: item?._id }, { $set: validatedData }, { new: true, runValidators: true }).catch(async () => {
                await onda_errors.postNotRes({ classe: "onda_bancos", statico: "update", message: JSON.stringify(err)?.slice(0, 4900) });
                return setResponse.WARNING({ message: "Erro ao atualizar bancos", results: [] });
            });

            arrayAtualizado.push(updateBanco);
        }

        return data;
    }

    async delete({ _id }) {
        try {
            const deletedAccount = await this.model.findOneAndDelete({ _id: _id });
            if (!deletedAccount) {
                return setResponse.NOT_FOUND({ message: "Bank account not found" });
            }
            return setResponse.SUCCESS({ message: "Bank account deleted successfully", results: deletedAccount });
        } catch (err) {
            await onda_errors.postNotRes({ classe: "onda_bancos", statico: "delete", message: JSON.stringify(err)?.slice(0, 4900) });
            return setResponse.WARNING({ message: "Error deleting bank account", results: [] });
        }
    }

    async getOne({ _id }) {
        try {
            const account = await this.model.findOne({ _id: _id });
            if (!account) {
                return setResponse.NOT_FOUND({ message: "Bank account not found" });
            }
            return setResponse.SUCCESS({ message: "Bank account retrieved successfully", results: account });
        } catch (err) {
            await onda_errors.postNotRes({ classe: "onda_bancos", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900) });
            return setResponse.DATABASE_ERROR({ message: "Error retrieving bank account" });
        }
    }

    async getAll() {
        const accounts = await this.model.find().catch(async () => {
            await onda_errors.postNotRes({ classe: "onda_bancos", statico: "getAll", message: JSON.stringify(err)?.slice(0, 4900) });
            return setResponse.DATABASE_ERROR({ message: "Error retrieving bank accounts" });
        });
        return accounts;
    }
};

export default new onda_bancos();
