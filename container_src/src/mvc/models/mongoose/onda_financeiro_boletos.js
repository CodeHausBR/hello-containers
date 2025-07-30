import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_financeiro_boletos {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                
                  numeroCliente: {type: Number, require: true},
                //   codigoModalidade: 1,
                  numeroContaCorrente: {type: Number, require: true },
                  codigoEspecieDocumento: {type: String, require: true},
                  dataEmissao: {type: String, require: true},
                  nossoNumero: {type: Number, require: true},
                  seuNumero: {type: String, require: true},
                  identificacaoBoletoEmpresa: {type: String, require: true, unique: true},
                  codigoBarras: {type: String, require: true},
                  linhaDigitavel: {type: String, required: true},
                //   identificacaoEmissaoBoleto: 1,
                //   identificacaoDistribuicaoBoleto: 1,
                  valor: {type: Number, require: true},
                  dataVencimento: {type: String, require: true},
                  dataLimitePagamento: {type: String, require: true},
                  tipoDesconto: {type: Number, require: true},
                  tipoMulta: {type: Number, require: true},
                  dataMulta: {type: String, require: true},
                  valorMulta: {type: Number, require: true},
                  tipoJurosMora: {type: Number, require: true},
                  dataJurosMora: {type: String, require: true},
                  valorJurosMora: {type: Number, require: true},
                  numeroParcela: {type: Number, require: true},
                  codigoNegativacao: {type: Number, require: true},
                  numeroDiasNegativacao: {type: Number, require: true},
                  pagador: {
                    numeroCpfCnpj: {type: String, require: true},
                    nome: {type: String, require: true},
                    endereco: {type: String, require: true},
                    bairro: {type: String, require: true},
                    cidade:{type: String, require: true},
                    cep: {type: String, require: true},
                    uf: {type: String, require: true},
                    email: {type: String, require: true}
                  },
                  pdfBoleto: {type: String, require: true},
                  qrCode: {type: String, require: true},
                },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_financeiro_boletos";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post({data, codPagamento}) {       
        try {
            await this.model.updateOne({identificacaoBoletoEmpresa: codPagamento}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_financeiro_boletos", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
        }
    }

    async getOne({codPagamento}) {
        try {
            const result = await this.model.findOne({identificacaoBoletoEmpresa: codPagamento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_financeiro_boletos", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

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

export default new onda_financeiro_boletos();
