import express from "express";

//Controllers
import controllerCobranca from "../../controllers/cobranca/controllerCobranca.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";
import controllerJuridico from "../../controllers/juridico/controllerJuridico.js";

const router = express.Router();

//imobiliaria
router.patch("/status/:status/:cod", controllerCobranca.status);
router.get("/", verifyToken, controllerCobranca.buscarCobrancaAgrupadoPorMatrix);
router.get("/:cod", verifyToken, controllerCobranca.buscarCobrancaSinistroPeloContrato);
router.put("/responsavel", verifyToken, controllerCobranca.atualizarColaboradorResposavelCobranca);
router.put("/", verifyToken, controllerCobranca.atualizarCobranca);
router.put("/status", verifyToken, controllerJuridico.updateStatusCobranca);
router.get("/sinistro/itens/:cod", verifyToken, controllerCobranca.buscarItensSisnitro);
router.post("/sinistro/quitacao", verifyToken, controllerCobranca.gerarDocumentoQuitacaoDebito);
router.post("/sinistro/confissao", verifyToken, controllerCobranca.gerarDocumentoConfissaoDeDivida);
router.patch("/remover/pagamento/conjunta", verifyToken, controllerCobranca.avisaRemoverCobrancaNoAsaas);
export default router;
