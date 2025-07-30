//BIBLIOTECAS
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import onda_suporte from "../../models/suporte/onda_suporte.js";
import onda_followup from "../../../mvc/models/public/onda_followup.js";
//BANCO DE DADOS

//SERVICES

//WEBSOCKET
import webSocketClient from "../../../helpers/response/web-socket-client.js";

const controllerSuporte = class controllerSuporte {
    static async cadastrarSuporte(req, res) {
        try {
            const ws = new webSocketClient();
            const newSuporte = await onda_suporte.createNotRes(req?.body);

            ws.enviarParaEspecificos({
                ws: {
                    setor: "suporte",
                    follow: { on: false, message: {} },
                    event: "new",
                    item: newSuporte,
                },
            });
            await onda_followup.postFollowup({ cod: newSuporte.id, event: `🤖Suporte Cadastrado, Usuário: ${newSuporte.suporteUserNome}, cod: ${newSuporte.suporteImob}` });
            return setResponse.SUCCESS({ results: newSuporte });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarSuportes(req, res) {
        try {
            const suportes = await onda_suporte.getAllNotRes();
            return setResponse.SUCCESS({ results: suportes });

        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarSuporte(req, res) {
        try {
            const { cod } = req?.params;

            const suporte = await onda_suporte.getOneNotRes(cod);

            return setResponse.SUCCESS({ results: suporte, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async autualizarSuporte(req, res) {
        try {
            const ws = new webSocketClient();
            const { cod } = req?.params;

            const suporte = await onda_suporte.patchNotRes(req?.body, cod);

            ws.enviarParaEspecificos({
                ws: {
                    setor: "suporte",
                    follow: { on: false, message: {} },
                    event: "update",
                    item: suporte,
                },
            });
            await onda_followup.postFollowup({ cod: suporte.id, event: `🤖Ticket atualizado pelo usuário: ${req.body.token.nome}, Cod: ${req.body.token.codigo} - Ticket status: ${req.body.suporteStatus}` });
            return setResponse.SUCCESS({ results: suporte, res: res });
        } catch (error) {
            console.error("Erro no update do banco:", error);
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerSuporte;
