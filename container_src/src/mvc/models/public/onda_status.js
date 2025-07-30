import {DataTypes, Sequelize} from "sequelize";
import db from "../../../db/connMysql.js";

//utils
import json from "../../utils/formatar/json.js";
import validate from "../../utils/formatar/validate.js";
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

const tableName = "onda_status";
// Relacionamentos com o user da imobiliária

const onda_status = class onda_status {
    static metodo() {
        return db.define(tableName, {
            statusId: {
                field: "onda_status_id",
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                validate: validate.name("statusId").notNull().notEmpty().isInt().isNumeric().build(),
            },
            statusDescricao: {
                field: "onda_status_descricao",
                type: DataTypes.STRING(250),
                allowNull: false,
                requere: true,
                validate: validate.name("statusDescricao").notEmpty().notNull().build(),
            },
            statusSetor: {
                field: "onda_status_setor",
                type: DataTypes.INTEGER,
                allowNull: false,
                requere: true,
                validate: validate.name("statusSetor").notEmpty().isInt().isNumeric().notNull().build(),
            },
        });
    }

    static async getOneNotRes() {}

    static async getAllNotRes() {
        const results = await executarQuery(`
            SELECT * FROM onda_status
        `);

        return results;
    }

    static async patchNotRes() {}

    static async getAllIdSeparadosPorArraySetor() {
        const results = await this.getAllNotRes();

        const reagruparIdsEmArrayDeString = results.reduce((resultado, item) => {
            if (!resultado[item?.onda_status_setor]) {
                resultado[item?.onda_status_setor] = [];
            }
            resultado[item?.onda_status_setor].push(item?.onda_status_id);

            return resultado;
        });

        return reagruparIdsEmArrayDeString;
    }

    static async getArrayStatusSinistro() {
        const statusSetorSinistro = await executarQuery(`SELECT * FROM onda_status WHERE onda_status_setor = 'sinistro'`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar status sinistro!"});
        });

        if (statusSetorSinistro.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar status sinistro!"});
        }

        const arrayStatus = await json.keyToArrayString(statusSetorSinistro, "onda_status_id");

        return arrayStatus;
    }

    static async getArrayStatusCobranca() {
        const statusSetorSinistro = await executarQuery(`SELECT * FROM onda_status WHERE onda_status_setor = 'cobranca'`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar status cobrança!"});
        });

        if (statusSetorSinistro.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar status cobrança!"});
        }

        const arrayStatus = await json.keyToArrayString(statusSetorSinistro, "onda_status_id");

        return arrayStatus;
    }
};

export default onda_status;
