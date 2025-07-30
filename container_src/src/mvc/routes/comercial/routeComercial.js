import express from "express";

//Controllers
import controllerComercial from "../../controllers/comercial/controllerComercial.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const router = express.Router();

//imobiliaria
router.get("/contratos/imobiliaria", verifyToken, controllerComercial.buscarAnalisesImobiliariaApi);
router.get("/contratos/imobiliaria/ids", verifyToken, controllerComercial.buscarArrayIdsAnalisesImobiliariaApi);
router.get("/contratos/:where", verifyToken, controllerComercial.contratos);
router.get("/contratossimplificado/:cod", verifyToken, controllerComercial.contratosSimplificado);
router.get("/contratos/:where/:filtro", verifyToken, controllerComercial.contratosFiltro);
router.get("/renovacao/contratos", verifyToken, controllerComercial.contratosRenovacao);
router.get("/contrato/:cod", verifyToken, controllerComercial.contrato);
router.patch("/status/:status/:cod", verifyToken, controllerComercial.status);
router.get("/imobiliarias", verifyToken, controllerComercial.imobiliarias);
router.get("/parceiros", verifyToken, controllerComercial.parceiros);

export default router;
