import express from "express";

import verifyToken from "../../../helpers/token/verify-token.js";
import contollerLocatario from "../../controllers/locatario/controllerLocatario.js";

const router = express.Router();

router.use(verifyToken);

router.patch("/sincronia/:cod/:type/:corentType", contollerLocatario.atualizarLocatario);
router.get("/contratos/:locatario", contollerLocatario.buscarContratosDoLocatario);
router.get("/documentos/:cod", contollerLocatario.buscarDocumentosPorContrato);
router.get("/boletos/:cod", contollerLocatario.buscarBoletosPorContrato);
export default router;
2147483647;
