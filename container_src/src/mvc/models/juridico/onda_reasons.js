import { DataTypes } from "sequelize";
import db from "../../../db/connMysql.js";

//helpers
import generateQuery from "../../../helpers/mysql/generate-query.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";
import validate from "../../utils/formatar/validate.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
//models

const tableName = "onda_reasons";

const onda_reasons = class onda_reasons {
    static metodo(token) {
        return db.define(
            tableName,
            {
                reasonsId: {
                    field: "onda_reasons_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("reasonsId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                reasonsContrato: {
                    field: "onda_reasons_contrato",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: true,
                    validate: validate.name("reasonsContrato").notEmpty().build(),
                },
                reasonsJuridico: {
                    field: "onda_reasons_juridico",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 112,
                    validate: validate.name("reasonsJuridico").notEmpty().build(),
                },
                reasonsUser: {
                    field: "onda_reasons_user",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: false,
                    validate: validate.name("reasonsUser").notEmpty().build(),
                },
                reasonsDescricao: {
                    field: "onda_reasons_descricao",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 1,
                    validate: validate.name("reasonsDescricao").notEmpty().min(1).max(12).build(),
                },
                reasonsDivida: {
                    field: "onda_reasons_divida",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0.0,
                    validate: validate.name("reasonsDivida").notEmpty().build(),
                },
                reasonsRenda: {
                    field: "onda_reasons_renda",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0.0,
                    validate: validate.name("reasonsRenda").notEmpty().build(),
                },
                reasonsData: {
                    field: "onda_reasons_data",
                    type: DataTypes.TIME,
                    allowNull: false,
                    requere: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("reasonsData").notEmpty().build(),
                },
                reasonsScore: {
                    field: "onda_reasons_score",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    validate: validate.name("reasonsScore").notEmpty().notNull().build(),
                },
                reasonsMotivo: {
                    field: "onda_reasons_motivo",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    validate: validate.name("reasonsMotivo").notEmpty().notNull().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async validate(dadosBody, token) {
        const results = await onda_reasons
            .metodo(token)
            .build(dadosBody)
            .validate()
            .then((response) => {
                return response?.dataValues;
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async verifyExists(cod) {
        const query = `
            SELECT *  
            FROM VW_reasons_GERAL
            WHERE contrato = '${cod}'
            LIMIT 1
        `;
        const [reasonsAntiga] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({ message: "Erro ao buscar carta fiança!" });
        });

        if (!reasonsAntiga) {
            return setResponse.WARNING({ message: `O contrato: ${cod} não existe!` });
        }

        return reasonsAntiga;
    }

    // TEM QUE PEGAR A VW  E APLICAR WHERE NO TOKEN :)
    static async getOneNotRes(cod, token) {
        const results = await onda_reasons
            .metodo()
            .findOne({
                where: {
                    reasonsContrato: cod,
                },
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async getOneNotResView(cod) {
        const query = `
            SELECT *  
            FROM VW_reasons_GERAL
            WHERE contrato = '${cod}'
            LIMIT 1
        `;
        const [reasonsAntiga] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({ message: "Erro ao buscar carta fiança!" });
        });

        return reasonsAntiga;
    }

    // TEM QUE PEGAR A VW  E APLICAR WHERE NO TOKEN :)
    static async getAllNotRes(token) {
        const results = await onda_reasons
            .metodo()
            .findAll()
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async createNotRes(infoAnalise, valoresreasons, locatario, token) {
        const newreasons = {
            reasonsContrato: locatario?.locatarioCnpjcpf,
            reasonsJuridico: locatario?.locatarioCnpjcpf,
            reasonsMotivo: infoAnalise?.reasonsMotivo,
            reasonsDivida: valoresreasons?.reasonsDivida,
            reasonsUser: token?.onda_user_id || 85,
            reasonsRenda: valoresreasons?.reasonsRenda,
            reasonsScore: valoresreasons?.reasonsScore,
            reasonsDescricao: valoresreasons?.reasonsDescricao,
        };

        const retirarVazios = generateQuery.retirarkeysVazias(newreasons);

        const results = await onda_reasons
            .metodo()
            .create(retirarVazios)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({ message: "Não foi possivel cadastrar carta fiança!" });
        }

        return results;
    }

    static async patchNotRes(dadosBody, token, cod) {
        const retirarVazios = generateQuery.retirarkeysVazias(dadosBody);

        const [results] = await onda_reasons
            .metodo(token)
            .update(retirarVazios, { where: { reasonsContrato: cod } })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }
};

export default onda_reasons;
