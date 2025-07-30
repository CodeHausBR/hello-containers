import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_notificacao";

const onda_notificacao = db.define(
    tableName,
    {
        onda_notificacao_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        onda_notificacao_mensagem: {
            type: DataTypes.STRING(250),
        },
        onda_notificacao_departamento: {
            type: DataTypes.STRING(250),
        },
        onda_notificacao_lido: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },

    {
        tableName: tableName,
        timestamps: false,
    }
);

export default onda_notificacao;
