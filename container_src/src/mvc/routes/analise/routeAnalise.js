import express from "express";

//Controllers
import controlerAnalise from "../../controllers/analise/controllerAnalise.js";

import upload from "../../../helpers/geral/upload.js";
//Helpers
import verifyToken from "../../../helpers/token/verify-token.js";
import controllerAnalise from "../../controllers/analise/controllerAnalise.js";

const router = express.Router();

//imobiliaria
router.get("/formas/pagamento", verifyToken, controlerAnalise.formasPagamento);
router.post("/anexo1/:cod/:tipo/:email", verifyToken, controlerAnalise.gerarAnexo1);
router.post("/motivo/reprovacao", verifyToken, controlerAnalise.motivoReprovacao);
router.patch("/locatario/:cod", verifyToken, controlerAnalise.atualizarLocatario);
//onda_cartafianca
/**
 * @deprecated
 */
router.post("", verifyToken, upload.documentoAny, verifyToken, controlerAnalise.cadastrarAnalise);
// router.post("/gerar/planos", verifyToken, upload.documentoAny, verifyToken, controlerAnalise.cadastrarAnaliseGerarPlanosAnalise);

router.post("/gerar/planos", verifyToken, upload.documentoAny, verifyToken, controlerAnalise.cadastrarAnaliseModeloDinamicoVersao2025);
router.post("/renovar", verifyToken, controlerAnalise.renovarContratoVersao2025);
router.patch("/:cod", verifyToken, controlerAnalise.atualizarAnaliseVersao2025);

router.patch("/estorno/:cod", verifyToken, controlerAnalise.estornoCartaFianca);
router.patch("/status/:status/:cod", verifyToken, controlerAnalise.status);
router.get("/planos/:cod", verifyToken, controllerAnalise.buscarParametroDeAnaliseContrato);
router.patch("/concluir/envio/:cod", verifyToken, controlerAnalise.concluirEnvioDaAnaliseV2);
router.patch("/concluir/envioDinamico/:cod", verifyToken, controlerAnalise.concluirEnvioDaAnaliseModeloDinamicoVersao2025);
//onda_pay
router.post("/ondapay", verifyToken, controlerAnalise.cadastrarOndaPay);
// RETIRAR APÓS A DATA 01/05/2025
// router.patch("/ondapay/:cod", verifyToken, controlerAnalise.atualizarOndaPay);
router.delete("/ondapay/:id", verifyToken, controlerAnalise.deletarPagamento);
router.get("/ondapay/:cod/:tipo", verifyToken, controlerAnalise.buscarPagamentos);
router.get("/ondapay/cobranca/busca/:cod", verifyToken, controlerAnalise.buscarPagamentosPelaCobranca);

//consulta API
router.get("/consulta/ia/:cpfCnpj", verifyToken, controlerAnalise.buscarJuridicaPeloCpfProcob);
router.get("/procob", verifyToken, controlerAnalise.buscarHistoricoAnalisesProcobNoBanco);
router.get("/serasa/:cpfcnpj", verifyToken, controlerAnalise.dados_consultados_serasa);
// RETIRAR APÓS A DATA 01/05/2025
//router.get("/buscar/planos/:cpfCnpj", verifyToken, controlerAnalise.buscarPlanosComBaseNasRegrasDaAnalise);
router.get("/procob/consulta/familiares/:cpfCnpj", verifyToken, controlerAnalise.buscarFamiliaresProcob);

//PARAMETROS ANALISE
router.get("/taxas", verifyToken, controlerAnalise.taxas);
router.post("/taxas", verifyToken, controlerAnalise.cadastrarTaxasDaCartaFianca);
router.post("/parametros", verifyToken, controlerAnalise.cadastrarParametroAnalise);
router.get("/parametros", verifyToken, controlerAnalise.buscarParametroAnalise);
router.get("/parametros/cartafianca/:cod", verifyToken, controlerAnalise.buscarParametroAnaliseCartaFianca);
//ONDA_CEBRACO_FINANCEIRA
router.get("/consulta/cebraco/financeira/:cpf", verifyToken, controlerAnalise.buscarDadosCebraco);

// ENCERRAMENTO CONTRATO
router.post("/cartafianca/encerramentocontrato", verifyToken, controlerAnalise.executarEncerramentoContrato);
router.post("/cartafianca/pdf/encerramentocontrato", verifyToken, controlerAnalise.gerarPDFformulario);
router.get("/cartafianca/encerramentocontrato/:cod", verifyToken, controlerAnalise.verificaEncerramentoContrato);

router.get("/verificarinadimplente", verifyToken, controlerAnalise.testeInadimplente);
// router.post("/cartafianca/exoneracao/novoformulario", verifyToken, controlerAnalise.recadastrarFormularioEncerramentoContrato);

// EXONERACAO

router.patch("/cartafianca/exoneracao/executar", verifyToken, controlerAnalise.executarExoneracaoCartafianca);
router.get("/cartafianca/exoneracao/verificar", verifyToken, controlerAnalise.executarVerificacaoExoneracao);
router.get("/cartafianca/exoneracoes", verifyToken, controlerAnalise.buscarExoneracoes);
router.patch("/cartafianca/exoneracao/responsavel", verifyToken, controlerAnalise.atulizarResponsavelExoneracao);
router.patch("/cartafianca/exoneracao/status", verifyToken, controlerAnalise.mudarEtapaExoneracao);
router.get("/cartafianca/:cod", verifyToken, controlerAnalise.buscarContratoPeloCodigo);
router.get("/verificarexoneracao", verifyToken, controlerAnalise.verificarExoneracao);
router.patch("/cartafianca/desoneracao", verifyToken, controlerAnalise.executarDesoneracaoContrato);
router.patch("/cartafianca/exoneracao/confirmar", verifyToken, controlerAnalise.executarConfirmacaoExoneracao)
export default router;
