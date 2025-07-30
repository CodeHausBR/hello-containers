import express from "express";

//Controllers
import controllerAuth from "../../controllers/auth/controllerAuth.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const router = express.Router();

//imobiliaria

router.post("/login", controllerAuth.loginOndaExecutivosParceiros);

export default router;
