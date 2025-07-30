//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import apiPagarme from "../../../helpers/api/pagarme/api-pagarme.js";
//BANCO DE DADOS
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";

//SERVICES

const controllerPagarme = class controllerPagarme {
    static async postPedido(req, res) {
        try {
            const {token} = req?.body;
            const {cod} = req?.params;

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            const pedidoCriado = await apiPagarme.criarPedidoCheckoutMultMeioPagamento({cartaFianca: cartaFianca, token: token});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar conta!", res: res, results: pedidoCriado});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getPedido(req, res) {
        try {
            return setResponse.SUCCESS({message: "Sucesso ao cadastrar conta!", res: res, results: []});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getPedidos(req, res) {
        try {
            const {token} = req?.body;
            const {cod} = req?.params;

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            const pedidosPagarme = await apiPagarme.getPedidos({cartaFianca: cartaFianca, token: token});

            return setResponse.SUCCESS({message: "Sucesso ao buscar pedidos!", res: res, results: pedidosPagarme});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cancelarPedido(req, res) {
        try {
            const {token} = req?.body;
            const {cod, order_id} = req?.params;

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            const pedidoCancelado = await apiPagarme.cancelarPedido({cartaFianca: cartaFianca, token: token, order_id: order_id});

            return setResponse.SUCCESS({message: "Sucesso ao cancelar pedido!", res: res, results: pedidoCancelado});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerPagarme;
