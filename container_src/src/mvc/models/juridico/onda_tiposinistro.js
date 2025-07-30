import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_tiposinistro";

//helpers
import setResponse from "../../../helpers/response/setResponse.js";
import json from "../../utils/formatar/json.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

const onda_tiposinistro = class onda_tiposinistro {
    static metodo() {
        return db.define(
            tableName,
            {
                onda_tiposinistro_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                onda_tiposinistro_desc: {
                    type: DataTypes.STRING(250),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async arrayIdTipoSinistro() {
        const statusSetorSinistro = await executarQuery(`SELECT *  FROM onda_tiposinistro`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar tipo sinistro!"});
        });

        if (statusSetorSinistro.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar tipo sinistro!"});
        }

        const arrayStatus = await json.keyToArrayNumber(statusSetorSinistro, "onda_tiposinistro_id");

        return arrayStatus;
    }
};

export default onda_tiposinistro;
