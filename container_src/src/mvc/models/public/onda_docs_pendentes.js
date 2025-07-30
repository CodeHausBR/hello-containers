import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

//Relacionamentos
const tableName = "onda_docs_pendentes";

const onda_docs_pendentes = db.define(
    tableName,
    {
        onda_docs_pendentes_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        onda_docs_pendentes_contrato: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        onda_docs_pendentes_typefile_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        onda_docs_pendentes_recebido: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        timestamps: false,
        tableName: tableName,
    }
);

export default onda_docs_pendentes;
