import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

//Relacionamentos
const tableName = "onda_calendario_vistorias";

const onda_calendario_vistorias = db.define(
    tableName,
    {
        onda_calendario_vistorias_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        onda_calendario_vistorias_codigo: {
            type: DataTypes.STRING(30),
            allowNull: false,
            requere: true,
        },
        onda_calendario_vistorias_dia: {
            type: DataTypes.DATE,
            allowNull: false,
            requere: true,
        },
        onda_calendario_vistorias_dia_disponivel: {
            type: DataTypes.STRING(10),
            allowNull: false,
            requere: true,
        },
        onda_calendario_retirada_chaves: {
            type: DataTypes.STRING(350),
            allowNull: false,
            requere: true,
        },
        onda_calendario_vistorias_tipo: {
            type: DataTypes.STRING(25),
            allowNull: false,
            requere: true,
        },
        onda_calendario_vistorias_contrato: {
            type: DataTypes.STRING(50),
            allowNull: false,
            requere: true,
        },
        onda_calendario_vistorias_status: {
            type: DataTypes.INTEGER(11),
            defaultValue: 119,
            allowNull: false,
            requere: true,
        },
    },
    {
        tableName: tableName,
        timestamps: false,
    }
);

export default onda_calendario_vistorias;
