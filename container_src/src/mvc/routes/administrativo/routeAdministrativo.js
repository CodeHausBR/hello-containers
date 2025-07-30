import express from "express";

//Controllers
import controllerAdministrativo from "../../controllers/administrativo/controllerAdministrativo.js";

import upload from "../../../helpers/geral/upload.js";
//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const router = express.Router();

//imobiliaria

router.post("/ia", verifyToken, controllerAdministrativo.treinamentoIa);

export default router;
