import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

//helpers
import setResponse from "../../../helpers/response/setResponse.js";
import servicesCobrancaValidate from "../../services/cobranca/validate/servicesCobrancaValidate.js";

const tableName = "onda_cobranca_unificada";

const onda_cobranca_unificada = class onda_cobranca_unificada {
    static metodo() {
        return db.define(
            tableName,
            {
                cobrancaId: {
                    type: DataTypes.INTEGER(11),
                    primaryKey: true,
                    autoIncrement: true,
                    field: "onda_cobranca_id",
                },
                cobrancaCodigoUnificado: {
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    field: "onda_cobranca_codigo_unificado",
                },
                conbracaCodigoReferencia: {
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                    field: "onda_cobranca_referencia",
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }
};

export default onda_cobranca_unificada;
