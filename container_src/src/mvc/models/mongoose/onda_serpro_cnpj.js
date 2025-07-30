import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_serpro_cnpj {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                ni: {type: String, required: true, unique: true},
                nomeEmpresarial: {type: String},
                nomeFantasia: {type: String},
                tipoEstabelecimento: {type: String},
                dataAbertura: {type: String},
                situacaoCadastral: {
                    type: mongoose.Schema.Types.Mixed,
                    default: {},
                },
                naturezaJuridica: {
                    type: mongoose.Schema.Types.Mixed,
                    default: {},
                },
                cnaePrincipal: {
                    type: mongoose.Schema.Types.Mixed,
                    default: {},
                },
                cnaeSecundarias: {
                    type: [
                        {
                            codigo: {type: String, required: true},
                            descricao: {type: String, required: true},
                        },
                    ],
                    default: [],
                },
                endereco: {
                    tipoLogradouro: {type: String},
                    logradouro: {type: String},
                    numero: {type: String},
                    complemento: {type: String},
                    cep: {type: String},
                    bairro: {type: String},
                    municipio: {
                        codigo: {type: String},
                        descricao: {type: String},
                    },
                    uf: {type: String},
                    pais: {
                        codigo: {type: String},
                        descricao: {type: String},
                    },
                },
                municipioJurisdicao: {
                    codigo: {type: String},
                    descricao: {type: String},
                },
                telefones: [
                    {
                        ddd: {type: String},
                        numero: {type: String},
                    },
                ],
                correioEletronico: {type: String},
                capitalSocial: {type: Number},
                porte: {type: String},
                situacaoEspecial: {type: String},
                dataSituacaoEspecial: {type: String},
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_serpro_cnpj";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post({data, cpfCnpj}) {
        try {
            await this.model.updateOne({ni: cpfCnpj}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_serpro_cnpj", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
        }
    }

    async getOne({documento}) {
        try {
            const result = await this.model.findOne({ni: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_serpro_cnpj", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

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

export default new onda_serpro_cnpj();
