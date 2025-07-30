import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_cebraco_financeiro {
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
                idade: {type: String, default: null},
                mae: {type: String, default: null},
                situacao: {type: String, default: null},
            },
        });

        // Modelo para a seção ccf
        const ccfSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                qtd: {type: String, default: null},
                qtd_total: {type: String, default: null},
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
                qtd: {type: String, default: null},
                qtd_total: {type: String, default: null},
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

        // Modelo para a seção protesto_uf
        const protestaUfSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                qtd: {type: String, default: null},
                qtd_total: {type: String, default: null},
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

        // Modelo para a seção endereco
        const vizinhoSchema = new mongoose.Schema({
            _key: {type: String, default: null},
            _numcomp: {type: String, default: null},
            doc: {type: String, default: null},
            nome: {type: String, default: null},
            ddd: {type: String, default: null},
            fone: {type: String, default: null},
        });

        const enderecoSchema = new mongoose.Schema({
            _key: {type: String, default: null},
            _cepnum: {type: String, default: null},
            endereco: {type: String, default: null},
            num: {type: String, default: null},
            comp: {type: String, default: null},
            bairro: {type: String, default: null},
            cep: {type: String, default: null},
            cidade: {type: String, default: null},
            uf: {type: String, default: null},
            vizinhos: [vizinhoSchema],
        });

        const telefonesSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
                qtd: {type: Number, default: null},
                qtd_total: {type: String, default: null},
            },
            dados: [
                {
                    ddd: {type: String, default: null},
                    fone: {type: String, default: null},
                },
            ],
        });

        const emailsSchema = new mongoose.Schema({
            resultado: {
                cod: {type: Number, default: null},
                msg: {type: String, default: null},
            },
            dados: [
                {
                    email: {type: String, default: null},
                },
            ],
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
                    ccf: {type: String, default: null},
                    pefin: {type: String, default: null},
                    protesto_uf: {type: String, default: null},
                },
                ccf: {type: ccfSchema, default: null},
                pefin: {type: pefinSchema, default: null},
                protesto_uf: {type: protestaUfSchema, default: null},
                endereco: {
                    resultado: {
                        cod: {type: Number, default: null},
                        msg: {type: String, default: null},
                    },
                    identifica: identificaSchema.obj,
                    enderecos: [enderecoSchema],
                    telefones: {type: telefonesSchema, default: null},
                    emails: {type: emailsSchema, default: null},
                },
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_cebraco_financeiro";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post({data, cpfCnpj}) {
        try {
            await this.model.updateOne({documento: cpfCnpj}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_cebraco_financeiro", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
        }
    }

    async getOne({documento}) {
        try {
            const result = await this.model.findOne({documento: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_cebraco_financeiro", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

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

export default new onda_cebraco_financeiro();
