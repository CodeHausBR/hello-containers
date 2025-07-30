import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";
import crypto from "crypto";

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";

//UTILS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import validate from "../../utils/formatar/validate.js";

//models
import onda_permissao from "./onda_permissao.js";
import onda_permissao_elemento from "./onda_permissao_elemento.js";
import onda_followup from "../public/onda_followup.js";

const tableName = "onda_user";

const onda_user = class onda_user {
    static metodo() {
        return db.define(
            tableName,
            {
                userId: {
                    field: "onda_user_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("useId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                userCodigo: {
                    field: "onda_user_codigo",
                    type: DataTypes.STRING,
                    allowNull: false,
                    requere: true,
                    defaultValue: gerarCondigoSetores("USER"),
                    validate: validate.name("userCodigo").notNull().notEmpty().len([0, 45]).build(),
                },
                userPass: {
                    field: "onda_user_pass",
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("userPass").notNull().notEmpty().build(),
                    set(value) {
                        return this.setDataValue("userPass", crypto.createHash("md5").update(value).digest("hex"));
                    },
                },
                userDatacriacao: {
                    field: "onda_user_datacriacao",
                    type: DataTypes.TIME,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    allowNull: false,
                    required: true,
                    validate: validate.name("userDatacriacao").notNull().notEmpty().isDate().build(),
                },
                userUsername: {
                    field: "onda_user_username",
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("userUsername").notNull().notEmpty().len([3, 100]).build(),
                },
                userDepartamento: {
                    field: "onda_user_departamento",
                    type: DataTypes.STRING(100),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("userDepartamento").notNull().notEmpty().len([0, 100]).build(),
                },
                userNomecompleto: {
                    field: "onda_user_nomecompleto",
                    type: DataTypes.STRING(150),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("userNomecompleto").notNull().notEmpty().len([0, 150]).build(),
                },
                userCpf: {
                    field: "onda_user_cpf",
                    type: DataTypes.STRING(20),
                    allowNull: false,
                    defaultValue: null,
                    requere: true,
                    validate: validate.name("userCpf").notEmpty().len([11, 20]).build(),
                },
                userEmail: {
                    field: "onda_user_email",
                    type: DataTypes.STRING(200),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("userEmail").notNull().isEmail().notEmpty().build(),
                },
                userAtivo: {
                    field: "onda_user_ativo",
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                    requere: true,
                    defaultValue: 1,
                    validate: validate
                        .name("userAtivo")
                        .isIn([[0, 1]])
                        .build(),
                },
                userCreate: {
                    field: "onda_user_user_create",
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                    requere: true,
                    defaultValue: 60,
                },
                userUpdate: {
                    field: "onda_user_user_update",
                    type: DataTypes.INTEGER(11),
                    defaultValue: 60,
                },
                userType: {
                    field: "onda_executivo_type_user",
                    type: DataTypes.INTEGER(11),
                    defaultValue: null,
                },
                userCargo: {
                    field: "onda_user_cargo",
                    type: DataTypes.TIME,
                    allowNull: false,
                    required: true,
                    validate: validate.name("userCargo").notNull().notEmpty().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async getAllNotRes() {
        const results = await executarQuery(`SELECT * FROM VW_USER`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar usuários onda!"});
        });

        return results;
    }

    static async getOneNotRes(cod) {
        const [results] = await executarQuery(`SELECT * FROM VW_USER WHERE userCodigo = '${cod}'`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar usuário onda!"});
        });
        return results;
    }

    static async getOneByIdNotRes(cod) {
        const [results] = await executarQuery(`SELECT * FROM VW_USER WHERE userId = '${cod}'`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar usuário onda!"});
        });
        return results;
    }

    static async createNotRes(ondaUser, token) {
        if (!ondaUser) {
            return setResponse.WARNING({message: "Faltou enviar ondaUser"});
        }

        await onda_user.verifyEmailExists(ondaUser?.userEmail);

        const newOndaUser = await onda_user
            .metodo()
            .create({...ondaUser, userCreate: token.id, userUpdate: token.id, userType: token.type_user})
            .then(async (res) => {
                await onda_followup.postFollowup({token: token, cod: res.userCodigo, event: "Sucesso ao criar usuário!"});
                return res;
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (newOndaUser.length === 0) {
            return setResponse.WARNING({message: "Não foi possivel cadastrar usuário!"});
        }

        const permissoesElementos = await onda_permissao_elemento.getAllAgrupadoPorSetor(newOndaUser?.userCodigo);

        const results = {
            userOnda: newOndaUser,
            permissoesElementos: permissoesElementos,
        };

        return results;
    }

    static async patchNotRes(userOnda, permissoes, cod) {
        const [newOndaUser] = await onda_user
            .metodo()
            .update(userOnda, {where: {userCodigo: cod}})
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (newOndaUser.length === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar o  usuário!"});
        }

        const newPermissoes = await onda_permissao.patchNotRes(permissoes, cod);

        if (newOndaUser === 0 && newPermissoes === 0) {
            const results = await userAndPermissoes();
            return setResponse.WARNING({results: results, message: "Sem atualizações para salvar!"});
        }

        async function userAndPermissoes() {
            return {
                userOnda: await onda_user.getOneNotRes(cod),
                permissoes: await onda_permissao.getOneNotRes(cod),
            };
        }

        return await userAndPermissoes();
    }

    static async putNotRes(userOnda, permissoesElementos, cod, token) {
        const [newOndaUser] = await onda_user
            .metodo()
            .update({...userOnda, userUpdate: token.id, userType: token.type_user}, {where: {userCodigo: cod}})
            .then(async (res) => {
                await onda_followup.postFollowup({token: token, cod: cod, event: "Sucesso ao atualizar usuário!"});

                return res;
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (newOndaUser.length === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar o  usuário!"});
        }

        const newPermissoesElementos = await onda_permissao_elemento.patchNotRes(permissoesElementos, cod);

        if (newOndaUser === 0 && newPermissoesElementos === 0) {
            const results = await userAndPermissoes();
            return setResponse.WARNING({results: results, message: "Sem atualizações para salvar!"});
        }

        async function userAndPermissoes() {
            return {
                userOnda: await onda_user.getOneNotRes(cod),
                permissoes: await onda_permissao.getOneNotRes(cod),
                permissoesElementos: await onda_permissao_elemento.getAllAgrupadoPorSetor(cod),
            };
        }

        return await userAndPermissoes();
    }

    static async verifyEmailExists(email) {
        const userOnda = await onda_user
            .metodo()
            .findOne({where: {userEmail: email}})
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (userOnda) {
            return setResponse.WARNING({message: `O e-mail: ${email} já está sendo utilizado!`});
        }
    }

    static async getAllAgrupadoPorCargo() {
        const results = await executarQuery(`
            SELECT 
                userId AS value, 
                userUsername AS label, 
                userCargo AS userCargo  
            FROM VW_USER
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar usuários onda por setor!"});
        });

        const agrupadosPorSetor = results.reduce((resultado, item) => {
            // Se o userCargo ainda não existe no resultado, adicione-o
            if (!resultado[item.userCargo]) {
                resultado[item.userCargo] = [];
            }

            // Adicione o item ao userCargo correspondente
            resultado[item.userCargo].push(item);

            return resultado;
        }, {});

        return {
            tabela_onda_users: {
                agrupadosPorCargo: agrupadosPorSetor,
                todosOsUsuariosJuntos: results,
            },
        };
    }

    static async getAllIdSeparadosPorArrayCargo() {
        const results = await this.getAllNotRes();

        const reagruparIdsEmArray = results.reduce((resultado, item) => {
            if (!resultado[item?.userCargo]) {
                resultado[item?.userCargo] = [];
            }
            resultado[item?.userCargo].push(item?.userId);

            return resultado;
        });

        return reagruparIdsEmArray;
    }
};

export default onda_user;
