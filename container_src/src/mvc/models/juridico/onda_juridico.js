import { DataTypes, Op, where } from "sequelize";
import db from "../../../db/connMysql.js";

//helpers
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";

const tableName = "onda_juridico";

const onda_juridico = class onda_juridico {
    static metodo() {
        return db.define(
            tableName,
            {
                id: {
                    field: "onda_juridico_id",
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                imob: {
                    field: "onda_juridico_imob",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                },
                reference: {
                    field: "onda_juridico_reference",
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                conta: {
                    field: "onda_juridico_conta",
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                divida: {
                    field: "onda_juridico_divida",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                datainicio: {
                    field: "onda_juridico_datainicio",
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                datatermino: {
                    field: "onda_juridico_datatermino",
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                valorparcela: {
                    field: "onda_juridico_valorparcela",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                condicao: {
                    field: "onda_juridico_condicao",
                    type: DataTypes.CHAR(100),
                    allowNull: true,
                },
                saldo: {
                    field: "onda_juridico_saldo",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                taxapaga: {
                    field: "onda_juridico_taxapaga",
                    type: DataTypes.DECIMAL(9, 2),
                    allowNull: true,
                },
                suspender: {
                    field: "onda_juridico_suspender",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                datacriacao: {
                    field: "onda_juridico_datacriacao",
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                statusAcordo: {
                    field: "onda_juridico_acordostatus",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 1,
                },
                info: {
                    field: "onda_juridico_info",
                    type: DataTypes.CHAR(100),
                    allowNull: true,
                },
                valorContaRef: {
                    field: "onda_juridico_valorcontaref",
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: true,
                },
                totalPago: {
                    field: "onda_juridico_totalpago",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                proximaParcela: {
                    field: "onda_juridico_proximaparcela",
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                userUpdate: {
                    field: "onda_juridico_userupdate",
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                userUpdateNome: {
                    field: "onda_juridico_userupdatenome",
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                userCriacao: {
                    field: "onda_juridico_usercriacao",
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                userCriacaoNome: {
                    field: "onda_juridico_usercriacaonome",
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                ultimaAtt: {
                    field: "onda_juridico_ultimaatt",
                    type: DataTypes.TIME,
                    allowNull: true,
                },
                imobiliaria: {
                    field: "onda_juridico_imobiliaria",
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }
    static async registerAcordo(data) {
        try {
            const result = await onda_juridico.metodo().create(data);
            return result;
        } catch (error) {
            return setResponse.DATABASE_ERROR({ message: "Erro ao registrar acordo judicial." });
        }
    }

    static async updateAcordos({ data, cod, token = {} }) {
        let userUpdateData = {};
        if (!token?.nome) {
            userUpdateData = {
                userUpdateNome: token?.nome,
                userUpdate: token?.codigo,
            };
        }

        try {
            const result = await onda_juridico.metodo().update(
                { ...data, ...userUpdateData },
                {
                    where: {
                        reference: cod,
                    },
                }
            );
            return result;
        } catch (error) {
            return setResponse.DATABASE_ERROR({ message: "Erro ao atualizar acordo judicial." });
        }
    }
    static async getAllAcordos(filtros = {}) {
        try {
            const whereClause = {};

            if (filtros.dataInicial && filtros.dataFinal) {
                whereClause[Op.or] = [
                    {
                        datainicio: {
                            [Op.between]: [new Date(filtros.dataInicial), new Date(filtros.dataFinal)],
                        },
                    },
                    { datainicio: null },
                ];
            } else if (filtros.dataInicial) {
                whereClause[Op.or] = [
                    {
                        datainicio: {
                            [Op.gte]: new Date(filtros.dataInicial),
                        },
                    },
                    { datainicio: null },
                ];
            } else if (filtros.dataFinal) {
                whereClause[Op.or] = [
                    {
                        datainicio: {
                            [Op.lte]: new Date(filtros.dataFinal),
                        },
                    },
                    { datainicio: null },
                ];
            }

            const result = await onda_juridico.metodo().findAll({
                where: whereClause,
                raw: true,
            });
            return result;
        } catch (error) {
            return setResponse.DATABASE_ERROR({ message: "Erro ao buscar acordos judiciais." });
        }
    }

    static async getAcordoByCod({ cod }) {
        try {
            const result = await onda_juridico.metodo().findAll({
                where: {
                    reference: cod,
                },
                raw: true,
            });
            return result;
        } catch (error) {
            return setResponse.DATABASE_ERROR({ message: "Erro ao buscar acordos judiciais." });
        }
    }

    static async getReferenciaByCodConta({ cod }) {
        try {
            const result = await onda_juridico.metodo().findAll({
                where: {
                    conta: cod,
                },
                raw: true,
            });
            return result;
        } catch (error) {
            return setResponse.DATABASE_ERROR({ message: "Erro ao buscar acordos judiciais." });
        }
    }
};

export default onda_juridico;
