import express from "express";

//Controllers
import controllerUser from "../../controllers/user/controllerUser.js";
import controllerParceiro from "../../controllers/user/controllerParceiro.js";
import controllerExecutivo from "../../controllers/user/controllerExecutivo.js";
//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";
import contollerLocatario from "../../controllers/locatario/controllerLocatario.js";

//models

const router = express.Router();

//imobiliaria

router.get("/ativos", verifyToken, controllerUser.usersPorSetor);

//onda_imob
router.post("/imobiliaria", verifyToken, controllerUser.cadastrarImobiliaria);
router.get("/imobiliarias", verifyToken, controllerUser.getImobiliarias);
router.get("/imobiliaria/:cod", verifyToken, controllerUser.buscarImobiliaria);
router.put("/imobiliaria/:cod", verifyToken, controllerUser.atualilzarImobiliaria);
router.patch("/imobiliaria/:cod", verifyToken, controllerUser.atualilzarStatusImobiliaria);

//onda_user
router.post("/onda", verifyToken, controllerUser.cadastrarUsuarioOnda);
router.get("/onda", verifyToken, controllerUser.buscarUsuariosOnda);
router.get("/onda/:cod", verifyToken, controllerUser.buscarUsuarioOnda);
router.patch("/onda/:cod", verifyToken, controllerUser.atualizarUsuarioOnda);
router.put("/onda/:cod", verifyToken, controllerUser.atualizarUsuarioPermissoesOnda);

// new permissions - admin

router.get("/wave/:cod", verifyToken, controllerUser.buscarUserPermissoes);
router.post("/wave/permissao", verifyToken, controllerUser.atulizarUserPermissoes);

//onda_parceiro
router.get("/parceiro/imobiliarias", verifyToken, controllerParceiro.buscarImobiliariasDoParceiro);
router.get("/parceiro/contratos", verifyToken, controllerParceiro.buscarContratosDoParceiro);
router.get("/parceiro/analises", verifyToken, controllerParceiro.buscarAnalisesDoParceiro);
router.get("/parceiro/executivos", verifyToken, controllerParceiro.buscarExecutivosDoParceiro);
router.post("/parceiro", verifyToken, controllerParceiro.cadastrarParceiro);
router.put("/parceiro/:cod", verifyToken, controllerParceiro.atualizarParceiro);
router.get("/parceiros", verifyToken, controllerParceiro.buscarTodosParceiros);
router.get("/parceiro/:cod", verifyToken, controllerParceiro.buscarParceiroByCod);
router.get("/parceiro/buscar/filtro", verifyToken, controllerParceiro.buscarComissoesDoParceiro);

//onda_executivo
router.post("/executivo", verifyToken, controllerExecutivo.cadastrarExecutivo);
router.get("/executivo/imobiliarias", verifyToken, controllerExecutivo.buscarImobiliariasDoExecutivo);
router.get("/executivo/contratos", verifyToken, controllerExecutivo.buscarContratosDoExecutivo);
router.get("/executivo/analises", verifyToken, controllerExecutivo.buscarAnalisesDoExecutivo);
router.get("/executivos", verifyToken, controllerExecutivo.buscarTodosExecutivos);
router.get("/executivo/:cod", verifyToken, controllerExecutivo.buscarExecutivoByCod);
router.put("/executivo/:cod", verifyToken, controllerExecutivo.atualizarExecutivo);
router.get("/executivo/buscar/filtro", verifyToken, controllerExecutivo.buscarContasExecutivo);

router.get("/locatario/:cod", verifyToken, contollerLocatario.buscarLocatarioPeloCod);
export default router;
