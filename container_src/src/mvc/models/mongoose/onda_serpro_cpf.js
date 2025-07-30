import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_serpro_cpf {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                ni: {type: String, required: true, unique: true},
                nome: {type: String},
                nascimento: {type: String},
                situacao: {
                    type: Schema.Types.Mixed,
                    default: {},
                },
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_serpro_cpf";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post({data, cpfCnpj}) {
        try {
            await this.model.updateOne({ni: cpfCnpj}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_serpro_cpf", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
        }
    }

    async getOne({documento}) {
        try {
            const result = await this.model.findOne({ni: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_serpro_cpf", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

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

export default new onda_serpro_cpf();
