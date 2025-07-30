import express from "express";

//Controllers
import controllerPagarme from "../../controllers/pagarme/controllerPagarme.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const routePagarme = express.Router();

//COBRANÇA
routePagarme.post("/cobrancas/sincronizar", verifyToken, controllerPagarme.sincronizarDadosCobrancas);
routePagarme.post("/cobrancas/sincronizar/cartao/credito", verifyToken, controllerPagarme.sincronizarDadosCobrancasCartaoDeCredito);
routePagarme.get("/cobrancas", verifyToken, controllerPagarme.buscarCobrancas);
routePagarme.get("/cobrancas/:cod", verifyToken, controllerPagarme.buscarCobrancasPeloContrato);

//CLIENTE
routePagarme.post("/clientes/sincronizar", verifyToken, controllerPagarme.sincronizarDadosClientes);
routePagarme.get("/clientes", verifyToken, controllerPagarme.buscarClientes);

//PEDIDOS
routePagarme.get("/pedidos/:cod", verifyToken, controllerPagarme.buscarPedidoPeloContrato);
routePagarme.get("/pedidos", verifyToken, controllerPagarme.buscarPedidos);
routePagarme.post("/pedidos", verifyToken, controllerPagarme.solicitarLinkPedidoCheckout);
routePagarme.post("/pedidos/cobranca", verifyToken, controllerPagarme.gerarLinkPagarmeDefaultValoresSetadosPeloUsuario);

export default routePagarme;
