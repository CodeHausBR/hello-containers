import express from "express";

//Controllers
import controllerWebhook from "../../controllers/webhook/controllerWebhook.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const routePagarme = express.Router();

//COBRANÇA PAGARME
routePagarme.post("/pagarme/cobranca", controllerWebhook.cobrancaPagarme);
routePagarme.post("/pagarme/sincronizar/enderecos", controllerWebhook.sincronizarEnderecosEntrePagarmeEWave);
//COBRANÇA ASAAS
routePagarme.post("/asaas/cobranca", controllerWebhook.receberEventosCobrancaAssas);

//WEBHOOK INTERNO ONDA SEGURA PARA INTERAÇÃO DE API
routePagarme.post("/onda/enviar/evento/teste", controllerWebhook.enviarEventoTeste);
routePagarme.post("/onda/evento", verifyToken, controllerWebhook.cadastrarEventoWebhookOnda);
routePagarme.get("/onda/eventos", verifyToken, controllerWebhook.buscarEventoWebhookOnda);
routePagarme.get("/onda/evento/:cod", verifyToken, controllerWebhook.buscarEventoWebhookPeloCodOnda);
routePagarme.get("/onda/logs", verifyToken, controllerWebhook.buscarLogsWebhook);
routePagarme.put("/onda/evento/:cod", verifyToken, controllerWebhook.atualizarEventoWebhookOnda);

//GITHUB
routePagarme.post("/github", controllerWebhook.rodarScritpsVindosFrontEndWaveEGitHub);
routePagarme.post("/github/params", controllerWebhook.rodarScriptParams);

export default routePagarme;
