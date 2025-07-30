import { DataTypes } from "sequelize";
import db from "../../../db/connMysql.js";

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";

//UTILS
import validate from "../../utils/formatar/validate.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";

//MODELS
import onda_permissao from "./onda_permissao.js";

const tableName = "onda_colaborador";

const onda_colaborador = class onda_colaborador {
    static metodo() {
        return db.define(
            tableName,
            {
                colaboradorId: {
                    field: "onda_colaborador_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    validate: validate.name("colaboradorId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                colaboradorCodigo: {
                    field: "onda_colaborador_codigo",
                    type: DataTypes.STRING,
                    allowNull: false,
                    requere: true,
                    defaultValue: gerarCondigoSetores("COLA"),
                    validate: validate.name("colaboradorCodigo").notNull().notEmpty().build(),
                },
                colaboradorName: {
                    field: "onda_colaborador_name",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("colaboradorName").notNull().notEmpty().build(),
                },
                colaboradorEmail: {
                    field: "onda_colaborador_email",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("colaboradorEmail").notNull().notEmpty().build(),
                },
                colaboradorPassword: {
                    field: "onda_colaborador_password",
                    type: DataTypes.STRING(300),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("colaboradorPassword").notNull().notEmpty().build(),
                },
                colaboradorPhone: {
                    field: "onda_colaborador_phone",
                    type: DataTypes.STRING(25),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("colaboradorPhone").notNull().notEmpty().build(),
                },
                colaboradorImobId: {
                    field: "onda_colaborador_imob_id",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    validate: validate.name("colaboradorImobId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                colaboradorCpfcnpj: {
                    field: "onda_colaborador_cpfcnpj",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("colaboradorCpfcnpj").notNull().notEmpty().build(),
                },
                colaboradorStatusRegister: {
                    field: "onda_colaborador_status_register",
                    type: DataTypes.TINYINT(3),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("colaboradorStatusRegister").notNull().notEmpty().isInt().isNumeric().build(),
                },
                colaboradorDatacriacao: {
                    field: "onda_colaborador_datacriacao",
                    type: DataTypes.DATE,
                    allowNull: true,
                    allowNull: false,
                    requere: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("colaboradorDatacriacao").notNull().notEmpty().isDate().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async getAllNotRes() {
        try {
            const results = await onda_colaborador
                .metodo()
                .findAll({
                    butes: {
                        field: "attributes",
                        exclude: ["userPass"],
                    },
                })
                .catch((err) => {
                    return setResponse.DATABASE_ERROR({ message: "Erro ao buscar usuários!" });
                });

            return setResponse.SUCCESS({ results: results, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getOneNotRes() {
        try {
            const { cod } = req?.params;
            const permisoes = await onda_permissao.getOneNotRes(cod);
            const userOnda = await onda_colaborador.getOneNotRes(cod);

            return setResponse.SUCCESS({
                ts: {
                    field: "results",
                    permisoes,
                    userOnda,
                },
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async patchNotRes() {
        try {
            const { cod } = req?.params;
            const { userOnda, permisoes } = req?.body;

            const resultsUser = await onda_colaborador
                .metodo()
                .update(userOnda, {
                    where: {
                        field: "where",
                        userCodigo: cod,
                    },
                })
                .catch((err) => {
                    return onda_colaborador.erroValidate(err);
                });

            if (resultsUser.length === 0) {
                return setResponse.WARNING({ message: "Não foi possivel atualizar o  usuário!" });
            }

            await onda_permissao.patchNotRes(permisoes, cod);

            const results = {
                userOnda: await onda_colaborador.getOneNotRes(cod),
                permisoes: await onda_permissao.getOneNotRes(cod),
            };

            return setResponse.SUCCESS({ results: results, message: "Usuário atualizado com sucesso!", res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async createNotRes() {
        try {
            const { userOnda, permisoes } = req?.body;

            const resultsUser = await onda_colaborador
                .metodo()
                .create(userOnda)
                .catch((err) => {
                    return onda_colaborador.erroValidate(err);
                });

            if (resultsUser.length === 0) {
                return setResponse.WARNING({ message: "Não foi possivel cadastrar usuário!" });
            }

            const userPermisoes = await onda_permissao.createNotRes(permisoes, resultsUser?.userCodigo);

            const results = {
                userOnda: resultsUser,
                permisoes: userPermisoes,
            };

            return setResponse.SUCCESS({ results: results, message: "Cadastro realizado com sucesso!", res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static verifyEmailExists(email) {}
};

export default onda_colaborador;
