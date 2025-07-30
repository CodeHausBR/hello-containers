import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

const tableName = "onda_tipopagamento";

//relpers
import setResponse from "../../../helpers/response/setResponse.js";

const onda_tipopagamento = class onda_tipopagamento {
    static metodo() {
        return db.define(
            tableName,
            {
                value: {
                    type: DataTypes.INTEGER,
                    field: "onda_tipopagamento_id",
                    primaryKey: true,
                    autoIncrement: true,
                },
                label: {
                    field: "onda_tipopagamento_descricao",
                    type: DataTypes.STRING(250),
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
            const results = await onda_tipopagamento
                .metodo()
                .findAll()
                .catch(() => {
                    return setResponse.DATABASE_ERROR({message: "Erro ao buscar tipo pagamento"});
                });

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default onda_tipopagamento;
