import db from "../../../db/connMysql.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import validate from "../../utils/formatar/validate.js";
import setResponse from "../../../helpers/response/setResponse.js";
import {DataTypes, Op} from "sequelize";

const tableName = "onda_user_permissoes";

const onda_user_permissoes = class onda_user_permissoes {
    constructor(data = {}) {
        this.id = data.id || null;
        this.user_id = data.user_id || null;
        this.tem_permissao = data.tem_permissao || false;
        this.item_catalogo_id = data.item_catalogo_id || null;
        this.last_update_user = data.last_update_user || null;
        this.created_date = data.created_date || new Date();
        this.last_update_user = data.last_updated_data || new Date();
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
                userId: {
                    field: "user_id",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    validate: validate.name("userId").notEmpty().notNull().isInt().build(),
                },
                tem_permissao: {
                    field: "tem_permissao",
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    validate: validate.name("temPermissao").notNull().build(),
                },
                temPermissao: {
                    field: "tem_permissao",
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    validate: validate.name("temPermissao").notNull().build(),
                },
                itemCatalogoId: {
                    field: "item_catalogo_id",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    validate: validate.name("itemCatalogoId").notEmpty().notNull().isInt().build(),
                },
                lastUpdateUser: {
                    field: "last_update_user",
                    type: DataTypes.INTEGER,
                },
                createdDate: {
                    field: "created_date",
                    type: DataTypes.DATE,
                    defaultValue: new Date(),
                },
                lastUpdateDate: {
                    field: "last_updated_date",
                    type: DataTypes.DATE,
                    defaultValue: new DATE(),
                },
            },
            {
                tableName,
                timestamps: false,
            }
        );
    }

    static async getUserPermissions(userId) {
        const query = `
        SELECT
            c.metodo,
            c.desc AS rota
        FROM
            onda_user_permissoes p
        INNER JOIN
            onda_permissoes_catalogo c ON c.id = p.item_catalogo_id
        WHERE
            p.user_id = ? AND p.tem_permissao = 1`;

        try {
            const permissoes = await executarQuery(query, [userId]);
            return permissoes.map((perm) => {
                return `${perm.metodo.toUpperCase()}:${perm.rota}`;
            });
        } catch (error) {
            throw setResponse.DATABASE_ERROR({message: "Erro ao buscar permissões do usuário!"});
        }
    }

    static async insertUserPermissoes({userId, catalogoId, lastUpdateUser, temPermissao}) {
        const query = `
            INSERT INTO onda_user_permissoes
            (user_id, item_catalogo_id, tem_permissao, last_update_user, created_date, last_updated_date) VALUES
            (?, ?, ?, ?, NOW(), NOW())
        `;
        try {
            await executarQuery(query, [userId, catalogoId, temPermissao, lastUpdateUser]);
        } catch (error) {
            throw setResponse.DATABASE_ERROR({message: "Erro ao atualizar permissões do usuário!"});
        }
    }
};

export default onda_user_permissoes;
