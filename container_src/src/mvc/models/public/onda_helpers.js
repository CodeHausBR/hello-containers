import {DataTypes, Sequelize} from "sequelize";
import db from "../../../db/connMysql.js";

//BIBLIOTECAS
import yup from "yup";
import connPRODDESKTOP from "../../../db/connPRODDESKTOP.js";
import connSANDBOX from "../../../db/connSANDBOX.js";
//HELPERS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import setResponse from "../../../helpers/response/setResponse.js";
import validate from "../../utils/formatar/validate.js";

//models
import onda_cartafianca from "../analise/onda_cartafianca.js";
import onda_config_taxas from "../analise/onda_config_taxas.js";
import onda_contas from "../financeiro/onda_contas.js";
import onda_user from "../users/onda_user.js";

const tableName = "onda_helpers";

const onda_helpers = class onda_helpers {
    static metodo() {
        return db.define(
            tableName,
            {
                helpersId: {
                    field: "onda_helpers_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    requere: true,
                    allowNull: false,
                    validate: validate.name("helpersId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                helpersDescricao: {
                    field: "onda_helpers_descricao",
                    type: DataTypes.STRING(250),
                    requere: true,
                    allowNull: false,
                    validate: validate.name("helpersDescricao").notNull().notEmpty().build(),
                },
                helpersPermissao: {
                    field: "onda_helpers_permissao",
                    type: DataTypes.INTEGER,
                    requere: true,
                    allowNull: false,
                    defaultValue: 1,
                    validate: validate.name("helpersPermissao").notNull().notEmpty().build(),
                },
                helperSetor: {
                    field: "onda_helpers_setor",
                    type: DataTypes.STRING(45),
                    requere: true,
                    allowNull: false,
                    validate: validate.name("helpersSetor").notNull().notEmpty().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }
    static async validate({dadosBody = Object()}) {
        const schema = yup.object().shape({
            helpersId: yup.number().required("Obrigatório Id"),
            helpersDescricao: yup.string().max(45).required("Obrigatório descrição"),
            helpersPermissao: yup.number().required("Obrigatório a permissão"),
            helperSetor: yup.string().max(45).required("Obrigatório setor"),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static erroValidate(err) {
        if (err instanceof Sequelize.ValidationError) {
            const messages = err.errors.map((item) => item.message);
            return setResponse.SCHEMA_VALIDATION(messages);
        } else {
            return setResponse.DATABASE_ERROR({message: "Erro onda helper!"});
        }
    }

    static async getAll(req, res) {
        try {
            const [results, ondaUsers, arrayAnos, taxasCartaFianca, uf] = await Promise.all([
                onda_helpers.getAllNotRes(),
                onda_user.getAllAgrupadoPorCargo(),
                onda_contas.getArrayDeAnos(),
                onda_config_taxas.buscarUltimaTaxaCadastradaFormatada(),
                onda_cartafianca.buscarEstadosEAgrupar(),
            ]);

            const agrupadosPorSetor = results.reduce((resultado, item) => {
                // Se o setor ainda não existe no resultado, adicione-o
                if (!resultado[item.setor]) {
                    resultado[item.setor] = [];
                }

                // Adicione o item ao setor correspondente
                resultado[item.setor].push(item);

                return resultado;
            }, {});

            return setResponse.SUCCESS({results: Object.assign(ondaUsers, arrayAnos, agrupadosPorSetor, taxasCartaFianca, uf), res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getAllNotRes() {
        const results = await onda_helpers
            .metodo()
            .findAll({
                raw: true,
                order: [["onda_helpers_descricao", "ASC"]],
                attributes: [
                    ["onda_helpers_id", "value"],
                    ["onda_helpers_descricao", "label"],
                    ["onda_helpers_permissao", "permissao"],
                    ["onda_helpers_setor", "setor"],
                ],
            })
            .catch((err) => {
                return onda_helpers.erroValidate(err);
            });

        return results;
    }

    static async getAllIdSeparadosPorArrayStringSetor() {
        const results = await this.getAllNotRes();

        const reagruparIdsEmArrayDeString = results.reduce((resultado, item) => {
            if (!resultado[item?.setor]) {
                resultado[item?.setor] = [];
            }
            resultado[item?.setor].push(item?.value);

            return resultado;
        });

        return reagruparIdsEmArrayDeString;
    }

    static async putOndaHelpers({dadosBody, id}) {
        const {helpers} = dadosBody;

        const arrayHelpers = [];
        for (const item of helpers) {
            const dadosValidados = await this.validate({dadosBody: item});
            arrayHelpers.push(dadosValidados);
        }

        for (const item of arrayHelpers) {
            await new Promise(async (results, reject) => {
                await this.metodo()
                    .update(
                        {
                            helpersDescricao: item?.helpersDescricao,
                            helpersPermissao: item?.helpersPermissao,
                        },
                        {where: {helpersId: item?.helpersId}}
                    )
                    .catch((error) => reject());

                return results();
            }).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao salvar os dados do helpers"});
            });
        }
    }

    static async buscarConsultaApiCpfCnpjSetada() {
        const [helpersAnalise] = await executarQuery(`
                SELECT * FROM onda_helpers
                WHERE onda_helpers_setor = 'consultaApi' AND onda_helpers_permissao = '1'
            `)
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar helpers para realizar análise"});
            })
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar taxas"});
            });

        return helpersAnalise;
    }

    static async tipoArquivoSinistro(req, res) {
        const dadosBody = req?.body;

        const schema = yup.object().shape({
            setor: yup.string().nullable(),
            tipo: yup.string().nullable(),
        });

        const dadosValidados = await yupSchemaValidate(schema, dadosBody, {abortEarly: false});

        if (dadosValidados?.setor?.length > 0 && dadosValidados?.tipo?.length > 0) {
            return setResponse.WARNING({message: "Não pode utilizar os dois filtros juntos!", res: res});
        }

        const tiposArquivosSinistro = await executarQuery(`
            SELECT * FROM VW_TYPEFILE
            ${filtroWhereSetor()}
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar tipos arquivo!"});
        });

        function filtroWhereSetor() {
            if (dadosValidados?.setor) {
                return `  WHERE tipoArquivoSetor = '${dadosValidados?.setor}'`;
            }
            if (dadosValidados?.tipo) {
                return `  WHERE tipeFile = '${dadosValidados?.tipo}'`;
            }
            return ``;
        }

        return setResponse.SUCCESS({message: "Sucesso ao buscar tipo arquivo!", res: res, results: tiposArquivosSinistro});
    }

    static async buscarHelpersFiltrado(req, res) {
        try {
            let query = `
            SELECT 
                onda_helpers_id AS id,
                onda_helpers_descricao AS value,
                onda_helpers_setor AS onda_helpers_setor
            FROM 
            onda_helpers
            `;

            let query2 = `
            SELECT 
                onda_status_id AS id,
                onda_status_descricao AS value,
                onda_status_setor AS onda_status_setor
            FROM 
            onda_status
            `;

            let query3 = `
                SELECT 
                    onda_tipopagamento_id AS id,
                    onda_tipopagamento_descricao AS value,
                    onda_tipopagamento_setor AS onda_status_setor
                FROM 
                onda_tipopagamento
                WHERE onda_tipopagamento_id NOT IN (1)
            `;

            const [helpers, status, onda_tipopagamento] = await Promise.all([
                executarQuery(query).catch((e) => {
                    return setResponse.DATABASE_ERROR({message: "Erro ao buscar helpers!"});
                }),

                executarQuery(query2).catch((e) => {
                    return setResponse.DATABASE_ERROR({message: "Erro ao buscar helpers!"});
                }),

                executarQuery(query3).catch((e) => {
                    return setResponse.DATABASE_ERROR({message: "Erro ao buscar helpers!"});
                }),
            ]);

            const [map, map1, map3] = await Promise.all([
                helpers.reduce((acc, row) => {
                    acc[row.onda_helpers_setor] = acc[row.onda_helpers_setor] || [];
                    acc[row.onda_helpers_setor].push({id: row.id, value: row.value});
                    return acc;
                }, {}),

                status.reduce((acc, row) => {
                    acc[row.onda_status_setor] = acc[row.onda_status_setor] || [];
                    acc[row.onda_status_setor].push({id: row.id, value: row.value});
                    return acc;
                }, {}),

                onda_tipopagamento.reduce((acc, row) => {
                    acc[row.onda_status_setor] = acc[row.onda_status_setor] || [];
                    acc[row.onda_status_setor].push({id: row.id, value: row.value});
                    return acc;
                }, {}),
            ]);

            const results = {
                helpers: map,
                status: map1,
                tipoPagamento: map3,
            };

            return setResponse.SUCCESS({message: "Sucesso ao buscar status e helpers!", res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarArrayIdHelpersStatus() {
        try {
            let query = `
            SELECT 
                onda_helpers_id AS i,
                onda_helpers_setor AS s
            FROM 
            onda_helpers
            `;

            let query2 = `
            SELECT 
                onda_status_id AS i,
                onda_status_setor AS s
            FROM 
            onda_status
            `;

            let query3 = `
                SELECT 
                    onda_tipopagamento_id AS i, 
                    onda_tipopagamento_setor AS s
                
                FROM 
                    onda_tipopagamento
                   WHERE onda_tipopagamento_id NOT IN (1)
            `;

            const helpers = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar helpers!"});
            });

            const status = await executarQuery(query2).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
            });

            const onda_tipopagamento = await executarQuery(query3).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
            });

            const [map, map1, map2] = await Promise.all([
                helpers.reduce((acc, row) => {
                    acc[row.s] = acc[row.s] || [];
                    acc[row.s].push(row.i);
                    return acc;
                }, {}),

                status.reduce((acc, row) => {
                    acc[row.s] = acc[row.s] || [];
                    acc[row.s].push(row.i);
                    return acc;
                }, {}),

                onda_tipopagamento.reduce((acc, row) => {
                    acc[row.s] = acc[row.s] || [];
                    acc[row.s].push(row.i);
                    return acc;
                }, {}),
            ]);

            const results = {
                helpers: map,
                status: map1,
                tipoPagamento: map2,
            };

            return results;
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarRelatorioHelpers(req, res) {
        try {
            const query1 = `
                SELECT 
                    *
                FROM onda_status 
            `;

            const helpersSandbox = await connSANDBOX(query1).catch((e) => {
                return setResponse.WARNING({message: "Erro ao bucar log lick!"});
            });

            const helpersProducao = await connPRODDESKTOP(query1).catch((e) => {
                return setResponse.WARNING({message: "Erro ao bucar log lick!"});
            });

            const relatorio = {
                producao: helpersProducao.map((item) => ({
                    ...item,
                    cor: helpersSandbox.some(
                        (s) => s.onda_status_id === item.onda_status_id && s.onda_status_descricao === item.onda_status_descricao && s.onda_status_setor === item.onda_status_setor
                    )
                        ? "#FFFF"
                        : "red",
                })),
                sandbox: helpersSandbox.map((item) => ({
                    ...item,
                    cor: helpersProducao.some((p) => p.onda_status_id === item.onda_status_id) ? "#FFFF" : "red",
                })),
            };

            return setResponse.SUCCESS({message: "Sucesso ao buscar log click!", results: relatorio, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async buscarRelatorioStatus(req, res) {
        try {
            const query1 = `
            SELECT 
              *
            FROM onda_helpers 
          `;

            const helpersSandbox = await connSANDBOX(query1).catch((e) => {
                return setResponse.WARNING({message: "Erro ao buscar helpers!"});
            });

            const helpersProducao = await connPRODDESKTOP(query1).catch((e) => {
                return setResponse.WARNING({message: "Erro ao buscar helpers!"});
            });

            const relatorio = {
                producao: helpersProducao.map((item) => ({
                    ...item,
                    cor: helpersSandbox.some(
                        (s) =>
                            s.onda_helpers_id === item.onda_helpers_id &&
                            s.onda_helpers_descricao === item.onda_helpers_descricao &&
                            s.onda_helpers_setor === item.onda_helpers_setor
                    )
                        ? "#FFFF"
                        : "red",
                })),
                sandbox: helpersSandbox.map((item) => ({
                    ...item,
                    cor: helpersProducao.some((p) => p.onda_helpers_id === item.onda_helpers_id) ? "#FFFF" : "red",
                })),
            };

            return setResponse.SUCCESS({message: "Sucesso ao buscar log click!", results: relatorio, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default onda_helpers;
