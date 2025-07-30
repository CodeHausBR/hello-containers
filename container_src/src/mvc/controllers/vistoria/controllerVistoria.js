//BIBLIOTECAS

//HELPERS
import webSocketClient from "../../../helpers/response/web-socket-client.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import onda_agendamento_vistoria from "../../models/vistoria/onda_agendamento_vistoria.js";
//SERVICES
import servicesVistoriaQuery from "../../services/vistoria/query/servicesVistoriaQuery.js";
import servicesVistoriaValidate from "../../services/vistoria/validate/servicesVistoriaValidate.js";

const controllerVistoria = class controllerVistoria {
    static async status(req, res) {
        try {
            const ws = new webSocketClient();

            const arrayStatus = await servicesVistoriaQuery.buscarArrayStatusVistoria_query();

            const dadosValidados = await servicesVistoriaValidate.atualizarStatusVistoria_validate(req?.params, arrayStatus);

            const cfAtualizada = await servicesVistoriaQuery.atualizarStatusVistoria_query(dadosValidados);

            ws.enviarParaEspecificos({ws: {setor: "comercial", follow: {on: false, message: {}}, event: "update", item: cfAtualizada}});

            return setResponse.SUCCESS({message: "Status vistoria atualizado com sucesso!", res: res, results: cfAtualizada});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async vistorias(req, res) {
        try {
            const query = `SELECT * FROM VW_VISTORIA_GERAL;`;

            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar vistorias!"});
            });

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async imoveis(req, res) {
        try {
            const query = `SELECT * FROM VW_IMOVEL`;

            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar imóveis!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Vistoria não encontrada!"});
            }

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async agendarVistoria(req, res) {
        try {
            const data = req?.body;

            await onda_agendamento_vistoria.post({data: data?.data})

            return setResponse.SUCCESS({results: {}, message: "primeira rota"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    
};

export default controllerVistoria;
