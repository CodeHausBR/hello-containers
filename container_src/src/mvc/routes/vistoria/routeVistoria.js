import express from "express";

//Controllers
import controllerVistoria from "../../controllers/vistoria/controllerVistoria.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const router = express.Router();

//imobiliaria
router.patch("/status/:status/:cod", verifyToken, controllerVistoria.status);
router.get("/", verifyToken, controllerVistoria.vistorias);
router.get("/imoveis", verifyToken, controllerVistoria.imoveis);
router.post("/agendar", verifyToken, controllerVistoria.agendarVistoria);


export default router;
