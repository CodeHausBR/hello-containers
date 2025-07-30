import {DataTypes, Sequelize} from "sequelize";
import db from "../../../db/connMysql.js";

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import formatarOriginal from "../../../helpers/geral/formatar-original.js";

//SERVICES
import servicesUsersRegras from "../../services/users/regras/servicesUsersRegras.js";

//UTILS
import validate from "../../utils/formatar/validate.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";

const tableName = "onda_permissao_elemento";

const onda_permissao_elemento = class onda_permissao_elemento {
    static metodo() {
        return db.define(
            tableName,
            {
                permissaoPk: {
                    field: "onda_permissao_elemento_pk",
                    type: DataTypes.STRING(250),
                    primaryKey: true,
                    allowNull: false,
                    validate: validate.name("permissaoPk").notNull().notEmpty().build(),
                },
                permissaoMatrix: {
                    field: "onda_permissao_elemento_matrix",
                    type: DataTypes.STRING(250),
                    primaryKey: false,
                    allowNull: false,
                    validate: validate.name("permissaoMatrix").notNull().notEmpty().build(),
                },

                permissaoId: {
                    field: "onda_permissao_elemento_id",
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoId")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoPermitir: {
                    field: "onda_permissao_elemento_permitir",
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                    defaultValue: 0,
                    validate: validate
                        .name("permissaoPermitir")
                        .notNull()
                        .notEmpty()
                        .isInt([[0, 1]])
                        .build(),
                },
                permissaoDataalteracao: {
                    field: "onda_permissao_elemento_dataalteracao",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("permissaoDataalteracao").notNull().notEmpty().isDate().build(),
                },
                permissaoUserresp: {
                    field: "onda_permissao_elemento_user_resp",
                    type: DataTypes.INTEGER(1),
                    allowNull: false,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("permissaoUserresp").notNull().notEmpty().isDate().build(),
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
            return setResponse.DATABASE_ERROR({message: "Erro onda permissão!"});
        }
    }

    static async getOneNotRes(cod) {
        const results = await onda_permissao_elemento
            .metodo()
            .findOne({where: {permissaoMatrix: cod}})
            .catch((err) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar permissões!"});
            });

        return results;
    }

    static async createNotRes(dadosBody, cod) {
        const newPermissao = {...dadosBody, permissaoMatrix: cod};

        const resultsUser = await onda_permissao_elemento
            .metodo()
            .create(newPermissao)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (resultsUser.length === 0) {
            return setResponse.WARNING({message: "Não foi possivel cadastrar!"});
        }

        return resultsUser;
    }

    static async patchNotRes(dadosBody, cod) {
        const view = formatarOriginal(dadosBody, cod);

        const prevPermissao = await onda_permissao_elemento.getAllporView(cod);

        const verificaMudancas = await servicesUsersRegras.verificarMudancas(prevPermissao, view);

        function queryEmMassa(updated) {
            const req = updated.map(
                (item) =>
                    `UPDATE onda_permissao_elemento SET onda_permissao_elemento_permitir = ${item?.permissaoPermitir?.newValue} WHERE (onda_permissao_elemento_matrix = '${cod}' AND onda_permissao_elemento_id = ${item?.permissaoId});`
            );
            return req;
        }
        const updatedItem = queryEmMassa(verificaMudancas);

        for (const query of updatedItem) {
            var results = await executarQuery(query).catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });
        }

        return results;
    }

    static async getAllAgrupadoPorSetor(matrix) {
        const results = await executarQuery(`
        SELECT * FROM VW_PERMISSOES_ELEMENTOS WHERE permissaoMatrix = '${matrix}'
        `).catch((err) => {
            return setResponse.DATABASE_ERROR({message: `Erro ao buscar usuários onda por setor! `});
        });
        let dadoEstruturado = [];

        let paginas = results.filter((item) => item.elementoType === "page");

        paginas.forEach((pagina) => {
            let objetoPai = {
                id: pagina.permissaoId,
                descricao: pagina.elementoDescricao,
                setor: pagina.permissaoSetor,
                order: "pai",
                read: pagina.permissaoPermitir,
                componetes: [],
            };

            let filhos = results.filter((filho) => filho.elementoType !== "page" && filho.permissaoSetor === pagina.permissaoSetor);

            filhos.forEach((filho) => {
                let objetoFilho = {
                    id: filho.permissaoId,
                    descricao: filho.elementoDescricao,
                    setor: filho.permissaoSetor,
                    order: "filho",
                    read: filho.permissaoPermitir,
                };

                objetoPai.componetes.push(objetoFilho);
            });

            dadoEstruturado.push(objetoPai);
        });

        return dadoEstruturado;
    }

    static async getAllporView(cod) {
        const results = await executarQuery(`
        SELECT * FROM VW_PERMISSOES_ELEMENTOS WHERE permissaoMatrix = '${cod}'
        `).catch((err) => {
            return setResponse.DATABASE_ERROR({message: `Erro ao buscar usuários onda por setor! `});
        });
        return results;
    }
};

export default onda_permissao_elemento;
