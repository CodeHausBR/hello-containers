import mongoose from "mongoose";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

class onda_procob {
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

        const modelNome = "onda_procob";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async post({data, cpfCnpj}) {
        try {
            data.content.busca_judicial = data.content.busca_judicial || {};

            if (!data?.content?.dados_gerais?.documento) return;

            await this.model.updateOne({documento: cpfCnpj}, {$set: data}, {upsert: true});
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_procob", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
        }
    }

    async getOne({documento}) {
        try {
            const result = await this.model.findOne({documento: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_procob", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

            return setResponse.DATABASE_ERROR({message: "Erro ao buscar o registro."});
        }
    }

    async getAll() {
        try {
            const results = await this.model.aggregate([
                {
                    $project: {
                        _id: 0,
                        id: "$_id",
                        documento: "$content.dados_gerais.documento",
                        nome: "$content.dados_gerais.nome",
                        nascimento: "$content.dados_gerais.nascimento",
                        obito: "$content.dados_gerais.obito",
                        sexo: "$content.dados_gerais.sexo",
                        pessoa: "$content.dados_gerais.pessoa",
                        status_receita: "$content.dados_gerais.status_receita",
                        dt_status_receita: "$content.dados_gerais.dt_status_receita",
                    },
                },
            ]);
            return results;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar os registros."});
        }
    }

    async limparCamposProcessos() {
        try {
            // Busca todos os documentos
            const documentos = await this.model.find();

            let totalAtualizados = 0;
            let erros = [];

            // Processa cada documento
            for (const doc of documentos) {
                try {
                    // Cria uma cópia do documento para modificação
                    const processos = doc.content?.busca_judicial?.processos?.map((processo) => {
                        const newProcess = processo;
                        newProcess.peticoes = [];
                        newProcess.decisoes = [];
                        newProcess.atualizacoes = [];
                        return newProcess;
                    });

                    // Atualiza diretamente usando updateOne
                    const resultado = await this.model.updateOne(
                        {_id: doc._id},
                        {
                            $set: {
                                "content.busca_judicial.processos": processos,
                            },
                        }
                    );

                    if (resultado.modifiedCount > 0) {
                        totalAtualizados++;
                    }
                } catch (docError) {
                    console.error(`Erro ao processar documento ${doc.documento}:`, docError);
                    erros.push({
                        documento: doc.documento,
                        erro: docError.message,
                    });
                }
            }

            return;
        } catch (error) {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar os registros.",
                error: error.message,
            });
        }
    }
}

export default new onda_procob();
