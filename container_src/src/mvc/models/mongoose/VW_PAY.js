import mongoose from "mongoose";

//HELPERS
import onda_errors from "../../models/public/onda_errors.js";

class VW_PAY {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                id: {type: Number, required: true},
                payCod: {type: String},
                payContratoId: {type: Number},
                payContrato: {type: String},
                payLocatario: {type: String},
                payLocatarioCpf: {type: String},
                payTitular: {type: String},
                payDatacriacao: {type: Date},
                payDatacriacaoFormat: {type: String},
                payCpf: {type: String},
                payCardnumber: {type: String},
                paySerialnumber: {type: String},
                payToken: {type: String},
                payStatus: {type: Number},
                payStatusDesc: {type: String},
                payPlatform: {type: Number},
                payUser: {type: Number},
                payDesc: {type: String},
                payValorTotal: {
                    type: mongoose.Schema.Types.Decimal128,
                    get: (v) => parseFloat(v.toString()),
                },
                payParcelas: {type: Number},
                payNumeroParcela: {type: Number},
                payValorparcelas: {
                    type: mongoose.Schema.Types.Decimal128,
                    get: (v) => parseFloat(v.toString()),
                },
                payVencimento: {type: Date},
                payVencimentoFormat: {type: String},
                payTipopagamento: {type: Number},
                payTipopagamentoDesc: {type: String},
                payCnabStatusGerado: {type: Boolean},
                payCnabNossoNumero: {type: String},
                payCnabSeuNumero: {type: String},
                payCnabStatusRetornoId: {type: String},
                payCnabStatusRetorno: {type: String},
                payPlatformDesc: {type: String},
                payTipoContaId: {type: Number},
                payTipoContaDesc: {type: String},
            },
            {
                timestamps: true,
                autoIndex: true,
                toJSON: {getters: true}, // Habilita os getters ao converter para JSON
                strict: false, // Permite campos adicionais não definidos no schema
            }
        );

        // Índices para otimização de consultas
        this.schema.index({payCod: 1});
        this.schema.index({payContratoId: 1});
        this.schema.index({payLocatarioCpf: 1});
        this.schema.index({payVencimento: 1});
        this.schema.index({payStatus: 1});
        this.schema.index({payPlatform: 1});

        const modelName = "VW_PAY";
        this.model = mongoose.model(modelName, this.schema, modelName);
        this.model.syncIndexes();
    }

    /**
     * Método para inserção/atualização em massa
     * @param {Array|Object} data - Array de objetos ou objeto único
     * @param {Object} options - Opções adicionais para a operação
     * @returns {Promise} - Resultado da operação
     */
    async post(data) {
        try {
            // Verifica se data é um array, se não for, converte para array
            const dataArray = Array.isArray(data) ? data : [data];

            // Prepara as operações de bulkWrite
            const bulkOperations = dataArray.map((item) => ({
                updateOne: {
                    filter: {id: item.id},
                    update: {$set: item},
                    upsert: true,
                },
            }));

            // Define as opções padrão para bulkWrite
            const defaultOptions = {
                ordered: false, // Permite operações fora de ordem para melhor performance
            };

            // Executa as operações em lote
            const result = await this.model.bulkWrite(bulkOperations, defaultOptions);

            return {
                success: true,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                upsertedCount: result.upsertedCount,
                upsertedIds: result.upsertedIds,
            };
        } catch (error) {
            await onda_errors.postNotRes({classe: "VW_PAY", statico: "post", message: error});

            return {
                success: false,
                error: error.message,
                details: error,
            };
        }
    }

    /**
     * Deleta um ou mais registros baseado nos IDs fornecidos
     * @param {Array|Object} data - Array de objetos ou objeto único contendo IDs para deletar
     * @returns {Promise} Resultado da operação de deleção
     */
    async delete(data) {
        try {
            // Verifica se data é um array, se não for, converte para array
            const dataArray = Array.isArray(data) ? data : [data];

            // Extrai os IDs dos objetos
            const ids = dataArray.map((item) => item.id);

            // Prepara as operações de bulkWrite para deleção
            const bulkOperations = ids.map((id) => ({
                deleteOne: {
                    filter: {id: id},
                },
            }));

            // Define as opções padrão para bulkWrite
            const defaultOptions = {
                ordered: false, // Permite operações fora de ordem para melhor performance
            };

            // Executa as operações em lote
            const result = await this.model.bulkWrite(bulkOperations, defaultOptions);

            return {
                success: true,
                deletedCount: result.deletedCount,
                matchedCount: result.matchedCount,
                ok: result.ok,
            };
        } catch (error) {
            await onda_errors.postNotRes({
                classe: "VW_PAY",
                statico: "delete",
                message: error,
            });

            return {
                success: false,
                error: error.message,
                details: error,
            };
        }
    }
}

export default new VW_PAY();
