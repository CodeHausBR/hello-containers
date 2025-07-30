import express from "express";

//Controllers
import controllerMongoose from "../../controllers/mongoose/controllerMongoose.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const routePagarme = express.Router();

//COBRANÇA
routePagarme.post("/sincronizar/cartafianca", verifyToken, controllerMongoose.sincronizarDadosCartaFianca);
routePagarme.post("/sincronizar/contas", verifyToken, controllerMongoose.sincronizarDadosContas);

export default routePagarme;
