//BIBLIOTECAS
import BigNumber from "bignumber.js";
//HELPERS

//BANCO DE DADOS
import onda_errors from "../../../models/public/onda_errors.js";
import setResponse from "../../../../helpers/response/setResponse.js";
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
import onda_pay from "../../../models/analise/onda_pay.js";
import onda_followup from "../../../models/public/onda_followup.js";
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
//SERVICES

const servicesWebhookQuery = class servicesWebhookQuery {
    static async cadasTrarPagamentoFinanceiro({ token, dadosBodyPagarme }) {
        const tipoPagamento = verificarTipoPagamento();
        const cartaFianca = await onda_cartafianca.getOneNotResView(dadosBodyPagarme?.code);

        const valorPagarme = new BigNumber(dadosBodyPagarme?.amount || dadosBodyPagarme?.paid_amount || dadosBodyPagarme?.charges?.[0]?.paid_amount || 0)
            .dividedBy(100)
            .decimalPlaces(2);
        const pay = new Object({
            payContrato: dadosBodyPagarme?.code || "N/A",
            payTitular:
                dadosBodyPagarme?.last_transaction?.card?.holder_name ||
                dadosBodyPagarme?.last_transaction?.payer?.name ||
                dadosBodyPagarme?.charges?.[0]?.last_transaction?.payer?.name ||
                "N/A", // ok
            payCpf:
                dadosBodyPagarme?.last_transaction?.card?.holder_document ||
                dadosBodyPagarme?.last_transaction?.payer?.document ||
                dadosBodyPagarme?.charges?.[0]?.last_transaction?.payer?.document ||
                "N/A", // ok
            payPlatform: 6, //ok
            payCardnumber: verificarCardNumber(), //fazendo
            paySerialnumber: verificarCardNumber2(), // fazendo
            payStatusPagamento: [2, 4, 1].includes(tipoPagamento) ? 506 : 504,
            payTipopagamento: tipoPagamento, //
            payDesc: "recebimento automatico via pagarme",
            payParcelas: 1, // ok
            payValorTotal: valorPagarme,
            payHelpersTipoPagamentoId: 241,
            payDataVencimento: verificarTipoPagamentoParaGerarVencimentoBoletos(),
            payMetaData: dadosBodyPagarme?.order?.metadata?.tipo || dadosBodyPagarme?.metadata?.tipo || "",
            payDataPagamento: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            // payDataPagamento: gerarSouQuandoForPagamentoConfirmado(),
        });

        // function gerarSouQuandoForPagamentoConfirmado() {
        //     if (dadosBodyPagarme?.payment_method == "pix" || dadosBodyPagarme?.payment_method == "credit_card") {
        //         return getDataHorarioAtual.YYYY_MM_DD_00_00_00();
        //     } else {
        //         return "";
        //     }
        // }

        function verificarTipoPagamentoParaGerarVencimentoBoletos() {
            if (dadosBodyPagarme?.payment_method == "pix") return getDataHorarioAtual.YYYY_MM_DD_00_00_00();
            if (dadosBodyPagarme?.payment_method == "boleto") return cartaFianca?.dataVencimentoBoletos || getDataHorarioAtual.YYYY_MM_DIA_10_FIXO_00_00_00();
            if (dadosBodyPagarme?.payment_method == "credit_card") return getDataHorarioAtual.YYYY_MM_DD_00_00_00();

            return getDataHorarioAtual.YYYY_MM_DIA_10_FIXO_00_00_00();
        }

        function verificarTipoPagamento() {
            if (dadosBodyPagarme?.payment_method == "pix") return 4;
            if (dadosBodyPagarme?.charges?.[0]?.payment_method == "pix") return 4;
            if (dadosBodyPagarme?.payment_method == "boleto") return 1;
            if (dadosBodyPagarme?.charges?.[0]?.payment_method == "boleto") return 1;
            if (dadosBodyPagarme?.payment_method == "credit_card") return 2;
            if (dadosBodyPagarme?.charges?.[0]?.payment_method == "credit_card") return 2;

            return 6;
        }

        function verificarCardNumber() {
            if (dadosBodyPagarme?.payment_method == "credit_card" || dadosBodyPagarme?.charges?.[0]?.payment_method == "credit_card") {
                return dadosBodyPagarme?.last_transaction?.card?.first_six_digits + "****" + dadosBodyPagarme?.last_transaction?.card?.last_four_digits;
            } else {
                return "";
            }
        }
        function verificarCardNumber2() {
            if (dadosBodyPagarme?.payment_method == "credit_card" || dadosBodyPagarme?.charges?.[0]?.payment_method == "credit_card") {
                return dadosBodyPagarme?.last_transaction?.acquirer_auth_code || "";
            } else {
                return "";
            }
        }
        // function verificarParcelas() {
        //     if (dadosBodyPagarme?.payment_method == "pix") return 1;
        //     if (dadosBodyPagarme?.payment_method == "boleto") return 1;
        //     if (dadosBodyPagarme?.payment_method == "credit_card") return 1;
        //     return dadosBodyPagarme?.last_transaction?.installments || 1;
        // }

        await onda_pay
            .postContasAReceberEGerarParcelas({ pay: pay, token: token, cartaFianca: cartaFianca })
            .then(async () => {
                await onda_followup.postFollowup({ cod: dadosBodyPagarme?.code, event: "*Sucesso ao cadastrar pagamento no financeiro!" });
            })
            .catch(async (error) => {
                await onda_errors.postNotRes({ classe: "servicesWebhookQuery", statico: "postContasAReceberEGerarParcelas", message: JSON.stringify(error)?.slice(0, 4900) });
                await onda_followup.postFollowup({ cod: dadosBodyPagarme?.code, event: "*Erro ao cadastrar pagamento no financeiro!" });
                return setResponse.WARNING({ message: "Erro ao cadastrar conta no evento webhook pagarme!" });
            });
    }

    static async cadasTrarParcelasDoBoletoFinanceiro({ token, dadosBodyPagarme, cfProcessada }) {
        if (dadosBodyPagarme?.order?.metadata?.gerarBoletos != "true") return;

        const cartaFianca = await onda_cartafianca.getOneNotResView(dadosBodyPagarme?.code);
        const totalRestantePagar = Number(cartaFianca?.valorCartaFianca) * Number(cartaFianca?.porcentagemPagamentoRestantePagar);

        if (totalRestantePagar == 0) return;

        const pay = new Object({
            payContrato: dadosBodyPagarme?.code || "N/A",
            payTitular: cartaFianca.locatario, // ok
            payCpf: cartaFianca.cpf, // ok
            payPlatform: 9, //ok
            payCardnumber: verificarCardNumber(), //fazendo
            paySerialnumber: verificarCardNumber2(), // fazendo
            payStatusPagamento: 508,
            payTipopagamento: 1, //
            payDesc: "cadastro via automação wave",
            payParcelas: cartaFianca?.parcelas, // ok
            payValorTotal: totalRestantePagar,
            payHelpersTipoPagamentoId: 241, //Utilizado na tabela onda_pay no campo onda_pay_tipo_conta_id para setar o recebimento da carta fiança
            payDataVencimento: getDataHorarioAtual.YYYY_MM_DD_00_00_00(cartaFianca?.dataVencimentoBoletos || cartaFianca?.dataPagamentoIntervalo1MesParaDia10),
            payMetaData: dadosBodyPagarme?.order?.metadata?.tipo || "",
            payDataPagamento: null,
        });

        function verificarCardNumber() {
            if (dadosBodyPagarme?.payment_method == "credit_card") {
                return dadosBodyPagarme?.last_transaction?.card?.first_six_digits + "****" + dadosBodyPagarme?.last_transaction?.card?.last_four_digits;
            } else {
                return "";
            }
        }

        function verificarCardNumber2() {
            if (dadosBodyPagarme?.payment_method == "credit_card") {
                return dadosBodyPagarme?.last_transaction?.acquirer_auth_code || "";
            } else {
                return "";
            }
        }

        await onda_pay
            .postContasAReceberEGerarParcelas({ pay: pay, token: token, cartaFianca: cartaFianca })
            .then(async (sucesso) => {
                await onda_followup.postFollowup({ cod: dadosBodyPagarme?.code, event: "*Sucesso ao cadastrar boletos no financeiro!" });
            })
            .catch(async (error) => {
                await onda_errors.postNotRes({ classe: "servicesWebhookQuery", statico: "cadasTrarParcelasDoBoletoFinanceiro", message: JSON.stringify(error)?.slice(0, 4900) });
                await onda_followup.postFollowup({ cod: dadosBodyPagarme?.code, event: "*Erro ao cadastrar pagamentos de boleto no financeiro!" });
                return setResponse.WARNING({ message: "Erro ao cadastrar conta no evento pagamentos de boleto webhook pagarme!" });
            });
    }

    static async cadasTrarParcelasDoBoletoAsaasNoFinanceiro({ token, dadosBodyPagarme, boletoAsaas = Object(), cfProcessada }) {
        if (boletoAsaas?.error == true) return;

        if (dadosBodyPagarme?.order?.metadata?.gerarBoletos != "true") return;

        const cartaFianca = await onda_cartafianca.getOneNotResView(dadosBodyPagarme?.code);
        const totalRestantePagar = Number(cartaFianca?.valorCartaFianca) * Number(cartaFianca?.porcentagemPagamentoRestantePagar);

        if (totalRestantePagar == 0) return;

        const pay = new Object({
            payContrato: dadosBodyPagarme?.code || "N/A",
            payTitular: cartaFianca.locatario, // ok
            payCpf: cartaFianca.cpf, // ok
            payPlatform: Object.keys(boletoAsaas)?.length > 0 ? 15 : 9, //ok
            payCardnumber: verificarCardNumber(), //fazendo
            paySerialnumber: verificarCardNumber2(), // fazendo
            payStatusPagamento: Object.keys(boletoAsaas)?.length > 0 ? 504 : 508,
            payTipopagamento: 1, //
            payDesc: "cadastro via automação wave",
            payParcelas: cartaFianca?.parcelas, // ok
            payValorTotal: totalRestantePagar,
            payHelpersTipoPagamentoId: 241, //Utilizado na tabela onda_pay no campo onda_pay_tipo_conta_id para setar o recebimento da carta fiança
            payDataVencimento: getDataHorarioAtual.YYYY_MM_DD_00_00_00(cartaFianca?.dataVencimentoBoletos || cartaFianca?.dataPagamentoIntervalo1MesParaDia10),
            payMetaData: dadosBodyPagarme?.order?.metadata?.tipo || "",
            payDataPagamento: null,
            payInstallments: Object.keys(boletoAsaas)?.length > 0 ? boletoAsaas?.data?.[0]?.installment : null,
            payInvoiceUrl: Object.keys(boletoAsaas).length > 0 ? boletoAsaas?.data?.[0]?.invoiceUrl : null,
        });

        function verificarCardNumber() {
            if (dadosBodyPagarme?.payment_method == "credit_card") {
                return dadosBodyPagarme?.last_transaction?.card?.first_six_digits + "****" + dadosBodyPagarme?.last_transaction?.card?.last_four_digits;
            } else {
                return "";
            }
        }

        function verificarCardNumber2() {
            if (dadosBodyPagarme?.payment_method == "credit_card") {
                return dadosBodyPagarme?.last_transaction?.acquirer_auth_code || "";
            } else {
                return "";
            }
        }

        await onda_pay
            .postContasAReceberEGerarParcelas({ pay: pay, token: token, cartaFianca: cartaFianca, boletoAsaas: boletoAsaas })
            .then(async (sucesso) => {
                await onda_followup.postFollowup({ cod: dadosBodyPagarme?.code, event: "*Sucesso ao cadastrar boletos no financeiro!" });
            })
            .catch(async (error) => {
                await onda_errors.postNotRes({ classe: "servicesWebhookQuery", statico: "cadasTrarParcelasDoBoletoFinanceiro", message: JSON.stringify(error)?.slice(0, 4900) });
                await onda_followup.postFollowup({ cod: dadosBodyPagarme?.code, event: "*Erro ao cadastrar pagamentos de boleto no financeiro!" });
                return setResponse.WARNING({ message: "Erro ao cadastrar conta no evento pagamentos de boleto webhook pagarme!" });
            });
    }
};

export default servicesWebhookQuery;
