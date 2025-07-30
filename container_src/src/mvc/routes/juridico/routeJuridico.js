import express from "express";

//Controllers
import controllerJuridico from "../../controllers/juridico/controllerJuridico.js";

//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";

const router = express.Router();

//WAVE
router.patch("/status/sinistro/:status/:cod", verifyToken, controllerJuridico.updateStatusSinistro);
router.get("/", verifyToken, controllerJuridico.juridico);
router.get("/:cod", verifyToken, controllerJuridico.buscarJuridicoCod);
router.post("/", verifyToken, controllerJuridico.cadastrarSinistro);
router.get("/contrato/:cod", verifyToken, controllerJuridico.buscarSinistroPeloContrato);
router.put("/", verifyToken, controllerJuridico.atualizarSinistro);
router.patch("/exoneracao/:cod/:email", verifyToken, controllerJuridico.exonerarCartaFianca);
router.put("/responsavel", verifyToken, controllerJuridico.atualizarResponsavelSinistro);
router.post("/enviar/aceite", verifyToken, controllerJuridico.enviarParaAceiteNoPortal);
router.post("/iniciar/analise7dias", verifyToken, controllerJuridico.abrirSinistroParaAnalisarNoPrazo7Dias);
router.post("/cancelar/wave/:codSinistro", verifyToken, controllerJuridico.cancelarSinistroNoWave);
router.post("/finalizar-contestacao/:codSinistro", verifyToken, controllerJuridico.finalizarContestacaoSinistro);
router.post("/aprovar-contestacao/:codSinistro", verifyToken, controllerJuridico.aprovarContestacaoSinistro);
router.get("/buscar/filtro", verifyToken, controllerJuridico.BuscarSinistrosPeloFiltroDinamico);
//PORTAL
router.post("/aceitar/:codSinistro", verifyToken, controllerJuridico.aceitarSinistroNoPortal);
router.post("/cancelar/:codSinistro", verifyToken, controllerJuridico.cancelarSinistroNoPortal);

router.post("/acordo", verifyToken, controllerJuridico.registrarAcordoJudicial);
router.get("/acordos/buscar", verifyToken, controllerJuridico.buscarAcordosJudiciais);
router.get("/acordos/buscar/:cod", verifyToken, controllerJuridico.buscarAcordosJudiciaisPeloCodigo);
router.get("/acordos/buscar/reference/:cod", verifyToken, controllerJuridico.buscarReferenciaPeloCodigoDaConta);
router.patch("/update/acordo", verifyToken, controllerJuridico.atualizarAcordoJudicial);
export default router;
