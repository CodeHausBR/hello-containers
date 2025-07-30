//TYPES
import BigNumber from "bignumber.js";
import { DataTypes, Op } from "sequelize";
import db from "../../../db/connMysql.js";
import yup from "yup";
import onda_errors from "../public/onda_errors.js";
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

//HELPERS

//MODELS

const tableName = "onda_cartafianca_exoneracao";

const onda_cartafianca_exoneracao = class onda_cartafianca_exoneracao {
    static metodo() {
        return db.define(
            tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    field: "onda_cartafianca_exoneracao_id",
                },
                referencia: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_referencia",
                },
                codigo: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_codigo",
                },

                status: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_status",
                },
                deletado: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    field: "onda_cartafianca_exoneracao_deletado",
                },
                responsavel: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: "onda_cartafianca_exoneracao_responsavel",
                },
                dataCriacao: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "onda_cartafianca_exoneracao_datacriacao",
                },
                dataEncerramento: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "onda_cartafianca_exoneracao_dataencerramento",
                },
                ultimaAtt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "onda_cartafianca_exoneracao_ultimaatt",
                },
                userCriacao: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_usercriacao",
                },
                imobiliaria: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_imobiliaria",
                },
                locatario: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_locatario",
                },
                imobNome: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_imobiliarianome",
                },
                locatarioNome: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_locatarionome",
                },
                responsavelId: {
                    type: DataTypes.NUMBER,
                    allowNull: true,
                    field: "onda_cartafianca_exoneracao_responsavelid",
                },
                userCriacaoNome: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_exoneracao_usercriacaonome",
                },
                statusOrigem: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    field: "onda_cartafianca_exoneracao_statusorigem",
                },
            },

            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async getAll(filtros = {}) {
        const whereClause = {};
        if (filtros.dataInicial && filtros.dataFinal) {
            whereClause.dataCriacao = {
                [Op.between]: [new Date(filtros.dataInicial), new Date(filtros.dataFinal)],
            };
        } else if (filtros.dataInicial) {
            whereClause.dataCriacao = {
                [Op.gte]: new Date(filtros.dataInicial),
            };
        } else if (filtros.dataFinal) {
            whereClause.dataCriacao = {
                [Op.lte]: new Date(filtros.dataFinal),
            };
        }
        const results = await onda_cartafianca_exoneracao
            .metodo()
            .findAll({
                where: whereClause,
                raw: true,
            })
            .catch(async (err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({ message: "Não foi possivel buscar todos as exonerações." });
        }

        return results;
    }

    static async getViewAll(filtros = {}) {
        let query = `SELECT * FROM VW_EXONERACAO`;
        const where = [];
        const values = [];

        if (filtros.dataInicial && filtros.dataFinal) {
            where.push(`dataCriacao BETWEEN ? AND ?`);
            values.push(filtros.dataInicial, filtros.dataFinal);
        } else if (filtros.dataInicial) {
            where.push(`dataCriacao >= ?`);
            values.push(filtros.dataInicial);
        } else if (filtros.dataFinal) {
            where.push(`dataCriacao <= ?`);
            values.push(filtros.dataFinal);
        }

        if (where.length) {
            query += ` WHERE ${where.join(" AND ")}`;
        }

        query += ` ORDER BY dataCriacao DESC`;

        const results = await executarQuery(query, values).catch((err) => {
            console.log(err);
            return setResponse.DATABASE_ERROR({ message: "Erro ao buscar exonerações!" });
        });
        return results;
    }

    static async createNotRes({ data }) {
        const results = await onda_cartafianca_exoneracao
            .metodo()
            .create(data)
            .catch(async (err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({ message: "Não foi possivel cadastrar evento de exoneração para a carta fiança!" });
        }

        return results;
    }

    static async getOneById({ id }) {
        const results = await onda_cartafianca_exoneracao
            .metodo()
            .findOne({
                where: {
                    id,
                },
            })
            .catch(async (err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (!results) {
            return setResponse.WARNING({ message: "Não foi possível buscar evento de exoneração pelo ID!" });
        }

        return results;
    }

    static async getOneByCodigo(codigo) {
        const result = await onda_cartafianca_exoneracao.metodo().findOne({
            where: { codigo },
            raw: true,
        });

        if (!result) {
            return setResponse.WARNING({
                message: "Não foi possível encontrar a exoneração com o código informado!",
            });
        }

        return result;
    }

    static async getViewOneByReference(referencia) {
        try {
            const result = await onda_cartafianca_exoneracao.metodo().findOne({
                where: { referencia },
                raw: true,
            });

            if (!result) {
                return setResponse.WARNING({
                    message: "Não foi possível encontrar a exoneração com o código informado!",
                });
            }

            return result;
        } catch (err) {
            return setResponse.SCHEMA_SEQUELIZE(err);
        }
    }

    static async update(data, cod) {
        try {
            const [updatedCount] = await onda_cartafianca_exoneracao.metodo().update(data, {
                where: { codigo: cod },
            });

            if (updatedCount === 0) {
                return setResponse.WARNING({
                    message: "Não foi possível atualizar o evento de exoneração para a carta fiança!",
                });
            }
            const updated = await this.getOneByCodigo(cod);
            return updated;
        } catch (err) {
            return setResponse.SCHEMA_SEQUELIZE(err);
        }
    }
};

export default onda_cartafianca_exoneracao;
