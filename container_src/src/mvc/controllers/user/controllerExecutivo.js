//BIBLIOTECAS

//HELPERS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import onda_imob from "../../../mvc/models/users/onda_imob.js";
import onda_executivo from "../../models/users/onda_executivo.js";
import servicesUsersQuery from "../../services/users/query/servicesUsersQuery.js";

//SERVICES

const controllerExecutivo = class controllerExecutivo {
    static async cadastrarExecutivo(req, res) {
        try {
            const dadosBody = req?.body;

            const token = req?.body.token;

            const results = await onda_executivo.cadastrar({dadosBody: dadosBody, token: token});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar executivo!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarExecutivo(req, res) {
        try {
            const dadosBody = req?.body;
            const {cod} = req?.params;
            const token = req?.body.token;

            const results = await onda_executivo.atualizar({dadosBody: dadosBody, cod: cod, token: token});

            return setResponse.SUCCESS({message: "Sucesso ao atualizar executivo!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarExecutivoByCod(req, res) {
        try {
            const {cod} = req?.params;

            const results = await onda_executivo.getOneByCod({cod: cod});

            return setResponse.SUCCESS({message: "Sucesso ao buscar executivo!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarTodosExecutivos(req, res) {
        try {
            const results = await onda_executivo.getAll();

            return setResponse.SUCCESS({message: "Sucesso ao buscar todos os executivos!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarImobiliariasDoExecutivo(req, res) {
        try {
            const {token} = req?.body;

            const results = await onda_imob.buscarImobiliariasDoExecutivo({token: token});

            return setResponse.SUCCESS({message: "Sucesso ao buscar imobiliárias!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarContratosDoExecutivo(req, res) {
        try {
            const {token} = req?.body;

            const query = `
                SELECT * FROM VW_CARTAFIANCA_GERAL
                WHERE executivoCod = '${token?.id}'
                AND statusFinanceiroCod = '999'
            `;
            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos do executivo!"});
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar contratos do executivo!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarAnalisesDoExecutivo(req, res) {
        try {
            const {token} = req?.body;

            const query = `
                SELECT * FROM VW_CONTAS
                WHERE executivoCod = '${token?.id}'
            `;
            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos do executivo!"});
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar imobiliárias!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarContasExecutivo(req, res) {
        try {
            const {token} = req?.body;
            const {ano, mes} = req?.query;

            const resultados = await servicesUsersQuery.buscarContasExecutivo({token: token, ano: ano, mes: mes});

            return setResponse.SUCCESS({message: "Sucesso ao buscar contas do executivo!", results: resultados, res: res});
        } catch (error) {
            console.error("Erro em buscarContasExecutivo:", error);
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerExecutivo;
