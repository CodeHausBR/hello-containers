//BIBLIOTECAS
//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import helpersControllerAsaas from "../../../../helpers/bancos/asaas/controller/helpersControllerAsaas.js";

//BANCO DE DADOS
import onda_followup from "../../../models/public/onda_followup.js";

//SERVICES

const servicesWebhookRegras = class servicesWebhookRegras {
    static verificarSeOScriptFoiEncontrado({ command }) {
        if (!command?.script && command?.script?.length > 0) {
            return setResponse.WARNING({ message: "Nenhum script a ser executado" });
        }

        return;
    }

    static async verificarSeTipoDePagamentoPrecisaGerarBoletoNoAsaas({ cartaFianca, dadosPagamento, dadosBodyPagarme }) {
        if (dadosBodyPagarme?.order?.metadata?.gerarBoletos == "true") {
            const totalRestantePagar = Number(cartaFianca?.valorCartaFianca) * Number(cartaFianca?.porcentagemPagamentoRestantePagar);

            const dadosBoleto = {
                dueDate: cartaFianca?.dataVencimentoBoletos || cartaFianca?.dataPagamentoIntervalo1MesParaDia10,
                externalReference: `PAY-241-${cartaFianca?.contrato}`,
                installmentCount: cartaFianca?.parcelas,
                totalValue: totalRestantePagar,
                description: `Recebimento de carta fiança - PAY-241-${cartaFianca?.contrato}`,
                // discount: {value: 10, dueDateLimitDays: 0, type: "PERCENTAGE"},
            };

            return await helpersControllerAsaas.criarCobrancaNoBoleto({ cartaFianca: cartaFianca, dadosPagamento: dadosPagamento, dadosBoleto: dadosBoleto });
        }

        return;
    }

    static async verificarSeACartaFiancaJaFoiPaga({ cf, total, token, dataBody }) {
        const valorCartaFianca = Number(cf.valorCartaFianca) + Number(cf.valoradesao);
        const valorWbhook = Number(dataBody?.data?.amount) / 100;

        const total_pago = Number(total) + Number(valorWbhook);

       if (valorCartaFianca <= Number(total) || valorCartaFianca < Number(total) + Number(valorWbhook)) {
            await onda_followup.postFollowup({
                token: token,
                cod: `PAY-241-${cf.contrato}`,
                event: `Webhook do Pagarme tentou cadastrar novas contas a receber mas não foi possível pois a cartafiança já está paga ou excede o valor da cartafianca. total_pago: ${total_pago}, valor cf: ${valorCartaFianca}`,
            });
            return true;
        }

        return false;
    }
};

export default servicesWebhookRegras;
