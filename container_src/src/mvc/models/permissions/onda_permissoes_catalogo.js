import db from "../../../db/connMysql.js";
import validate from "../../utils/formatar/validate.js";
import {DataTypes, Op} from "sequelize";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

const tableName = "onda_permissoes_catalogo";

const onda_permissoes_catalogo = class onda_permissoes_catalogo {
    constructor(data = {}) {
        this.id = data.id || null;
        this.metodo = data.metodo || "";
        this.user_cod = data.user_cod || "";
        this.setor_id = data.setor_id || null;
        this.setor_desc = data.setor_desc || "";
        this.desc = data.desc || "";
        this.nome = data.nome || "";
        this.servico = data.servico || "";
        this.created_date = data.created_date || new Date();
        this.updated_date = data.updated_date || new Date();
    }

    static metodo() {
        return db.define(
            tableName,
            {
                id: {
                    field: "id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                metodo: {
                    field: "metodo",
                    type: DataTypes.STRING(10),
                    allowNull: true,
                    validate: validate
                        .name("metodo")
                        .isEn([["GET", "POST", "PUT", "PATHC", "DELETE"]])
                        .build(),
                },
                userCod: {
                    field: "user_cod",
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    validate: validate.name("userCod").notEmpty().notNull().build(),
                },
                setorId: {
                    field: "setor_id",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    validate: validate.name("setorId").notEmpty().notNull().isInt().build(),
                },
                setorDesc: {
                    field: "setor_desc",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    validate: validate.name("setorDesc").notEmpty().notNull().build(),
                },
                desc: {
                    field: "desc",
                    type: DataTypes.STRING(300),
                    allowNull: false,
                    validate: validate.name("desc").notEmpty().notNull().build(),
                },
                nome: {
                    field: "nome",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    validate: validate.name("nome").notEmpty().notNull().build(),
                },
                servico: {
                    field: "servico",
                    type: DataTypes.STRING(10),
                    allowNull: false,
                    validate: validate
                        .name("servico")
                        .notEmpty()
                        .notNull()
                        .isIn([["front", "back"]])
                        .build(),
                },
                createdDate: {
                    field: "created_date",
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: new Date(),
                },
                updatedDate: {
                    field: "updated_date",
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: new Date(),
                },
            },
            {
                tableName,
                timestamps: false,
            }
        );
    }

    static async getAllPermissoesByUser(matrix) {
        const query = "SELECT * FROM onda_permissoes_catalogo";
        try {
            const catalogo = await executarQuery(query, []);
            return catalogo;
        } catch (error) {
            throw setResponse.DATABASE_ERROR({message: "Erro ao buscar permissões do usuário!"});
        }
    }

    static async insertCatalogoPermissoes({metodo, matrix, setorId, setorDesc, desc, nome, servico}) {
        const query = `
            INSERT INTO onda_permissoes_catalogo
            (metodo, user_cod, setor_id, setor_desc, desc, nome, servico, created_date, updated_date) VALUES
            (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        try {
            await executarQuery(query, [metodo, matrix, setorId, setorDesc, desc, nome, servico]);
        } catch (error) {
            throw setResponse.DATABASE_ERROR({message: "Erro ao atualizar permissões do usuário!"});
        }
    }
};

export default onda_permissoes_catalogo;
