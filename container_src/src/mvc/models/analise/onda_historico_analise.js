import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

//HELPERS
import generateQuery from "../../../helpers/mysql/generate-query.js";
import setResponse from "../../../helpers/response/setResponse.js";

//UTILS
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import validate from "../../utils/formatar/validate.js";

const tableName = "onda_historico_analise";

const onda_historico_analise = class onda_historico_analise {
    static metodo() {
        return db.define(
            tableName,
            {
                historicoId: {
                    field: "onda_historico_analise_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("historicoId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                historicoMatrix: {
                    field: "onda_historico_analise_matrix",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("historicoMatrix").len([0, 45]).build(),
                },
                historicoCriacao: {
                    field: "onda_historico_analise_criacao",
                    type: DataTypes.TIME,
                    allowNull: false,
                    requere: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("historicoCriacao").notEmpty().build(),
                },
                historicoUser: {
                    field: "onda_historico_analise_user",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("historicoUser").notEmpty().len([0, 200]).build(),
                },

                historicoSistemaFonte: {
                    field: "onda_historico_analise_sistemafonte",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("historicoSistemaFonte").notEmpty().len([0, 200]).build(),
                },
                historicoAprovado: {
                    field: "onda_historico_analise_aprovado",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("historicoAprovado").notEmpty().len([0, 200]).build(),
                },
                historicoOrigemConsulta: {
                    field: "onda_historico_analise_origemconsulta",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("historicoOrigemConsulta").notEmpty().len([0, 200]).build(),
                },
                historicoNome: {
                    field: "onda_historico_analise_nome",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("historicoNome").notEmpty().len([0, 200]).build(),
                },
                historicoTotalDividas: {
                    field: "onda_historico_analise_totaldividas",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("historicoTotalDividas").notEmpty().len([0, 200]).build(),
                },
                historicoAcoes: {
                    field: "onda_historico_analise_acoesjudiciais",
                    type: DataTypes.STRING("n/a"),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("historicoAcoes").notEmpty().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async getOneNotRes(cpf, token) {
        const query = `
        SELECT * FROM onda_historico_analise WHERE onda_historico_analise_matrix = '${cpf}' ORDER BY onda_historico_analise_criacao DESC LIMIT 1;
        `;
        const results = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        });
        return results[0];
    }

    static async getAllNotRes(token) {
        const results = await onda_historico_analise
            .metodo()
            .findAll()
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    /**
     * Cria uma nova notificação de resposta.
     *
     * @param {Object} props - Um objeto contendo as propriedades necessárias para criar a notificação.
     * @param {Object} props.pesquisado - O termo ou item que foi pesquisado.
     * @param {string} props.origem - A origem da pesquisa ou solicitação.
     * @param {boolean} props.aprovado - Indica se a resposta foi aprovada.
     * @param {string} props.acoes - Uma lista de ações relacionadas à notificação.
     *
     * @returns {Promise} Uma promessa que resolve quando a notificação é criada com sucesso.
     */

    static async createNotRes(props) {
        const {pesquisado, aprovado, acoes} = props;

        const newHistorico = {
            historicoMatrix: pesquisado?.cpf,
            historicoUser: pesquisado?.token,
            historicoSistemaFonte: pesquisado?.cartafiancaFonte,
            historicoAprovado: aprovado,
            historicoOrigemConsulta: pesquisado?.origem,
            historicoNome: pesquisado?.nome,
            historicoTotalDividas: "",
            historicoAcoes: acoes,
        };
        const retirarVazios = generateQuery.retirarkeysVazias(newHistorico);

        const results = await onda_historico_analise
            .metodo()
            .create(retirarVazios)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(`Erro ao salvar o histórico dessa análise: ${err}`);
            });
        if (results === 0 || !results) {
            return setResponse.WARNING({message: "Não foi possivel registrar locatário!"});
        }

        return results;
    }

    static async patchNotRes(dadosBody, token, cpf) {
        //Chaves que não podem ser atualizadas de forma alguma:
        delete dadosBody?.historicoId;
        delete dadosBody?.historicoMatrix;

        const [results] = await onda_historico_analise
            .metodo(token)
            .update(dadosBody, {where: {historicoMatrix: cpf}})
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }
};

export default onda_historico_analise;
