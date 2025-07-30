import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_locatario";

const onda_locatario = db.define(
    tableName,
    {
        onda_locatario_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        onda_locatario_codigo: {
            type: DataTypes.STRING(45),
            primaryKey: true,
            allowNull: false,
            requere: true,
        },
        onda_locatario_cnpjcpf: {
            type: DataTypes.STRING(50),
        },
        onda_locatario_nome: {
            type: DataTypes.STRING(200),
        },
        onda_locatario_renda: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_rg: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_telefone: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_celular: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_email: {
            type: DataTypes.STRING(50),
        },
        onda_locatario_cep: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_rua: {
            type: DataTypes.STRING(250),
        },
        onda_locatario_numero: {
            type: DataTypes.STRING(10),
        },
        onda_locatario_bairro: {
            type: DataTypes.STRING(100),
        },
        onda_locatario_complemento: {
            type: DataTypes.STRING(200),
        },
        onda_locatario_cidade: {
            type: DataTypes.STRING(150),
        },
        onda_locatario_uf: {
            type: DataTypes.STRING(2),
        },
        onda_locatario_copart1: {
            type: DataTypes.STRING(150),
        },
        onda_locatario_copart1renda: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_copart1cpf: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_copart1rg: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_copart2: {
            type: DataTypes.STRING(150),
        },
        onda_locatario_copart2renda: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_copart2cpf: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_copart2rg: {
            type: DataTypes.STRING(30),
        },
        onda_locatario_imob: {
            type: DataTypes.INTEGER,
        },
        onda_locatario_valoraluguel: {
            type: DataTypes.DOUBLE,
        },
        onda_locatario_criadopor: {
            type: DataTypes.INTEGER,
        },
        onda_locatario_datacriacao: {
            type: DataTypes.TIME,
        },
        onda_locatario_alteradopor: {
            type: DataTypes.INTEGER,
        },
        onda_locatario_dataalteracao: {
            type: DataTypes.TIME,
        },
        onda_locatario_status: {
            type: DataTypes.INTEGER(3),
        },
    },
    {
        tableName: tableName,
        timestamps: false,
    }
);

export default onda_locatario;
