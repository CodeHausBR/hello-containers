import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

//HELPERS
import generateQuery from "../../../helpers/mysql/generate-query.js";
import setResponse from "../../../helpers/response/setResponse.js";

//UTILS
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import validate from "../../utils/formatar/validate.js";

const tableName = "onda_ar";

const onda_ar = class onda_ar {
    static metodo() {
        return db.define(
            tableName,
            {
                arId: {
                    field: "onda_ar_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("arId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                arMatrix: {
                    field: "onda_ar_matrix",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("arMatrix").len([0, 45]).build(),
                },
                arCriacao: {
                    field: "onda_ar_criacao",
                    type: DataTypes.TIME,
                    allowNull: false,
                    requere: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("arCriacao").len([11, 20]).build(),
                },
                arUser: {
                    field: "onda_ar_user",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("arUser").notEmpty().len([0, 200]).build(),
                },
                arDescricao: {
                    field: "onda_ar_descricao",
                    type: DataTypes.STRING(10000),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("arDescricao").notEmpty().len([0, 10000]).build(),
                },
                arAcao: {
                    field: "onda_ar_acao",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("arAcao").notEmpty().len([0, 200]).build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async validate(dadosBody) {
        const results = await onda_ar
            .metodo()
            .build(dadosBody)
            .validate()
            .then((response) => {
                return response?.dataValues;
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async getOneNotRes(cpf, token) {
        const results = await onda_ar
            .metodo()
            .findOne({
                where: {
                    arMatrix: cpf,
                },
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async getAllNotRes(token) {
        const results = await onda_ar
            .metodo()
            .findAll()
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async createNotRes(pesquisado, externo) {
        console.log(externo, " externo");
        const newObjt = {
            arMatrix: pesquisado?.cpf,
            arUser: pesquisado?.token,
            arDescricao: externo?.descricao,
            arAcao: externo?.juridico,
        };

        const retirarVazios = generateQuery.retirarkeysVazias(newObjt);
        const results = await onda_ar
            .metodo()
            .create(retirarVazios)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(`Erro ao salvar no alto risco: ${err}`);
            });

        if (results === 0) {
            return setResponse.WARNING({message: "Não foi possivel registrar no alto risco"});
        }

        return results;
    }

    static async patchNotRes(dadosBody, token, cpf) {
        //Chaves que não podem ser atualizadas de forma alguma:
        delete dadosBody?.arId;
        delete dadosBody?.arMatrix;

        const [results] = await onda_ar
            .metodo(token)
            .update(dadosBody, {where: {arMatrix: cpf}})
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }
};

export default onda_ar;
