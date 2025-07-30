import { DataTypes, Sequelize } from "sequelize";
import db from "../../../db/connMysql.js";

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";

//UTILS
import validate from "../../utils/formatar/validate.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";

const tableName = "onda_permissao";

const onda_permissao = class onda_permissao {
    static metodo() {
        return db.define(
            tableName,
            {
                permissaoMatrix: {
                    field: "onda_permissao_matrix",
                    type: DataTypes.STRING(45),
                    primaryKey: true,
                    allowNull: false,
                    validate: validate.name("permissaoMatrix").notNull().notEmpty().build(),
                },
                permissaoCriacao: {
                    field: "onda_permissao_criacao",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("permissaoComercial").notNull().notEmpty().isDate().build(),
                },
                permissaoComercial: {
                    field: "onda_permissao_comercial",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoComercial")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoAnalise: {
                    field: "onda_permissao_analise",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoAnalise")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoJuridico: {
                    field: "onda_permissao_juridico",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoJuridico")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoSinistro: {
                    field: "onda_permissao_sinistro",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoSinistro")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoVistoria: {
                    field: "onda_permissao_vistoria",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoVistoria")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoCobranca: {
                    field: "onda_permissao_cobranca",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoCobranca")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoFinanceiro: {
                    field: "onda_permissao_financeiro",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoFinanceiro")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },

                permissaoDashboardComercial: {
                    field: "onda_permissao_dashboard_comercial",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardComercial")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardAnalise: {
                    field: "onda_permissao_dashboard_analise",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardAnalise")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardFinanceiro: {
                    field: "onda_permissao_dashboard_financeiro",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardFinanceiro")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardSinistro: {
                    field: "onda_permissao_dashboard_sinistro",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardSinistro")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardJuridico: {
                    field: "onda_permissao_dashboard_juridico",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardJuridico")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardCobranca: {
                    field: "onda_permissao_dashboard_cobranca",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardCobranca")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardVistoria: {
                    field: "onda_permissao_dashboard_vistoria",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardVistoria")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardImobiliaria: {
                    field: "onda_permissao_dashboard_imobiliaria",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardImobiliaria")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardParceiro: {
                    field: "onda_permissao_dashboard_parceiro",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardParceiro")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDashboardExecutivo: {
                    field: "onda_permissao_dashboard_executivo",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoDashboardExecutivo")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static erroValidate(err) {
        if (err instanceof Sequelize.ValidationError) {
            const messages = err.errors.map((item) => item.message);
            return setResponse.SCHEMA_VALIDATION(messages);
        } else {
            return setResponse.DATABASE_ERROR({ message: "Erro onda permissão!" });
        }
    }

    static async getOneNotRes(cod) {
        const results = await onda_permissao
            .metodo()
            .findOne({ where: { permissaoMatrix: cod } })
            .catch((err) => {
                return setResponse.DATABASE_ERROR({ message: "Erro ao buscar permissões!" });
            });

        return results;
    }

    static async createNotRes(dadosBody, cod) {
        const newPermissao = { ...dadosBody, permissaoMatrix: cod };

        const resultsUser = await onda_permissao
            .metodo()
            .create(newPermissao)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (resultsUser.length === 0) {
            return setResponse.WARNING({ message: "Não foi possivel cadastrar!" });
        }

        return resultsUser;
    }

    static async patchNotRes(dadosBody, cod) {
        const [results] = await onda_permissao
            .metodo()
            .update(dadosBody, { where: { permissaoMatrix: cod } })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }
};

export default onda_permissao;
