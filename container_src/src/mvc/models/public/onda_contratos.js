import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_contratos";

const onda_contratos = db.define(
    tableName,
    {
        onda_contratos_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        onda_contratos_contrato: {
            type: DataTypes.STRING(30),
        },
        onda_contratos_ativo: {
            type: DataTypes.BOOLEAN,
        },
        onda_contratos_dias: {
            type: DataTypes.INTEGER,
        },
        onda_contratos_vencimento: {
            type: DataTypes.DATE,
        },
    },

    {
        tableName: tableName,
        timestamps: false,
    }
);

export default onda_contratos;
