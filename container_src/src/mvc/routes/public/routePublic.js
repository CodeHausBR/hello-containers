import express from "express";

//Controllers
import controlerPublic from "../../controllers/public/controllerPublic.js";

//Helpers
import onda_helpers from "../../models/public/onda_helpers.js";
import verifyToken from "../../../helpers/token/verify-token.js";
import controllerPublic from "../../controllers/public/controllerPublic.js";

const router = express.Router();

//imobiliaria
router.get("/status", verifyToken, controlerPublic.status);
router.get("/followup/:cod", verifyToken, controlerPublic.followup);
router.post("/followup", verifyToken, controlerPublic.cadastrarFollow);
router.get("/arquivos/:cod", verifyToken, controlerPublic.arquivo);
router.get("/locatario/:cpfcnpj", verifyToken, controlerPublic.locatario);
router.get("/users/all", verifyToken, controlerPublic.getAllUsers);
router.post("/buscar/autocomplete", verifyToken, controlerPublic.buscarIdValueTodasTabelasAutoComplete);

//helpers
router.get("/helpers", verifyToken, onda_helpers.getAll);
router.post("/sinistro/tipoaquivo", verifyToken, onda_helpers.tipoArquivoSinistro);
router.put("/helpers", verifyToken, controllerPublic.updateHelpers);
router.post("/log/visualizacao/:matrix", verifyToken, controllerPublic.cadastrarLogVisualizacaoPortal);
router.get("/log/visualizacao/:matrix", verifyToken, controllerPublic.buscarLogVisualizacaoPortal);
router.get("/status/helpers", verifyToken, onda_helpers.buscarHelpersFiltrado);
router.get("/helpers/relatorio", verifyToken, onda_helpers.buscarRelatorioHelpers);
router.get("/status/relatorio", verifyToken, onda_helpers.buscarRelatorioStatus);
router.get("/helpers/setores", verifyToken, controllerPublic.buscarSetores);

//WEBSOCKET
router.get("/ws/clients", verifyToken, controllerPublic.getSummaryWebSocket);

//ARQUIVOS SISITEMA
router.post("/arquivo", verifyToken, controllerPublic.cadastrarArquivosSistema);
router.get("/arquivos", verifyToken, controllerPublic.buscarArquivosSistema);
router.put("/arquivo", verifyToken, controllerPublic.atualizarArquivosSistema);

export default router;
