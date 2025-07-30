import express from "express";

//Controllers
import controllerDashboard from "../../controllers/dashboard/controllerDashboard.js";
//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const router = express.Router();

//imobiliaria
router.get("/resumo/:inicial/:final", verifyToken, controllerDashboard.resumoWave);

//DASHBOARD ANALISE
router.post("/principal/analise", verifyToken, controllerDashboard.dashboardAnalise);

export default router;
