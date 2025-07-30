import express from "express";

//Controllers
import controllerImobiliaria from "../../controllers/imobiliaria/controllerImobiliaria.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const router = express.Router();

//imobiliaria
router.post("/config", verifyToken, controllerImobiliaria.cadastrarTaxasImobiliaria);
router.get("/config/:cod", verifyToken, controllerImobiliaria.buscarTaxasImobiliaria);
router.get("/config/contrato/:matrixImob/:id", controllerImobiliaria.montarContratoParaVisualizarAntesDeAssinar);
router.patch("/assinar/:matrix/:id", verifyToken, controllerImobiliaria.assinarContratoImobiliaria);
router.patch("/migrar", verifyToken, controllerImobiliaria.migrarImob);
router.patch("/status", verifyToken, controllerImobiliaria.alterarStatusImobiliaria);
export default router;
