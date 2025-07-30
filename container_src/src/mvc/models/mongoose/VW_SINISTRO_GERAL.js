import mongoose from "mongoose";
import * as yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";

//MODELS
import onda_sinistro from "../../models/juridico/onda_sinistro.js";

class VW_SINISTRO_GERAL {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                id: {type: Number, required: true},
                sinistroStatusSinistro: {type: Number},
                sinistroStatusDesc: {type: String, maxlength: 250},
                sinistroStatusCobranca: {type: Number},
                sinistroStatusCobrancaDesc: {type: String, maxlength: 250},
                sinistroDataCriacao: {type: Date},
                sinistroDataCriacaoFormat: {type: String, maxlength: 21},
                sinistroCodigo: {type: String, maxlength: 45},
                sinistroContrato: {type: String, maxlength: 45},
                sinistroPrazoExtraJudicial: {type: Date},
                sinistroValorLiquido: {type: mongoose.Decimal128, precision: 9},
                sinistroDataEncerramento: {type: Date},
                sinistroDataEncerramentoFormat: {type: String, maxlength: 21},
                sinistroTipoSinistro: {type: Number},
                sinistroDescricao: {type: String, maxlength: 500},
                sinistroDataAbertura: {type: Date},
                sinistroDataAberturaFormat: {type: String, maxlength: 21},
                sinistroLastUpdate: {type: Date},
                sinistroLastUpdateFormat: {type: String, maxlength: 21},
                sinistroResp: {type: String, maxlength: 45},
                tipoSinistro: {type: String, maxlength: 250},
                sinistroNome: {type: String, maxlength: 200},
                sinistroCpf: {type: String, maxlength: 50},
                sinistroCelular: {type: String, maxlength: 30},
                sinistroPlano: {type: String, maxlength: 50},
                sinistroImob: {type: String, maxlength: 200},
            },
            {
                timestamps: true, // Habilita createdAt e updatedAt automaticamente
                autoIndex: true, // Cria automaticamente índices definidos no esquema
            }
        );

        const modelNome = "VW_SINISTRO_GERAL";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async validade(data) {
        const schema = yup.object().shape({
            id: yup.number().required(),
            sinistroStatusSinistro: yup.number().nullable(),
            sinistroStatusDesc: yup.string().max(250).nullable(),
            sinistroStatusCobranca: yup.number().nullable(),
            sinistroStatusCobrancaDesc: yup.string().max(250).nullable(),
            sinistroDataCriacao: yup.date().nullable(),
            sinistroDataCriacaoFormat: yup.string().max(21).nullable(),
            sinistroCodigo: yup.string().max(45).nullable(),
            sinistroContrato: yup.string().max(45).nullable(),
            sinistroPrazoExtraJudicial: yup.date().nullable(),
            sinistroValorLiquido: yup
                .number()
                .nullable()
                .transform((value) => (value ? parseFloat(value) : null)),
            sinistroDataEncerramento: yup.date().nullable(),
            sinistroDataEncerramentoFormat: yup.string().max(21).nullable(),
            sinistroTipoSinistro: yup.number().nullable(),
            sinistroDescricao: yup.string().max(500).nullable(),
            sinistroDataAbertura: yup.date().nullable(),
            sinistroDataAberturaFormat: yup.string().max(21).nullable(),
            sinistroLastUpdate: yup.date().nullable(),
            sinistroLastUpdateFormat: yup.string().max(21).nullable(),
            sinistroResp: yup.string().max(45).nullable(),
            tipoSinistro: yup.string().max(250).nullable(),
            sinistroNome: yup.string().max(200).nullable(),
            sinistroCpf: yup.string().max(50).nullable(),
            sinistroCelular: yup.string().max(30).nullable(),
            sinistroPlano: yup.string().max(50).nullable(),
            sinistroImob: yup.string().max(200).nullable(),
        });

        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async post(data) {
        try {
            const newData = await this.validade(data);
            await this.model.updateOne(
                {sinistroCodigo: newData?.sinistroCodigo}, // Filtro para encontrar o documento
                {$set: newData}, // Dados a serem atualizados
                {upsert: true} // Cria o documento se ele não existir
            );
            return;
            // if (resultado.upsertedCount > 0) {
            //     console.log("Novo registro inserido com sucesso");
            // } else {
            //     console.log("Registro atualizado com sucesso");
            // }
        } catch (err) {
            console.error("Erro ao inserir ou atualizar o registro:", err);
        }
    }

    async put(id, data) {
        try {
            const newData = await this.validade(data);
            const resultado = await this.model.updateOne(
                {id: id}, // Filtro para encontrar o documento
                {$set: newData}, // Dados a serem atualizados
                {upsert: true} // Cria o documento se ele não existir
            );

            if (resultado.upsertedCount > 0) {
                console.log("Novo registro inserido com sucesso");
            } else {
                console.log("Registro atualizado com sucesso");
            }
        } catch (err) {
            console.error("Erro ao inserir ou atualizar o registro:", err);
        }
    }

    async cadastrarBanco() {
        const allSinistro = await onda_sinistro.getAllNotResViewNoFormat();

        for (const conta of allSinistro) {
            await this.post(conta);
        }
        return;
    }
}

export default new VW_SINISTRO_GERAL();
