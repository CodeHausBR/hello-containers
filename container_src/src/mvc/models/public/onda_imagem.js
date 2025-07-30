import {DataTypes, Sequelize} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_imagem";

const onda_imagem = db.define(
    tableName,
    {
        onda_imagem_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        onda_imagem_matrix: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
        },
        onda_imagem_date: {
            type: DataTypes.DATE,
            allowNull: false,
            require: true,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        onda_imagem_original_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        onda_imagem_typefile_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: tableName,
        timestamps: false,
    }
);

export default onda_imagem;
