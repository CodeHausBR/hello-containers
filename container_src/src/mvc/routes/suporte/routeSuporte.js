import express from "express";

//Controllers
import controllerSuporte from "../../controllers/suporte/controllerSuporte.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

//models
import onda_suporte from "../../models/suporte/onda_suporte.js";

const router = express.Router();

//WAVE
router.post("", verifyToken, controllerSuporte.cadastrarSuporte);
router.get("", verifyToken, controllerSuporte.buscarSuportes);
router.get("/:cod", verifyToken, controllerSuporte.buscarSuporte);
router.patch("/:cod", verifyToken, controllerSuporte.autualizarSuporte);

export default router;
