import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

//helpers
import setResponse from "../../../helpers/response/setResponse.js";
//services
import servicesCobrancaValidate from "../../services/cobranca/validate/servicesCobrancaValidate.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

const tableName = "onda_cobranca";

const onda_cobranca = class onda_cobranca {
    static metodo() {
        return db.define(
            tableName,
            {
                cobrancaId: {
                    type: DataTypes.INTEGER(11),
                    primaryKey: true,
                    autoIncrement: true,
                    field: "onda_cobranca_id",
                },
                cobrancaCodigo: {
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    field: "onda_cobranca_codigo",
                },
                cobrancaStatus: {
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                    field: "onda_cobranca_status",
                },
                cobrancaSinistro: {
                    type: DataTypes.STRING(45),
                    allowNull: true,
                    field: "onda_cobranca_sinistro",
                },
                cobrancaPaga: {
                    type: DataTypes.TINYINT(1),
                    allowNull: false,
                    field: "onda_cobranca_paga",
                },
                cobrancaEncerramento: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "onda_cobranca_encerramento",
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async patch(req, res) {
        try {
            const {cod} = req?.params;

            const dadosValidados = await servicesCobrancaValidate.ondaCobranca(req?.body);

            const results = await onda_cobranca
                .metodo()
                .update(dadosValidados, {where: {cobrancaCodigo: cod}})
                .catch(() => {
                    return setResponse.DATABASE_ERROR({message: "Erro ao atualizar cobrança!"});
                });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Sem atualizações para salvar!"});
            }

            return setResponse.SUCCESS({results: dadosValidados, message: "Cobrança atualizada com sucesso!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async removerConteudoCobrancaItemPagamentoConjunto(cods) {
        if (!Array.isArray(cods) || cods.length === 0) return;
        const placeholders = cods.map(() => "?").join(",");

        await executarQuery(
            `
                UPDATE onda_sinistro_cobranca 
                SET onda_sinistro_cobranca_pagamento_conjunto = NULL
                WHERE onda_sinistro_cobranca_cod  IN (${placeholders});
                `,
            cods
        ).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao apagar cobrança conjunta!", res: res});
        });
    }
};

export default onda_cobranca;
