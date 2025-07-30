//BIBLIOTECAS

//HELPERS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import onda_parceiro from "../../models/users/onda_parceiro.js";
import onda_imob from "../../models/users/onda_imob.js";
import servicesUsersQuery from "../../services/users/query/servicesUsersQuery.js";
//SERVICES

const controllerParceiro = class controllerParceiro {
    static async cadastrarParceiro(req, res) {
        try {
            const dadosBody = req?.body;
            const token = req?.body.token;
            const results = await onda_parceiro.cadastrar({dadosBody: dadosBody, token: token});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar parceiro!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarParceiro(req, res) {
        try {
            const dadosBody = req?.body;
            const {cod} = req?.params;
            const token = req?.body.token;

            const results = await onda_parceiro.atualizar({dadosBody: dadosBody, codParceiro: cod, token: token});

            return setResponse.SUCCESS({message: "Sucesso ao atualizar parceiro!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarParceiroByCod(req, res) {
        try {
            const {cod} = req?.params;

            const results = await onda_parceiro.getOneByCod({codParceiro: cod});

            return setResponse.SUCCESS({message: "Sucesso ao buscar parceiro!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarTodosParceiros(req, res) {
        try {
            const results = await onda_parceiro.getAll();

            return setResponse.SUCCESS({message: "Sucesso ao buscar todos os parceiros!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarImobiliariasDoParceiro(req, res) {
        try {
            const {token} = req?.body;

            const results = await onda_imob.buscarImobiliariasDoParceiro({token: token});

            return setResponse.SUCCESS({message: "Sucesso ao buscar imobiliárias!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarContratosDoParceiro(req, res) {
        try {
            const {token} = req?.body;

            const query = `
                SELECT * FROM VW_CARTAFIANCA_GERAL
                WHERE parceiroCod = '${token?.id}'
                AND statusFinanceiroCod = '999'
            `;

            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos do parceiro!"});
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar contratos do parceiro!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarAnalisesDoParceiro(req, res) {
        try {
            const {token} = req?.body;

            const query = `
                SELECT * FROM VW_CARTAFIANCA_GERAL
                WHERE parceiroCod = '${token?.id}'
                AND statusFinanceiroCod != '999'
            `;
            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos do parceiro!"});
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar imobiliárias!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarExecutivosDoParceiro(req, res) {
        try {
            const {token} = req?.body;

            const query = `
                SELECT 
                  *
                FROM VW_EXECUTIVO
                WHERE parceiro =  '${token?.id}'
            `;

            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({
                    message: "Erro ao buscar executivos do parceiro!",
                });
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar executivos!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarComissoesDoParceiro(req, res) {
        try {
            const {token} = req?.body;
            const {ano, mes} = req?.query;

            const resultados = await servicesUsersQuery.buscarComissoesDoParceiro({token: token, ano: ano, mes: mes});
                return setResponse.SUCCESS({message: "Sucesso ao buscar contas do parceiro!", results: resultados, res: res});

        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerParceiro;
