import express from "express";

//Controllers
import controllerFinanceiro from "../../controllers/financeiro/controllerFinanceiro.js";
import controllerPagarme from "../../controllers/financeiro/controllerPagarme.js";
import controllerAsaas from "../../controllers/financeiro/controllerAsaas.js";

//import upload from "../../../helpers/geral/upload.js";
//Helpers
import uploadEmMemoria from "../../../helpers/geral/upload-em-memoria.js";
import verifyToken from "../../../helpers/token/verify-token.js";

//MODELS
import onda_plataforma from "../../models/financeiro/onda_plataforma.js";
import onda_tipopagamento from "../../models/financeiro/onda_tipopagamento.js";

const router = express.Router();

//imobiliaria
//MODELS
router.get("/plataformas", onda_plataforma.get);
router.get("/tipopagamento", onda_tipopagamento.get);

//CONTROLLERS
router.patch("/status/:status/:cod", verifyToken, controllerFinanceiro.status);

//CONTA PAGAR
router.post("/conta/:matrix", verifyToken, controllerFinanceiro.postContaPagar);
router.post("/conta/sinistro/:codSinistro", verifyToken, controllerFinanceiro.postContaPagarSinistro);
router.put("/conta/:cod", verifyToken, controllerFinanceiro.putContaPagar);
router.patch("/contas", verifyToken, controllerFinanceiro.putStatusContaPagar);
router.patch("/contas/acordo", verifyToken, controllerFinanceiro.putStatusContaPagarAcordo);
router.get("/conta/:matrix/:ano/:mes", verifyToken, controllerFinanceiro.getAllByMatrix);
router.get("/contas/all/:ano/:mes", verifyToken, controllerFinanceiro.getAllContasJuntas);
router.get("/contas/filtro", verifyToken, controllerFinanceiro.getContasPagar);
router.get("/contas/pagas", verifyToken, controllerFinanceiro.getContasPagas);
router.get("/contas/matrix/filtro", verifyToken, controllerFinanceiro.getAllFiltroDinamico);
router.get("/contas", verifyToken, controllerFinanceiro.getAllNotResSemFiltro);

//FORCENEDOR
router.post("/fornecedor", verifyToken, controllerFinanceiro.postFornecedor);
router.put("/fornecedor/:cod", verifyToken, controllerFinanceiro.putFornecedor);
router.get("/fornecedores", verifyToken, controllerFinanceiro.getFornecedores);
router.get("/fornecedor/:cod", verifyToken, controllerFinanceiro.getFornecedor);

//CONTA BANCARIA
router.get("/contabancarias", verifyToken, controllerFinanceiro.getContasBancarias);
router.get("/contabancaria/:id", verifyToken, controllerFinanceiro.getContaBancaria);
router.post("/contabancaria/:cod", verifyToken, controllerFinanceiro.postContaBancaria);
router.put("/contabancaria/:id", verifyToken, controllerFinanceiro.putContaBancaria);

//PAGARME
router.post("/pagarme/pedido/:cod", verifyToken, controllerPagarme.postPedido);
router.get("/pagarme/pedidos/:cod", verifyToken, controllerPagarme.getPedidos);
router.patch("/pagarme/pedidos/:cod/:order_id", verifyToken, controllerPagarme.cancelarPedido);

//BOLETOS
router.post("/boleto", verifyToken, controllerFinanceiro.solicitarBoleto);
router.get("/boletos", verifyToken, controllerFinanceiro.buscarBoletosSolicitados);
// router.post("/boleto/cobranca", verifyToken, controllerFinanceiro.gerarBoletoCobranca);

// GERAÇÃO DE LOTES CNAB400
router.post("/knab240/troca/titulos", verifyToken, controllerFinanceiro.controllerBancos);
router.post("/cnab400/arquivo/retorno", uploadEmMemoria.multiple, verifyToken, controllerFinanceiro.lerArquivoDeRetorno);

//BANCOS ONDA SEGURA
router.post("/banco", verifyToken, controllerFinanceiro.cadastrarBanco);
router.get("/bancos", verifyToken, controllerFinanceiro.buscarBancos);
router.put("/bancos", verifyToken, controllerFinanceiro.atualizarBancos);
router.delete("/banco", verifyToken, controllerFinanceiro.deletarBanco);

//CONTAS A RECEBER
router.post("/cadastrar/conta/receber", verifyToken, controllerFinanceiro.criarContaAReceber);
router.get("/contas/receber/filtro", verifyToken, controllerFinanceiro.buscarContasAReceberPorQuery);
router.patch("/contas/receber/atualizar", verifyToken, controllerFinanceiro.atualizarContasAReceber);
router.get("/contas/receber/filtro/cartafianca", verifyToken, controllerFinanceiro.getAllContasComSinistroECartaFiancaFiltroDinamico);

//CONTROLLER ASAAS:
router.post("/asaas/sincronizar/cobrancas/:installment_id", verifyToken, controllerAsaas.sincronizarCobrancasPelaInstalment);
router.get("/asaas/sincronizar/cobrancas", verifyToken, controllerAsaas.sincronizarCobrancasPeloIdCliente);
router.get("/asaas/sincronizar/clientes", verifyToken, controllerAsaas.sincronizarClientesPelaCPFEmail);
router.put("/asaas/gerar/referencia/externa", verifyToken, controllerAsaas.geracaoReferenciaExternaPorParcela);

router.post("/acordoextrajudicial/conta", verifyToken, controllerFinanceiro.cadastrarContaAPagarAcordoExtrajudicial);
router.patch("/acordoextrajudicial/conta", verifyToken, controllerFinanceiro.updateContaAPagarAcordoExtrajudicial);
router.patch("/acordoextrajudicial/conta/delete", verifyToken, controllerFinanceiro.deleteContaAPagarAcordoExtrajudicial);
router.post("/buscarcontas/acordoextrajudicial", verifyToken, controllerFinanceiro.buscarContasAcordoExtrajudicial);
export default router;
