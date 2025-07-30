import mongoose from "mongoose";
import * as yup from "yup";

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
const {ObjectId} = mongoose.Types;

const onda_ti_servidor = class onda_ti_servidor {
    constructor() {
        const shemaScripts = new mongoose.Schema({
            name: {type: String},
            description: {type: String},
            script: {type: String},
            status: {type: Boolean},
        });

        const schema = new mongoose.Schema(
            {
                application: {type: String},
                environment: {type: String},
                frontend: [shemaScripts],
                backend: [shemaScripts],
                active: {type: Boolean},
                status: {type: Boolean},
                ip: {type: String},
                port: {type: String},
                key: {type: String, unique: true},
            },
            {versionKey: false, timestamps: true}
        );

        this.model = mongoose.model("onda_ti_scripts_servidores", schema);
    }

    async getAll() {
        const allScripts = await this.model.find().catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar scripts no banco de dados!"});
        });

        return allScripts;
    }

    async getOne({docId, itemId, side}){
        
        const objectDocId =  ObjectId.createFromHexString(docId)
        const objectItemId = ObjectId.createFromHexString(itemId)

        const result = await this.model.findOne(
            {
              _id: objectDocId,
              [`${side}._id`]: objectItemId
            },
            null, // no segundo param, poderíamos passar campos diretos (ou null se não queremos)
            { projection: { [`${side}.$`]: 1 } }
          )
        .catch((err)=> {
            return setResponse.DATABASE_ERROR({message: 'Erro ao buscar script no mongoDB'})
        })

        if(!result) {
            return setResponse.WARNING({message: 'Nenhum script encontrado'})
        }

        return result
    }

    async create(data) {
        const newData = {
            ...data,
            key: `${data?.application}-${data?.environment}`,
        };

        console.log(newData, "newData");

        const verifyExists = await this.model.findOne({key: newData?.key});

        if (verifyExists) {
            return setResponse.WARNING({message: "Este servidor já está cadastrado"});
        }

        await this.model.create(newData).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar script no mongoDB"});
        });

        return;
    }

    async createScript(data) {
        const newScript = new Object({
            name: data?.name,
            description: data?.description,
            script: data?.script,
            status: data?.status,
        });

        const insertInto = await this.model
            .findOneAndUpdate({_id: ObjectId.createFromHexString(String(data?.id_application))}, {$push: {[data?.side]: newScript}}, {new: true})
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao criar script"});
            });

        return insertInto;
    }

    async updateOne(id, data) {

        const objectID = ObjectId.createFromHexString(id);

        const result = await this.model.updateOne({_id: objectID}, {$set: data}).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar script no mongoDB"});
        });

        return result;
    }

    async updateScript(data) {
        const update = {
            [`${data?.side}.$[elemento].name`]: data?.name,
            [`${data?.side}.$[elemento].description`]: data?.description,
            [`${data?.side}.$[elemento].script`]: data?.script,
            [`${data?.side}.$[elemento].status`]: data?.status,
        };

        const idServer = ObjectId.createFromHexString(data?.id_application);
        const idScript = ObjectId.createFromHexString(data?.id_script);

        const options = {
            arrayFilters: [{"elemento._id": idScript}],
            new: true,
        };

        return await this.model
            .findOneAndUpdate({_id: idServer}, {$set: update}, options)
            .then((res) => {
                if (res) {
                    return res;
                } else {
                    throw 404;
                }
            })
            .catch((err) => {
                if (err == 404) {
                    return setResponse.NOT_FOUND({message: "Id não encontrado"});
                }
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar script"});
            });
    }
};
export default new onda_ti_servidor();
