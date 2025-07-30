import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_cebraco_financeiro_113 {
    constructor() {
        // Modelo para a seção identifica
        const identificaSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
            },
            dados: {
                doc: {type: String, default: null},
                tipo_doc: {type: String, default: null},
                nome: {type: String, default: null},
                data: {type: String, default: null},
                signo: {type: String, default: null},
                idade: {type: Number, default: null},
                mae: {type: String, default: null},
            },
        });

        // Modelo para a seção ccf
        const ccfSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                qtd: {type: Number, default: null},
                qtd_total: {type: Number, default: null},
                data_recente: {type: String, default: null},
                data_antigo: {type: String, default: null},
            },
            dados: [
                {
                    num_banco: {type: String, default: null},
                    nome_banco: {type: String, default: null},
                    num_agencia: {type: String, default: null},
                    data: {type: String, default: null},
                    qtd_cheques: {type: String, default: null},
                },
            ],
        });

        // Modelo para a seção pefin
        const pefinSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                qtd: {type: Number, default: null},
                qtd_total: {type: Number, default: null},
                valor_total: {type: String, default: null},
                data_recente: {type: String, default: null},
                data_antigo: {type: String, default: null},
            },
            dados: [
                {
                    contrato: {type: String, default: null},
                    modalidade: {type: String, default: null},
                    origem: {type: String, default: null},
                    data: {type: String, default: null},
                    valor: {type: String, default: null},
                    avalista: {type: String, default: null},
                    filial: {type: String, default: null},
                },
            ],
        });

        // Modelo para pendencia_credito
        const pendenciaCreditoSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                data_recente: {type: String, default: null},
                data_antigo: {type: String, default: null},
            },
        });

        // Modelo para pendencia_financeira
        const pendenciaFinanceiraSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                qtd: {type: Number, default: null},
                qtd_total: {type: Number, default: null},
                valor_total: {type: String, default: null},
                data_recente: {type: String, default: null},
                data_antigo: {type: String, default: null},
            },
            dados: [
                {
                    type: mongoose.Schema.Types.Mixed,
                    default: null,
                },
            ],
        });

        // Modelo para a seção protesto_uf
        const protestaUfSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                qtd: {type: Number, default: null},
                qtd_total: {type: Number, default: null},
                valor_total: {type: String, default: null},
                data_recente: {type: String, default: null},
                data_antigo: {type: String, default: null},
            },
            dados: [
                {
                    data: {type: String, default: null},
                    valor: {type: String, default: null},
                    cartorio: {type: String, default: null},
                    cidade: {type: String, default: null},
                },
            ],
        });

        // Modelo para a seção enderecos
        const enderecoSchema = new mongoose.Schema({
            bairro: {type: String, default: null},
            cep: {type: String, default: null},
            cidade: {type: String, default: null},
            comp: {type: String, default: null},
            endereco: {type: String, default: null},
            num: {type: String, default: null},
            uf: {type: String, default: null},
        });

        const enderecosSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
            },
            dados: [enderecoSchema],
        });

        // Modelo para pessoas vinculadas
        const pessoasVincSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
            },
        });

        // Modelo para a seção telefones
        const telefonesSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
            },
            dados: [
                {
                    ddd: {type: String, default: null},
                    fone: {type: String, default: null},
                },
            ],
        });

        // Modelo para dados de entrada
        const dadosEntradaSchema = new mongoose.Schema({
            dados: {type: String, default: null},
            data_consulta: {type: String, default: null},
        });

        // Modelo principal person
        this.schema = new mongoose.Schema(
            {
                documento: {type: String, required: true, unique: true},
                resultado: {
                    cod: {type: Number, default: null},
                    msg: {type: String, default: null},
                },
                identifica: {type: identificaSchema, default: null},
                restricoes: {
                    ccf: {type: Number, default: null},
                    pefin: {type: Number, default: null},
                    pendencia_credito: {type: Number, default: null},
                    pendencia_financeira: {type: Number, default: null},
                    protesto_uf: {type: Number, default: null},
                },
                dados_entrada: {type: dadosEntradaSchema, default: null},
                ccf: {type: ccfSchema, default: null},
                pefin: {type: pefinSchema, default: null},
                pendencia_credito: {type: pendenciaCreditoSchema, default: null},
                pendencia_financeira: {type: pendenciaFinanceiraSchema, default: null},
                protesto_uf: {type: protestaUfSchema, default: null},
                enderecos: {type: enderecosSchema, default: null},
                pessoas_vinc: {type: pessoasVincSchema, default: null},
                telefones: {type: telefonesSchema, default: null},
                emails: [
                    {
                        email: {type: String, default: null},
                    },
                ],
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_cebraco_financeiro_113";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }
    async post({data, cpfCnpj}) {
        try {
            await this.model.updateOne({documento: cpfCnpj}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_cebraco_financeiro_113", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
        }
    }

    async getOne({documento}) {
        try {
            const result = await this.model.findOne({documento: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_cebraco_financeiro_113", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

            return setResponse.DATABASE_ERROR({message: "Erro ao buscar o registro."});
        }
    }

    async getAll() {
        try {
            const results = await this.model.find();
            return results;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar os registros."});
        }
    }
}

export default new onda_cebraco_financeiro_113();
