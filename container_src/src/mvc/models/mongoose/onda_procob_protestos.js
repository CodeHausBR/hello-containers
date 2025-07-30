import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_procob_protestos {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                documento: {type: String, required: true, unique: true},
                code: {type: String},
                message: {type: String},
                date: {type: String},
                hour: {type: String},
                revision: {type: String, default: ""},
                server: {type: String},
                content: {
                    type: Schema.Types.Mixed,
                    default: {},
                },
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_procob_protestos";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post({data, cpfCnpj}) {
        try {
            data.content.protesto_nacional = data.content.protesto_nacional || {};

            await this.model.updateOne({documento: cpfCnpj}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_procob_protestos", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
        }
    }

    async getOne({documento}) {
        try {
            const result = await this.model.findOne({documento: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_procob_protestos", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

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

export default new onda_procob_protestos();
