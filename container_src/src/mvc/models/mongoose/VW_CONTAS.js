import mongoose from "mongoose";
import * as yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";

//MODELS
import onda_contas from "../../models/financeiro/onda_contas.js";

class VW_CONTAS_Model {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                id: {type: Number, required: true},
                contaFornecedorNome: {type: String, maxlength: 250},
                contaRecebedorCidade: {type: String, maxlength: 250},
                contaRecebedorUf: {type: String, maxlength: 2},
                contaRecebedorMatrix: {type: String, maxlength: 255},
                contaRecebedorCpfCnpj: {type: String, maxlength: 50},
                contaCod: {type: String, maxlength: 45},
                contaMatrix: {type: String, maxlength: 45},
                contaDataPagamento: {type: Date},
                contaDataCriacao: {type: Date},
                contaVencimento: {type: Date},
                contaPrazoVencidoBolean: {type: Boolean, default: false},
                contaValor: {type: mongoose.Decimal128, precision: 10},
                contaAcrescimos: {type: mongoose.Decimal128, precision: 10},
                contaValorFinal: {type: mongoose.Decimal128, precision: 10},
                contaParcela: {type: Number},
                contaTotalParcelas: {type: Number},
                contaParcelaYdeX: {type: String, maxlength: 23},
                contaObservacoes: {type: String},
                contaGestor: {type: Number},
                contaGestorNome: {type: String, maxlength: 100},
                contaUserCriacao: {type: Number},
                contaUserCriacaoNome: {type: String, maxlength: 100},
                contaStatus: {type: Number},
                contaStatusDesc: {type: String, maxlength: 250},
                contaRecebedorTipoId: {type: Number},
                contaRecebedorTipoDesc: {type: String},
                contaCentroCusto: {type: Number},
                contaCentroCustoDesc: {type: String},
                contaFormaPagamento: {type: Number},
                contaFormaPagamentoDesc: {type: String},
                contaCategoria: {type: Number},
                contaRecorrenteBoleano: {type: Boolean, default: false},
                contaCategoriaDesc: {type: String},
            },
            {
                timestamps: true, // Habilita createdAt e updatedAt automaticamente
                autoIndex: true, // Cria automaticamente índices definidos no esquema
            }
        );
        const modelNome = "VW_CONTAS";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async validade(data) {
        const schema = yup.object().shape({
            id: yup.number().required(),
            contaFornecedorNome: yup.string().max(250).nullable(),
            contaRecebedorCidade: yup.string().max(250).nullable(),
            contaRecebedorUf: yup.string().max(2).nullable(),
            contaRecebedorMatrix: yup.string().max(255).nullable(),
            contaRecebedorCpfCnpj: yup.string().max(50).nullable(),
            contaCod: yup.string().max(45).nullable(),
            contaMatrix: yup.string().max(45).nullable(),
            contaDataPagamento: yup.date().nullable(),
            contaDataCriacao: yup.date().nullable(),
            contaVencimento: yup.date().nullable(),
            contaPrazoVencidoBolean: yup.boolean().nullable(),
            contaValor: yup
                .number()
                .nullable()
                .transform((value) => (value ? parseFloat(value) : null)),
            contaAcrescimos: yup
                .number()
                .nullable()
                .transform((value) => (value ? parseFloat(value) : null)),
            contaValorFinal: yup
                .number()
                .nullable()
                .transform((value) => (value ? parseFloat(value) : null)),
            contaParcela: yup.number().nullable(),
            contaTotalParcelas: yup.number().nullable(),
            contaParcelaYdeX: yup.string().max(23).nullable(),
            contaObservacoes: yup.string().nullable(),
            contaGestor: yup.number().nullable(),
            contaGestorNome: yup.string().max(100).nullable(),
            contaUserCriacao: yup.number().nullable(),
            contaUserCriacaoNome: yup.string().max(100).nullable(),
            contaStatus: yup.number().nullable(),
            contaStatusDesc: yup.string().max(250).nullable(),
            contaRecebedorTipoId: yup.number().nullable(),
            contaRecebedorTipoDesc: yup.string().nullable(),
            contaCentroCusto: yup.number().nullable(),
            contaCentroCustoDesc: yup.string().nullable(),
            contaFormaPagamento: yup.number().nullable(),
            contaFormaPagamentoDesc: yup.string().nullable(),
            contaCategoria: yup.number().nullable(),
            contaRecorrenteBoleano: yup.boolean().nullable(),
            contaCategoriaDesc: yup.string().nullable(),
        });

        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async post(data) {
        try {
            //const newData = await this.validade(data);
            await this.model.updateOne(
                {contaCod: data?.contaCod}, // Filtro para encontrar o documento
                {$set: data}, // Dados a serem atualizados
                {upsert: true} // Cria o documento se ele não existir
            );
        } catch (err) {
            console.error("Erro ao inserir ou atualizar o registro:", err);
        }
    }

    async sincronizarBancos() {
        try {
            const allContas = await onda_contas.getAllNotResSemFiltro2();

            const batchSize = 4000; // Número de promessas a serem executadas em paralelo

            for (let i = 0; i < allContas.length; i += batchSize) {
                const batch = allContas.slice(i, i + batchSize).map((item) => this.post(item));

                await Promise.all(batch);
            }

            return;
        } catch (error) {
            return;
        }
    }
}

export default new VW_CONTAS_Model();
