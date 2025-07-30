import express from "express";

//helpers
import verifyToken from "../../../helpers/token/verify-token.js";
//controllers
import controllerTi from "../../controllers/ti/controllerTi.js";

const router = express.Router();

//log tabelas
router.get("/log/:tabela", verifyToken, controllerTi.getTableLog);
router.get("/tabelas", verifyToken, controllerTi.getAllTables);
router.get("/relatorio/trigger", verifyToken, controllerTi.buscarRelatoriodeTriggersProducaoXSandbox);

//servidores
router.get("/screeper", controllerTi.buscarConsultasFeitas);
router.post("/screeper", controllerTi.screeperApi);
router.get("/server", verifyToken, controllerTi.buscarScripts);
router.get("/server/:side/:idapp/:idscript", controllerTi.buscarScript);
router.post("/server", verifyToken, controllerTi.cadastrarServidor);
router.post("/server/script/:id", verifyToken, controllerTi.cadastrarScript);
router.patch("/server/:id", verifyToken, controllerTi.atualizarServidor);
router.patch("/server/:server/:script", verifyToken, controllerTi.atualizarScript);

export default router;
