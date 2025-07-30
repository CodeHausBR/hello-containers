import mongoose from "mongoose";

//HELPERS

//MODELS
import onda_followup from "../../models/public/onda_followup.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
import setResponse from "../../../helpers/response/setResponse.js";

class VW_CARTAFIANCA_GERAL {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                id: {type: Number, required: true},
                statusAnaliseCod: {type: Number},
                colabImobId: {type: Number},
                colabNome: {type: String},
                colabMatrix: {type: String},
                statusComercialCod: {type: Number},
                statusAdesao: {type: Number},
                datapgtoAdesao: {type: Date},
                statusFinanceiroCod: {type: Number},
                statusJuridicoCod: {type: Number},
                statusVistoriaCod: {type: Number},
                configTaxaId: {type: Number},
                desconto: {type: mongoose.Decimal128, precision: 9},
                valordesconto: {type: mongoose.Decimal128, precision: 9},
                valoradesao: {type: mongoose.Decimal128, precision: 9},
                contrato: {type: String},
                contratoVenci: {type: Date},
                contratoAtivo: {type: Boolean, default: true},
                contratoDiasRest: {type: Number},
                locatario: {type: String},
                locatarioCodigo: {type: String},
                cpf: {type: String},
                locatarioAreaCode: {type: String},
                locatarioCelular: {type: String},
                celular: {type: String},
                locatarioEmail: {type: String},
                copart1Renda: {type: mongoose.Decimal128, precision: 9},
                copart2Renda: {type: mongoose.Decimal128, precision: 9},
                valoraluguel: {type: mongoose.Decimal128, precision: 9},
                valorprazo: {type: mongoose.Decimal128, precision: 9},
                parcelas: {type: Number},
                valorparcelas: {type: mongoose.Decimal128, precision: 9},
                valorvista: {type: mongoose.Decimal128, precision: 9},
                valorCartaFianca: {type: mongoose.Decimal128, precision: 9},
                valorCartaFiancaPagarme: {type: String},
                tipopagamento: {type: String},
                tipopagamentoID: {type: Number},
                plano: {type: String},
                criacao: {
                    type: Date,
                    // get: (date) => {
                    //     if (!date) return null;
                    //     const options = {day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false};
                    //     return new Intl.DateTimeFormat("pt-BR", options).format(date);
                    // },
                },
                cfFonte: {type: String},
                dataaprovacao: {type: Date},
                datarenovacao: {type: Date},
                previsaoPagamento: {type: Date},
                limpeza_: {type: Number},
                pintura_: {type: Number},
                vistoria_: {type: Number},
                limpeza: {type: String},
                pintura: {type: String},
                vistoria: {type: String},
                imobiliaria: {type: String},
                imobiliariaCod: {type: Number},
                imobiliariaCriacao: {type: Date},
                imobiliariaCNPJ: {type: String},
                imobiliariaContato: {type: String},
                Cidade: {type: String},
                ImobUF: {type: String},
                ImobEmail: {type: String},
                imobCodigo: {type: String},
                ImobiliariaRazao: {type: String},
                executivo: {type: String},
                executivoCod: {type: Number},
                executivoCodigo: {type: String},
                executivoCPfCnpj: {type: String},
                parceiro: {type: String},
                parceiroCod: {type: Number},
                parceiroCodigo: {type: String},
                parceiroCpfCnpj: {type: String},
                consultor: {type: String},
                consultorCod: {type: Number},
                consultorCodigo: {type: String},
                consultorEmail: {type: String},
                consultorCpf: {type: String},
                clientedesde: {type: Date},
                coparticipante1: {type: String},
                cpfcoparticipante1: {type: String},
                coparticipante2: {type: String},
                cpfcoparticipante2: {type: String},
                locatarioRenda: {type: String},
                statuscomercial: {type: String},
                statusanalise: {type: String},
                statusfinanceiro: {type: String},
                statusjuridico: {type: String},
                statusvistoria: {type: String},
                statusPagamentoAdesao: {type: String},
                regiao: {type: String},
                //NOVAS TAXAS
                agua: {type: mongoose.Decimal128, precision: 9},
                taxasImovel: {type: mongoose.Decimal128, precision: 9},
                iptu: {type: mongoose.Decimal128, precision: 9},
                condominio: {type: mongoose.Decimal128, precision: 9},
                lixo: {type: mongoose.Decimal128, precision: 9},
                gas: {type: mongoose.Decimal128, precision: 9},
                seguroIncendio: {type: mongoose.Decimal128, precision: 9},
                energia: {type: mongoose.Decimal128, precision: 9},
                dataPagamento: {
                    type: Date,
                    // get: (date) => {
                    //     if (!date) return null;
                    //     const options = {day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false};
                    //     return new Intl.DateTimeFormat("pt-BR", options).format(date);
                    // },
                },
                payTotalPago: {type: mongoose.Decimal128, precision: 31},
                imovelCod: {type: String},
            },
            {
                timestamps: true,
                autoIndex: true,
                // toJSON: {getters: true},
                // toObject: {getters: true},
            }
        );

        const modelNome = "VW_CARTAFIANCA_GERAL";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post(data) {
        try {
            const cfAttSemFormat = await onda_cartafianca.getOneNotResViewNotFormat(data?.contrato);

            if (!cfAttSemFormat) return;
            //const newData = await this.validate(cfAttSemFormat);

            await this.model.updateOne(
                {contrato: cfAttSemFormat?.contrato}, // Filtro para encontrar o documento
                {$set: cfAttSemFormat}, // Dados a serem atualizados
                {upsert: true} // Cria o documento se ele não existir
            );
            return;
        } catch (err) {
            await onda_followup.postFollowup({token: "", cod: data?.contrato, event: "*Erro ao cadastrar/atualizar carta fiança no MongoDB!"});
            return;
        }
    }

    async getAll() {
        try {
            const results = await this.model.find().select(
                `   id 
                    criacao 
                    valorCartaFianca 
                    contrato 
                    locatario 
                    cpf 
                    valoraluguel 
                    imobiliaria 
                    imobiliariaCod 
                    Cidade 
                    valorprazo 
                    statusanalise 
                    statuscomercial 
                    statusfinanceiro 
                    statusVistoriaCod 
                    statusFinanceiroCod 
                    statusComercialCod 
                    statusAnaliseCod 
                    tipopagamento 
                    consultor 
                    executivo 
                    parceiro 
                    plano 
                    vistoria 
                    pintura 
                    statusfinanceiro 
                    statusvistoria 
                    statusjuridico 
                    dataaprovacao 
                    datarenovacao 
                    desconto 
                    valordesconto 
                    previsaoPagamento 
                    cfFonte 
                    dataPagamento 
                    payTotalPago 
                    limpeza`
            );
            return results;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cartafiança no mongoose!"});
        }
    }

    async getOne({contrato}) {
        try {
            const result = await this.model.findOne({contrato: contrato}).select("_id");
            return result;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cartafiança no mongoose!"});
        }
    }

    async sincronizarBancos() {
        try {
            const allCF = await onda_cartafianca.getAllNotResView();

            const batchSize = 4000; // Número de promessas a serem executadas em paralelo

            for (let i = 0; i < allCF.length; i += batchSize) {
                const batch = allCF.slice(i, i + batchSize).map((item) => this.postSyncBancos(item));

                await Promise.all(batch);
            }

            return;
        } catch (error) {
            return;
        }
    }

    async postSyncBancos(data) {
        try {
            //const newData = await this.validate(cfAttSemFormat);

            await this.model.updateOne(
                {contrato: data?.contrato}, // Filtro para encontrar o documento
                {$set: data}, // Dados a serem atualizados
                {upsert: true} // Cria o documento se ele não existir
            );
            return;
        } catch (err) {
            await onda_followup.postFollowup({token: "", cod: data?.contrato, event: "*Erro ao cadastrar/atualizar carta fiança no MongoDB!"});
            return;
        }
    }
}

export default new VW_CARTAFIANCA_GERAL();
