//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import onda_imob from "../../models/users/onda_imob.js";
import onda_permissao from "../../models/users/onda_permissao.js";
import onda_permissao_elemento from "../../models/users/onda_permissao_elemento.js";
import onda_parceiro from "../../models/users/onda_parceiro.js";
import onda_user from "../../models/users/onda_user.js";
import onda_executivo from "../../models/users/onda_executivo.js";

//SERVICES
import servicesUsersRegras from "../../services/users/regras/servicesUsersRegras.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import onda_user_permissoes from "../../models/permissions/onda_user_permissions.js";
import onda_permissoes_catalogo from "../../models/permissions/onda_permissoes_catalogo.js";

const controllerUser = class controllerUser {
    static async usersPorSetor(req, res) {
        try {
            const query = `
                SELECT 
                    UG.userId,
                    UG.userDepartamento,
                    UG.userNomeCompleto
                FROM VW_USER AS UG
                WHERE userAtivo = 1
                ORDER BY userId DESC
            `;

            const results = await executarQuery(query).catch((error) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar usuários!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Erro ao buscar usuários pelo setor!"});
            }

            return setResponse.SUCCESS({res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getImobiliarias(req, res) {
        try {
            const results = await executarQuery(`
            SELECT 
                *,
                DATE_FORMAT(VW_IMOB.imobDataCriacao,'%d/%m/%Y') AS imobDataCriacao
            FROM VW_IMOB`);

            return setResponse.SUCCESS({res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getImobiliaria(req, res) {
        try {
            const {cod} = req?.params;
            const results = await executarQuery(`SELECT * FROM VW_IMOB WHERE imobCodigo = '${cod}'`);

            return setResponse.SUCCESS({res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async patchImobiliaria(req, res) {
        try {
            const {cod} = req?.params;

            if (!cod) {
                return setResponse.WARNING({message: "Cod da imobiliária não foi enviado"});
            }

            const results = await onda_imob.patch(req?.body, cod);

            return setResponse.SUCCESS({res: res, results: results, message: "Sucesso ao atualizar imobiliária!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarImobiliaria(req, res) {
        try {
            const {imobiliaria, token} = req?.body;

            await servicesUsersRegras.cadastroImobiliaria(imobiliaria);

            const newImobiliaria = await onda_imob.createNotRes(imobiliaria, token);

            return setResponse.SUCCESS({res: res, results: newImobiliaria, message: "Sucesso ao cadastrar imobiliária!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualilzarImobiliaria(req, res) {
        try {
            const {imobiliaria, permissoes, token} = req?.body;
            const {cod} = req?.params;

            const results = await onda_imob.patchNotRes(imobiliaria, permissoes, cod, token);

            if (results.update == 0) {
                return setResponse.WARNING({results: results, message: "Sem autalizações para salvar!", res: res});
            }

            return setResponse.SUCCESS({results: results, message: "Sucesso ao atualizar imobiliária!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualilzarStatusImobiliaria(req, res) {
        try {
            const {imobStatus} = req?.body?.imobiliaria;
            const {cod} = req?.params;

            const [verifyExists] = await executarQuery(`SELECT * FROM VW_IMOB WHERE imobCodigo = '${cod}'`);

            if (!verifyExists) {
                return setResponse.WARNING({message: "Imobiliária não encontrada!"});
            }

            const newUpdate = {
                imobStatus: imobStatus,
            };

            if (verifyExists?.imobStatus !== 1302 && imobStatus == 1302) {
                newUpdate.imobDataConversao = getDataHorarioAtual.YYYY_MM_DD_00_00_00();
            }

            const [results] = await onda_imob.metodo().update(newUpdate, {where: {imobCodigo: cod}});

            const [imobiliaria] = await executarQuery(`SELECT * FROM VW_IMOB WHERE imobCodigo = '${cod}'`);

            if (results === 0) {
                return setResponse.WARNING({message: "O status já foi atualizado!", res: res, results: imobiliaria});
            }

            return setResponse.SUCCESS({res: res, results: imobiliaria, message: "Sucesso ao atualizar status!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarImobiliaria(req, res) {
        try {
            const {cod} = req?.params;

            const [imobiliaria] = await executarQuery(`SELECT * FROM VW_IMOB WHERE imobCodigo = '${cod}'`);

            const permissoes = await onda_permissao.getOneNotRes(cod);

            const results = {
                imobiliaria: imobiliaria,
                permissoes: permissoes,
            };

            return setResponse.SUCCESS({res: res, results: results, message: "Sucesso ao atualizar imobiliária!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarParceiro(req, res) {
        try {
            const {parceiro, permissoes} = req?.body;

            const results = await onda_parceiro.createNotRes(parceiro, permissoes);

            return setResponse.SUCCESS({res: res, results: results, message: "Sucesso ao atualizar parceiro!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarParceiro(req, res) {
        try {
            const {cod} = req?.params;
            const {parceiro, permissoes} = req?.body;

            const verifyExists = await onda_parceiro.getOneNotRes(cod);

            if (!verifyExists) {
                return setResponse.WARNING({message: "Parceiro não encontrado!"});
            }

            const results = await onda_parceiro.patchNotRes(parceiro, permissoes, cod);

            return setResponse.SUCCESS({res: res, results: results, message: "Sucesso ao atualizar parceiro!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarParceiro(req, res) {
        try {
            const {cod} = req?.params;

            const parceiro = await onda_parceiro.getOneNotRes(cod);
            const permissoes = await onda_permissao.getOneNotRes(cod);

            const results = {
                parceiro: parceiro,
                permissoes: permissoes,
            };

            return setResponse.SUCCESS({results: results, res: res, message: "Sucesso ao buscar parceiro!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarParceiros(req, res) {
        try {
            const results = await onda_parceiro.getAllNotRes();

            return setResponse.SUCCESS({results: results, message: "Sucesso ao buscar parceiros!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    //onda_user
    static async buscarUsuariosOnda(req, res) {
        try {
            const results = await onda_user.getAllNotRes();

            return setResponse.SUCCESS({res: res, results: results, message: "Sucesso ao buscar onda users!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atulizarUserPermissoes(req, res) {
        try {
            const {userId, matrix, permissoes} = req.body;

            if (!userId || !permissoes) {
                return setResponse.WARNING({
                    message: "Dados do usuário não encontrado.",
                    res: res,
                });
            }

            for (const permissao of permissoes) {
                await onda_user_permissoes.insertUserPermissoes({
                    userId: userId,
                    lastUpdateUser: userId,
                    catalogoId: permissao.item_catalogo_id,
                    temPermissao: permissao.tem_permissao,
                });
            }

            await onda_permissoes_catalogo.insertCatalogoPermissoes({
                matrix: matrix,
            });

            return setResponse.SUCCESS({res: res, results: "", message: "Sucesso ao atualizar permissões do usuário."});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarUserPermissoes(req, res) {
        try {
            const {cod} = req?.params;

            if (!cod) {
                return setResponse.WARNING({
                    message: "Dados do usuário não encontrado.",
                    res: res,
                });
            }

            const userWave = await onda_user.getOneNotRes(cod);

            const userId = userWave.id;
            const permissoes = await onda_user_permissoes.getUserPermissions(userId);

            const permissoesElementos = await onda_permissoes_catalogo.getAllPermissoesByUser(cod);

            const results = {
                userOnda: userWave,
                permissoes: permissoes,
                permissoesElementos: permissoesElementos,
            };
            return setResponse.SUCCESS({res: res, results: results, message: "Sucesso ao buscar onda user!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarUsuarioOnda(req, res) {
        try {
            const {cod} = req?.params;

            const userOnda = await onda_user.getOneNotRes(cod);

            const permissoes = await onda_permissao.getOneNotRes(cod);
            const permissoesElementos = await onda_permissao_elemento.getAllAgrupadoPorSetor(cod);

            const results = {
                userOnda: userOnda,
                permissoes: permissoes,
                permissoesElementos: permissoesElementos,
            };

            return setResponse.SUCCESS({res: res, results: results, message: "Sucesso ao buscar onda user!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarUsuarioOnda(req, res) {
        try {
            const {cod} = req?.params;
            const {userOnda, permissoes} = req?.body;

            const updateUser = await onda_user.patchNotRes(userOnda, permissoes, cod);

            return setResponse.SUCCESS({res: res, results: updateUser, message: "Sucesso ao atualizar onda user!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarUsuarioPermissoesOnda(req, res) {
        try {
            const {cod} = req?.params;
            const {userOnda, permissoesElementos, token} = req?.body;

            const updateUser = await onda_user.putNotRes(userOnda, permissoesElementos, cod, token);

            return setResponse.SUCCESS({results: updateUser, message: "Sucesso ao atualizar onda user!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarUsuarioOnda(req, res) {
        try {
            const {userOnda, token} = req?.body;

            const updateUser = await onda_user.createNotRes(userOnda, token);

            return setResponse.SUCCESS({results: updateUser, message: "Sucesso ao atualizar onda user!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    //onda_executivo
    static async cadastrarExecutivo(req, res) {
        try {
            const {executivo, permissoes} = req?.body;

            const newExecutivo = await onda_executivo.createNotRes(executivo, permissoes);

            return setResponse.SUCCESS({results: newExecutivo, message: "Sucesso ao cadastrar executivo!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarExecutivos(req, res) {
        try {
            const getExecutivos = await onda_executivo.getAllNotRes();

            return setResponse.SUCCESS({results: getExecutivos, message: "Sucesso ao bucar executivos!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarExecutivo(req, res) {
        try {
            const {cod} = req?.params;

            const buscarExecutivo = await onda_executivo.getOneNotRes(cod);

            return setResponse.SUCCESS({results: buscarExecutivo, message: "Sucesso ao buscar executivo!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarExecutivo(req, res) {
        try {
            const {executivo, permissoes} = req?.body;
            const {cod} = req?.params;

            const updateExec = await onda_executivo.patchNotRes(executivo, permissoes, cod);

            return setResponse.SUCCESS({results: updateExec, message: "Sucesso ao atualizar executivo!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerUser;
