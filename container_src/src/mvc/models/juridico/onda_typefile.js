import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_typefile";

const onda_typefile = db.define(
    tableName,
    {
        onda_typefile_id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        onda_typefile_tipo: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        onda_typefile_nome: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        onda_typefile_obrigatorio: {
            type: DataTypes.TINYINT(1),
            allowNull: true,
        },
        onda_typefile_setor: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
    },
    {
        tableName: tableName,
        timestamps: false,
    }
);

export default onda_typefile;
