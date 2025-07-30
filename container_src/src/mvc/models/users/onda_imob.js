import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

const tableName = "onda_imob";

//relpers
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";
import generateQuery from "../../../helpers/mysql/generate-query.js";
import validate from "../../utils/formatar/validate.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

//models
import onda_followup from "../public/onda_followup.js";
import onda_permissao from "../../models/users/onda_permissao.js";
//services
import servicesUsersValidate from "../../services/users/validate/servicesUsersValidate.js";

const onda_imob = class onda_imob {
    static metodo(token) {
        return db.define(
            tableName,
            {
                id: {
                    field: "onda_imob_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                imobNome: {
                    field: "onda_imob_nome",
                    type: DataTypes.STRING(200),
                    required: true,
                },
                imobCodigo: {
                    field: "onda_imob_codigo",
                    type: DataTypes.STRING(45),
                    unique: true,
                    allowNull: false,
                    required: true,
                    defaultValue: gerarCondigoSetores("IMOB"),
                    validate: validate.name("imobCodigo").notNull().notEmpty().len([0, 45]).build(),
                },
                imobCpfCnpj: {
                    field: "onda_imob_cpfcnpj",
                    type: DataTypes.STRING(25),
                    unique: true,
                    allowNull: false,
                    required: true,
                    validate: validate.name("imobCpfCnpj").notNull().len([14, 19]).notEmpty().build(),
                },
                imobCreci: {
                    field: "onda_imob_creci",
                    type: DataTypes.STRING(25),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobCreci").notEmpty().build(),
                },
                imobPassword: {
                    field: "onda_imob_password",
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobPassword").notNull().max().notEmpty().build(),
                },
                imobPermissao: {
                    field: "onda_imob_permissao",
                    type: DataTypes.STRING,
                    allowNull: false,
                    required: true,
                    defaultValue: "excluir campo",
                    validate: validate.name("imobPermissao").notNull().notEmpty().build(),
                },
                imobCep: {
                    field: "onda_imob_cep",
                    type: DataTypes.STRING(15),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobCep").notNull().notEmpty().build(),
                },
                imobRua: {
                    field: "onda_imob_rua",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobRua").notNull().notEmpty().build(),
                },
                imobNumero: {
                    field: "onda_imob_numero",
                    type: DataTypes.STRING(10),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobNumero").notNull().notEmpty().build(),
                },
                imobBairro: {
                    field: "onda_imob_bairro",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobBairro").notNull().notEmpty().build(),
                },
                imobCidade: {
                    field: "onda_imob_cidade",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobCidade").notNull().notEmpty().build(),
                },
                imobUf: {
                    field: "onda_imob_uf",
                    type: DataTypes.STRING(2),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobUf").notNull().notEmpty().build(),
                },
                imobComplemento: {
                    field: "onda_imob_complemento",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobComplemento").notEmpty().build(),
                },
                imobEmail: {
                    field: "onda_imob_email",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobEmail").isEmail().notNull().notEmpty().build(),
                },
                imobInsagram: {
                    field: "onda_imob_instagram",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobInsagram").notEmpty().build(),
                },
                imobCriadoPor: {
                    field: "onda_imob_criadopor",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    defaultValue: token?.onda_user_id || 998,
                    validate: validate.name("imobCriadoPor").notNull().notEmpty().build(),
                },
                imobDataCriacao: {
                    field: "onda_imob_datacriacao",
                    type: DataTypes.TIME,
                    allowNull: false,
                    required: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("imobDataCriacao").notNull().notEmpty().build(),
                },
                imobAlteradoPor: {
                    field: "onda_imob_alteradopor",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobAlteradoPor").notEmpty().build(),
                },
                imobDataAlteracao: {
                    field: "onda_imob_dataalteracao",
                    type: DataTypes.TIME,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobDataAlteracao").notEmpty().build(),
                },
                imobTelefone: {
                    field: "onda_imob_telefone",
                    type: DataTypes.STRING(25),
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobTelefone").notEmpty().build(),
                },
                imobContato: {
                    field: "onda_imob_contato",
                    type: DataTypes.STRING(250),
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobContato").notEmpty().build(),
                },
                imobConsultor: {
                    field: "onda_imob_consultor",
                    type: DataTypes.INTEGER,
                    required: true,
                    defaultValue: token?.onda_user_id || 998,
                    validate: validate.name("imobConsultor").notEmpty().build(),
                },
                imobTicket: {
                    field: "onda_imob_ticket",
                    type: DataTypes.DOUBLE,
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobTicket").notEmpty().build(),
                },
                imobQtde: {
                    field: "onda_imob_qtde",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    required: true,
                    defaultValue: 0,
                    validate: validate.name("imobQtde").notNull().notEmpty().build(),
                },
                imobDataConversao: {
                    field: "onda_imob_dataconversao",
                    type: DataTypes.DATE(),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobDataConversao").notEmpty().isDate().build(),
                },
                imobProspect: {
                    field: "onda_imob_prospect",
                    type: DataTypes.TINYINT(1),
                    allowNull: false,
                    required: true,
                    defaultValue: 0,
                    validate: validate.name("imobProspect").notNull().notEmpty().build(),
                },
                imobNegociacao: {
                    field: "onda_imob_negociacao",
                    type: DataTypes.TINYINT(1),
                    allowNull: false,
                    required: true,
                    defaultValue: 0,
                    validate: validate.name("imobNegociacao").notNull().notEmpty().build(),
                },
                imobConvertido: {
                    field: "onda_imob_convertido",
                    type: DataTypes.TINYINT(1),
                    allowNull: false,
                    required: true,
                    defaultValue: 0,
                    validate: validate.name("imobConvertido").notNull().notEmpty().build(),
                },
                imobRazaoSocial: {
                    field: "onda_imob_razaosocial",
                    type: DataTypes.STRING(250),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobRazaoSocial").notNull().notEmpty().build(),
                },
                imobFantasia: {
                    field: "onda_imob_fantasia",
                    type: DataTypes.STRING(250),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobFantasia").notNull().notEmpty().build(),
                },
                imobSite: {
                    field: "onda_imob_site",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobSite").notEmpty().build(),
                },
                imobCelular: {
                    field: "onda_imob_celular",
                    type: DataTypes.STRING(25),
                    allowNull: false,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobCelular").notNull().notEmpty().build(),
                },
                imobStatusRegister: {
                    field: "onda_imob_status_register",
                    type: DataTypes.TINYINT,
                    allowNull: true,
                    required: true,
                    defaultValue: 0,
                    validate: validate.name("imobStatusRegister").notEmpty().build(),
                },
                imobInfo: {
                    field: "onda_imob_info",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobInfo").notEmpty().build(),
                },
                imobBanco: {
                    field: "onda_imob_banco",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobBanco").notEmpty().build(),
                },
                imobCodbanco: {
                    field: "onda_imob_codbanco",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobCodbanco").notEmpty().build(),
                },
                imobAgencia: {
                    field: "onda_imob_agencia",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobAgencia").notEmpty().build(),
                },
                imobConta: {
                    field: "onda_imob_conta",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobConta").notEmpty().build(),
                },
                imobPix: {
                    field: "onda_imob_pix",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: true,
                    defaultValue: null,
                    validate: validate.name("imobPix").notEmpty().build(),
                },
                imobExecutivo: {
                    field: "onda_imob_executivo",
                    type: DataTypes.TINYINT(11),
                    allowNull: false,
                    required: true,
                    defaultValue: 1,
                    validate: validate.name("imobExecutivo").notNull().notEmpty().build(),
                },
                imobParceiro: {
                    field: "onda_imob_parceiro",
                    type: DataTypes.TINYINT(11),
                    allowNull: false,
                    required: true,
                    defaultValue: 1,
                    validate: validate.name("imobParceiro").notNull().notEmpty().build(),
                },
                imobFonte: {
                    field: "onda_imob_fonte",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    required: true,
                    defaultValue: "WhatsApp",
                    validate: validate.name("imobFonte").notNull().notEmpty().build(),
                },
                imobColaboradorId: {
                    field: "onda_imob_colaborador_id",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    required: true,
                    defaultValue: token?.onda_colaborador_id || 0,
                    validate: validate.name("imobColaboradorId").notNull().notEmpty().build(),
                },
                imobStatus: {
                    field: "onda_imob_status",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    required: true,
                    defaultValue: 1301,
                    validate: validate.name("imobStatus").notNull().isNumeric().notEmpty().build(),
                },
                imobUserCreate: {
                    field: "onda_imob_user_create",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 60,
                },
                imobUserUpdate: {
                    field: "onda_imob_user_update",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 60,
                },
                imobUserType: {
                    field: "onda_imob_type_user",
                    type: DataTypes.STRING(10),
                },
                imobPorcentagemComissao: {
                    field: "onda_imob_porcentagem_comissao",
                    allowNull: false,
                    type: DataTypes.DECIMAL(3, 2),
                    defaultValue: 0.8,
                    validate: validate.name("imobPorcentagemComissao").notNull().isDecimal().notEmpty().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async getAll() {
        const results = await onda_imob
            .metodo()
            .findAll({
                attributes: {exclude: ["imobPassword"]},
            })
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliárias!"});
            });

        return results;
    }

    static async getOne(codigo) {
        const results = await onda_imob
            .metodo()
            .findOne({where: {imobCodigo: codigo}, attributes: {exclude: ["imobPassword"]}})
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliária!"});
            });
        return results;
    }

    static async getOnoNotResView(codigo) {
        const [results] = await executarQuery(`
            SELECT *,
                DATE_FORMAT(VW_IMOB.imobDataCriacao,'%d/%m/%Y') AS imobDataCriacao
            FROM VW_IMOB
            WHERE imobCodigo = '${codigo}'
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliária!"});
        });
        return results;
    }

    static async getOneNotRes(codigo) {
        const results = await onda_imob
            .metodo()
            .findOne({where: {imobCodigo: codigo}, attributes: {exclude: ["imobPassword"]}})
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliária!"});
            });
        return results;
    }

    static async patch(dadosBody, cod) {
        const dadosValidados = await servicesUsersValidate.patchOndaImob(dadosBody);

        const retirarKeysVazias = generateQuery.retirarkeysVazias(dadosValidados);

        const [results] = await onda_imob
            .metodo()
            .update(retirarKeysVazias, {where: {imobCodigo: cod}})
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar imobiliária!"});
            });

        if (results === 0) {
            return setResponse.WARNING({message: "Sem atualizações para salvar!"});
        }

        const imobiliaria = await this.getOne(cod);

        return imobiliaria;
    }

    static async createNotRes(imobiliaria, token) {
        const setImob = {
            imobEmail: imobiliaria?.imobEmail,
            imobNome: imobiliaria?.imobNome,
            imobCpfCnpj: imobiliaria?.imobCpfCnpj,
            imobCreci: imobiliaria?.imobCreci,
            imobPassword: bcrypt.hash(imobiliaria?.imobPassword, bcrypt.genSalt(12)),
            imobCep: imobiliaria?.imobCep,
            imobRua: imobiliaria?.imobRua,
            imobNumero: imobiliaria?.imobNumero,
            imobBairro: imobiliaria?.imobBairro,
            imobCidade: imobiliaria?.imobCidade,
            imobUf: imobiliaria?.imobUf,
            imobComplemento: imobiliaria?.onda_imob_complemento,
            imobBanco: imobiliaria?.imobBanco,
            imobCodbanco: imobiliaria?.imobCodbanco,
            imobAgencia: imobiliaria?.imobAgencia,
            imobConta: imobiliaria?.imobConta,
            imobPix: imobiliaria?.imobPix,
            imobInsagram: imobiliaria?.imobInsagram,
            imobTelefone: imobiliaria?.imobTelefone,
            imobContato: imobiliaria?.imobContato,
            imobTicket: imobiliaria?.imobTicket,
            imobQtde: imobiliaria?.imobQtde,
            imobNegociacao: imobiliaria?.imobNegociacao,
            imobConvertido: imobiliaria?.imobConvertido,
            imobRazaoSocial: imobiliaria?.imobRazaoSocial,
            imobFantasia: imobiliaria?.imobFantasia,
            imobSite: imobiliaria?.imobSite,
            imobCelular: imobiliaria?.imobCelular,
            imobStatusRegister: imobiliaria?.imobStatusRegister,
            imobInfo: imobiliaria?.imobInfo,
            imobExecutivo: imobiliaria?.imobExecutivo,
            imobParceiro: imobiliaria?.imobParceiro,
            imobFonte: imobiliaria?.imobFonte,
            imobColaboradorId: imobiliaria?.imobColaboradorId,
        };

        const newImob = generateQuery.retirarkeysVazias(setImob);

        const newImobiliaria = await onda_imob
            .metodo(token)
            .create(newImob)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (newImobiliaria === 0) {
            return setResponse.WARNING({message: "Não foi possivel cadastrar imobiliária!"});
        }

        const newPermissoes = await onda_permissao.getOneNotRes(newImobiliaria?.imobCodigo);

        return {
            imobiliaria: newImobiliaria,
            permissoes: newPermissoes,
        };
    }

    static async patchNotRes(imobiliaria, permissoes, cod, token) {
        const newPerm = generateQuery.retirarkeysVazias(permissoes);

        const setImob = {
            imobEmail: imobiliaria?.imobEmail,
            imobNome: imobiliaria?.imobNome,
            imobCpfCnpj: imobiliaria?.imobCpfCnpj,
            imobCreci: imobiliaria?.imobCreci,
            imobPassword: imobiliaria?.imobPassword && (await bcrypt.hash(imobiliaria?.imobPassword, await bcrypt.genSalt(12))),
            imobCep: imobiliaria?.imobCep,
            imobRua: imobiliaria?.imobRua,
            imobNumero: imobiliaria?.imobNumero,
            imobBairro: imobiliaria?.imobBairro,
            imobCidade: imobiliaria?.imobCidade,
            imobUf: imobiliaria?.imobUf,
            imobComplemento: imobiliaria?.imobComplemento,
            imobBanco: imobiliaria?.imobBanco,
            imobCodbanco: imobiliaria?.imobCodbanco,
            imobAgencia: imobiliaria?.imobAgencia,
            imobConta: imobiliaria?.imobConta,
            imobInsagram: imobiliaria?.imobInsagram,
            imobTelefone: imobiliaria?.imobTelefone,
            imobContato: imobiliaria?.imobContato,
            imobTicket: imobiliaria?.imobTicket,
            imobQtde: imobiliaria?.imobQtde,
            imobNegociacao: imobiliaria?.imobNegociacao,
            imobConvertido: imobiliaria?.imobConvertido,
            imobRazaoSocial: imobiliaria?.imobRazaoSocial,
            imobFantasia: imobiliaria?.imobFantasia,
            imobPix: imobiliaria?.imobPix,
            imobSite: imobiliaria?.imobSite,
            imobCelular: imobiliaria?.imobCelular,
            imobStatusRegister: imobiliaria?.imobStatusRegister,
            imobInfo: imobiliaria?.imobInfo,
            imobExecutivo: imobiliaria?.imobExecutivo,
            imobParceiro: imobiliaria?.imobParceiro,
            imobParceiro: imobiliaria?.imobParceiro,
            imobFonte: imobiliaria?.imobFonte,
            imobDataConversao: imobiliaria?.imobDataConversao,
            imobPorcentagemComissao: imobiliaria?.imobPorcentagemComissao,
            imobUserCreate: token.id,
            imobUserUpdate: token.id,
            imobUserType: token.type_user,
        };

        const newImob = generateQuery.retirarkeysVazias(setImob);

        const [newImobiliaria] = await onda_imob
            .metodo(token)
            .update(newImob, {where: {imobCodigo: cod}})
            .then(async (res) => {
                await onda_followup.postFollowup({token: token, cod: cod, event: "Sucesso ao atualizar imobiliária!"});
                return res;
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        await onda_permissao.patchNotRes(newPerm, cod);

        return {
            imobiliaria: await this.getOnoNotResView(cod),
            permissoes: await onda_permissao.getOneNotRes(cod),
            update: newImobiliaria,
        };
    }

    static async getOneById(id) {
        try {
            const results = await onda_imob.metodo().findOne({where: {id: id}, attributes: {exclude: ["imobPassword"]}, raw: true});
            return results;
        } catch (error) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliária!"});
        }
    }
    static async verificarSeAImobiliariaEstaNaBlackList(id) {
        const [imobiliaria] = await executarQuery(`
            SELECT * 
                FROM onda_imob 
            WHERE onda_imob_id = '${id}';
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliaria pelo id!"});
        });

        if (imobiliaria?.onda_imob_status == 1303) {
            return setResponse.WARNING({
                message: "Imobiliária indisponível para cadastro de sinistros e análises. Por favor, contate o seu Executivo.",
            });
        }

        return imobiliaria;
    }

    static async buscarImobiliariasDoExecutivo({token}) {
        const results = await executarQuery(`
            SELECT
                onda_imob_id AS id,
                onda_imob_nome,
                onda_imob_email,
                onda_imob_telefone,
                onda_imob_celular,
                onda_imob_cidade,
                onda_imob_uf,
                onda_imob_creci 
            FROM
                onda_imob
            WHERE onda_imob_executivo = '${token?.id}'
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliárias do executivo!"});
        });
        return results;
    }

    static async buscarImobiliariasDoParceiro({token}) {
        const results = await executarQuery(`
            SELECT
                onda_imob_id AS id,
                onda_imob_nome,
                onda_imob_email,
                onda_imob_telefone,
                onda_imob_celular,
                onda_imob_cidade,
                onda_imob_uf,
                onda_imob_creci 
            FROM
                onda_imob
            WHERE onda_imob_parceiro = '${token?.id}'
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliárias do executivo!"});
        });
        return results;
    }

    static async buscarPorcentagemComissaoImobiliaria({codImobiliaria}) {
        const sql = `
            SELECT onda_imob_porcentagem_comissao 
            FROM onda_imob 
            WHERE onda_imob_codigo = '${codImobiliaria}'
        `;

        const [result] = await executarQuery(sql).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar porcentagem de comissão cadastrada no perfil da imobiliária"});
        });

        return result;
    }
};

export default onda_imob;
