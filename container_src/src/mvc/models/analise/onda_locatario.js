import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import generateQuery from "../../../helpers/mysql/generate-query.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";

//UTILS
import validate from "../../utils/formatar/validate.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";

const tableName = "onda_locatario";

const onda_locatario = class onda_locatario {
    static metodo(token) {
        return db.define(
            tableName,
            {
                locatarioId: {
                    field: "onda_locatario_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("locatarioId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                locatarioCodigo: {
                    field: "onda_locatario_codigo",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    requere: true,
                    defaultValue: gerarCondigoSetores("LOCA"),
                    validate: validate.name("locatarioCodigo").notNull().notEmpty().len([0, 45]).build(),
                },
                locatarioCnpjcpf: {
                    field: "onda_locatario_cnpjcpf",
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("locatarioCnpjcpf").notEmpty().len([11, 20]).build(),
                },
                locatarioNome: {
                    field: "onda_locatario_nome",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioNome").notEmpty().len([0, 200]).build(),
                },
                locatarioRenda: {
                    field: "onda_locatario_renda",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioRenda").notEmpty().build(),
                },
                locatarioRg: {
                    field: "onda_locatario_rg",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioRg").notEmpty().build(),
                },
                locatarioTelefone: {
                    field: "onda_locatario_telefone",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioTelefone").notEmpty().build(),
                },
                locatarioCelular: {
                    field: "onda_locatario_celular",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCelular").notEmpty().build(),
                },
                locatarioEmail: {
                    field: "onda_locatario_email",
                    type: DataTypes.STRING(50),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioEmail").isEmail().notEmpty().build(),
                },
                locatarioCep: {
                    field: "onda_locatario_cep",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCep").notEmpty().build(),
                },
                locatarioRua: {
                    field: "onda_locatario_rua",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioRua").notEmpty().build(),
                },
                locatarioNumero: {
                    field: "onda_locatario_numero",
                    type: DataTypes.STRING(10),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioNumero").notEmpty().build(),
                },
                locatarioBairro: {
                    field: "onda_locatario_bairro",
                    type: DataTypes.STRING(100),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioBairro").notEmpty().build(),
                },
                locatarioComplemento: {
                    field: "onda_locatario_complemento",
                    type: DataTypes.STRING(200),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioComplemento").notEmpty().build(),
                },
                locatarioCidade: {
                    field: "onda_locatario_cidade",
                    type: DataTypes.STRING(150),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCidade").notEmpty().build(),
                },
                locatarioUf: {
                    field: "onda_locatario_uf",
                    type: DataTypes.STRING(2),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioUf").notEmpty().build(),
                },
                locatarioCopart1: {
                    field: "onda_locatario_copart1",
                    type: DataTypes.STRING(150),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart1").build(),
                },
                locatarioCopart1renda: {
                    field: "onda_locatario_copart1renda",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart1renda").build(),
                },
                locatarioCopart1cpf: {
                    field: "onda_locatario_copart1cpf",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart1cpf").build(),
                },
                locatarioCopart1rg: {
                    field: "onda_locatario_copart1rg",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart1rg").build(),
                },
                locatarioCopart2: {
                    field: "onda_locatario_copart2",
                    type: DataTypes.STRING(150),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart2").build(),
                },
                locatarioCopart2renda: {
                    field: "onda_locatario_copart2renda",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart2renda").build(),
                },
                locatarioCopart2cpf: {
                    field: "onda_locatario_copart2cpf",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart2cpf").build(),
                },
                locatarioCopart2rg: {
                    field: "onda_locatario_copart2rg",
                    type: DataTypes.STRING(30),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioCopart2rg").build(),
                },
                locatarioImob: {
                    field: "onda_locatario_imob",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioImob").build(),
                },
                locatarioValoraluguel: {
                    field: "onda_locatario_valoraluguel",
                    type: DataTypes.DOUBLE,
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioValoraluguel").build(),
                },
                locatarioCriadopor: {
                    field: "onda_locatario_criadopor",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    requere: false,
                    defaultValue: token?.id,
                    validate: validate.name("locatarioCriadopor").notEmpty().build(),
                },
                locatarioDatacriacao: {
                    field: "onda_locatario_datacriacao",
                    type: DataTypes.TIME,
                    allowNull: false,
                    requere: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("locatarioDatacriacao").notNull().notEmpty().isDate().build(),
                },
                locatarioAlteradopor: {
                    field: "onda_locatario_alteradopor",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    requere: false,
                    defaultValue: token?.id,
                    set() {
                        this.setDataValue("locatarioAlteradopor", token?.id);
                    },
                    validate: validate.name("locatarioAlteradopor").notEmpty().build(),
                },
                locatarioDataalteracao: {
                    field: "onda_locatario_dataalteracao",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: false,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("locatarioDataalteracao").notEmpty().build(),
                },
                locatarioStatus: {
                    field: "onda_locatario_status",
                    type: DataTypes.INTEGER(3),
                    allowNull: true,
                    requere: false,
                    validate: validate.name("locatarioStatus").notEmpty().build(),
                },
                locatarioUuid: {
                    field: "onda_locatario_uuid_v4",
                    type: DataTypes.CHAR(45),
                    allowNull: true,
                    required: false,
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async validate(dadosBody) {
        const results = await onda_locatario
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
    static async buscarLocatarioPeloContato({locatarioCelular}) {
        const results = await onda_locatario
            .metodo()
            .findAll({
                where: {
                    locatarioCelular,
                },
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }
    static async buscarLocatarioPeloEmail({locatarioEmail}) {
        const results = await onda_locatario
            .metodo()
            .findAll({
                where: {
                    locatarioEmail,
                },
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }
    static async getOneNotRes(cod, token) {
        const results = await onda_locatario
            .metodo()
            .findOne({
                where: {
                    locatarioCodigo: cod,
                },
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async getOneByCPF(cpf) {
        const results = await onda_locatario
            .metodo()
            .findOne({
                where: {
                    locatarioCnpjcpf: cpf,
                },
                raw: true,
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async getAllNotRes(token) {
        const results = await onda_locatario
            .metodo()
            .findAll()
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async createNotRes(dadosBody, token) {
        const retirarVazios = generateQuery.retirarkeysVazias(dadosBody);

        const stringResultante = String(retirarVazios.locatarioCnpjcpf).trim();

        retirarVazios.locatarioCnpjcpf = stringResultante;

        const results = await onda_locatario
            .metodo()
            .create(retirarVazios)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({message: "Não foi possivel cadastrar locatário!"});
        }

        return results;
    }

    static async patchNotRes(dadosBody, token, cod) {
        //Chaves que não podem ser atualizadas de forma alguma:
        delete dadosBody?.locatarioId;
        delete dadosBody?.locatarioCodigo;

        // const stringResultante = String(dadosBody?.locatarioCnpjcpf).trim();

        // dadosBody.locatarioCnpjcpf = stringResultante;

        const [results] = await onda_locatario
            .metodo(token)
            .update(dadosBody, {where: {locatarioCodigo: cod}})
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }
};

export default onda_locatario;
