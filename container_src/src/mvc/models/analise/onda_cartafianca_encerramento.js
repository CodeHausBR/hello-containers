//TYPES
import BigNumber from "bignumber.js";
import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";
import yup from "yup";
import onda_errors from "../public/onda_errors.js";
import setResponse from "../../../helpers/response/setResponse.js";

//HELPERS

//MODELS

const tableName = "onda_cartafianca_encerramento";

const onda_cartafianca_encerramento = class onda_cartafianca_encerramento {
    static metodo() {
        return db.define(
            tableName,
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    field: "onda_cartafianca_encerramento_id",
                },
                locatario: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    field: "onda_cartafianca_encerramento_locatario",
                },
                contrato: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    field: "onda_cartafianca_encerramento_contrato",
                },
                dataEntradaImovel: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "onda_cartafianca_encerramento_dataentradaimovel",
                },
                dataEntregaChaves: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "onda_cartafianca_encerramento_dataentregachaves",
                },
                dataCancelamentoFianca: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: "onda_cartafianca_encerramento_datacancelamentofianca",
                },
                motivo: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_encerramento_motivo",
                },
                tipoEncerramento: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: "onda_cartafianca_encerramento_tipoencerramento",
                },
                valorTotal: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: true,
                    field: "onda_cartafianca_encerramento_valortotal",
                },
                observacao: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    field: "onda_cartafianca_encerramento_observacao",
                },
                chaveTransferencia: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: "onda_cartafianca_encerramento_chavetransferencia",
                },
                imobiliaria: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: "onda_cartafianca_encerramento_imobiliaria",
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }
    static async createNotRes({data}) {
        const results = await onda_cartafianca_encerramento
            .metodo()
            .create(data)
            .catch(async (err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({message: "Não foi possivel cadastrar evento de encerramento para a carta fiança!"});
        }

        return results;
    }

    static async getOneById({id}) {
        const results = await onda_cartafianca_encerramento
            .metodo()
            .findOne({
                where: {
                    id,
                },
            })
            .catch(async (err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (!results) {
            return setResponse.WARNING({message: "Não foi possível buscar evento de encerramento pelo ID!"});
        }

        return results;
    }
};

export default onda_cartafianca_encerramento;
