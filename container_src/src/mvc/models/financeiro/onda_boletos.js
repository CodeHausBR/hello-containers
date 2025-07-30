import mongoose from "mongoose";
import * as yup from "yup";

// Helpers
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import onda_followup from "../../models/public/onda_followup.js";
import VW_CARTAFIANCA_GERAL from "../mongoose/VW_CARTAFIANCA_GERAL.js";

const Schema = mongoose.Schema;

const onda_boletos = class onda_boletos {
    constructor() {
        const schema = new Schema(
            {
                matrix: {
                    type: Schema.Types.ObjectId,
                    ref: "VW_CARTAFIANCA_GERAL",
                    required: true,
                },
                parcelas: {type: Number},
                status: {type: String},
            },
            {
                timestamps: true,
            }
        );

        this.model = mongoose.model("onda_boletos", schema);
    }

    async validate({data}) {
        const schema = yup.object().shape({
            matrix: yup.string().required("Matrix é obrigatório!"),
            parcelas: yup.string("Parcelas é obrigatório!"),
            status: yup.string().required("Status é obrigatório!"),
        });
        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async create({data, token}) {
        try {
            const dadosValidados = await this.validate({data});

            const _id = await VW_CARTAFIANCA_GERAL.getOne({contrato: data?.matrix});

            await this.model.updateOne({matrix: _id}, {$set: {...dadosValidados, matrix: _id}}, {upsert: true});

            await onda_followup.postFollowup({token: token, cod: dadosValidados?.matrix, event: "*Sucesso ao cadastrar/atualizar boleto no MongoDB!"});

            return;
        } catch (err) {
            await onda_followup.postFollowup({token: token, cod: data?.matrix, event: "*Erro ao cadastrar/atualizar boleto no MongoDB!"});
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar/atualizar boleto no MongoDB!"});
        }
    }

    async getOne({matrix, token}) {
        try {
            const contrato = await OndaContratos.findOne({matrix}) // Procura o contrato pelo campo matrix
                .populate("matrix") // Popula a referência para VW_CARTAFIANCA_GERAL
                .exec();

            if (!contrato) {
                await onda_followup.postFollowup({token: token, cod: matrix, event: "*Contrato não encontrado no MongoDB!"});
                return setResponse.NOT_FOUND({message: "Contrato não encontrado no MongoDB!"});
            }

            await onda_followup.postFollowup({token: token, cod: matrix, event: "*Sucesso ao buscar contrato no MongoDB!"});
            return setResponse.SUCCESS({data: contrato});
        } catch (err) {
            await onda_followup.postFollowup({token: token, cod: matrix, event: "*Erro ao buscar contrato no MongoDB!"});
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contrato no MongoDB!"});
        }
    }

    async getAll() {
        try {
            const contratos = await this.model
                .find() // Busca todos os contratos
                .populate("matrix") // Popula a referência para VW_CARTAFIANCA_GERAL
                .exec();

            return contratos;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos no MongoDB!"});
        }
    }
};

export default new onda_boletos();
