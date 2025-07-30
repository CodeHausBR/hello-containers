import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_plataforma";

//relpers
import setResponse from "../../../helpers/response/setResponse.js";

const onda_plataforma = class onda_plataforma {
    static metodo() {
        return db.define(
            tableName,
            {
                value: {
                    type: DataTypes.INTEGER,
                    field: "idonda_plataforma_id",
                    primaryKey: true,
                    autoIncrement: true,
                },
                label: {
                    field: "onda_plataforma_desc",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    requere: true,
                },
                ativo: {
                    field: "idonda_plataforma_ativo",
                    type: DataTypes.TINYINT,
                    allowNull: false,
                    requere: true,
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async get(req, res) {
        try {
            const results = await onda_plataforma
                .metodo()
                .findAll()
                .catch(() => {
                    return setResponse.DATABASE_ERROR({message: "Erro ao buscar plataformas"});
                });

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default onda_plataforma;
