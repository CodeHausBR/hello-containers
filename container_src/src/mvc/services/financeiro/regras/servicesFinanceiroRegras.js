import setResponse from "../../../../helpers/response/setResponse.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import helpersControllerAsaas from "../../../../helpers/bancos/asaas/controller/helpersControllerAsaas.js";
import onda_pagarme_pedido from "../../../models/pagarme/onda_pagarme_pedido.js";
import onda_pagarme_cliente from "../../../models/pagarme/onda_pagarme_cliente.js";
import onda_pagarme_cobranca from "../../../models/pagarme/onda_pagarme_cobranca.js";
import onda_followup from "../../../models/public/onda_followup.js";

const servicesFinanceiroRegras = class servicesFinanceiroRegras {
    static async verificarSeASelecaoDeIdsDoContasAReceberPossuiArquivosCnabGeradoENaoGerado({ids, res}) {
        const query = `
        SELECT 
            onda_pay_id as verificacao
            FROM onda_pay
            WHERE onda_pay_id IN(${ids})
            AND onda_pay_cnab_status_gerado = 1
        `;

        const [results] = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao validar se possui mais de um status de arquivo cnab selecionado!"});
        });

        if (results?.verificacao !== null && results?.verificacao !== undefined) {
            return setResponse.WARNING({message: "Selecione apenas titulos para criação de remessa ou titulos para atualização!"});
        }

        return;
    }

    static async verificarSeAOpcaoEParaGerarCnabESeAlgumJaEstaGerado({ids, res}) {
        const query = `
        SELECT 
            CASE WHEN SUM(onda_pay_cnab_status_gerado) > 0 THEN 1 ELSE 0 END as verificacao
            FROM onda_pay
            WHERE onda_pay_id IN(${ids})
        `;

        const [results] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao validar se todos os títulos selecionados ainda estão sem CNAB gerado!"});
        });

        if (!!results?.verificacao) {
            return setResponse.WARNING({message: "Selecione apenas titulos que ainda não foram gerados!"});
        }
    }

    static async verificarSeASelecaoESomenteSicredi({ids}) {
        const query = `
        SELECT DISTINCT onda_pay_plataforma FROM onda_pay WHERE onda_pay_id IN(${ids}) AND onda_pay_plataforma <> 10
        `;

        const [results] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao validar as plataformas selecionadas"});
        });

        if (results?.onda_pay_plataforma) {
            return setResponse.WARNING({message: "Selecione somente titulos com a plataforma SICREDI para gerar o CNAB"});
        }
    }

    static async verificarSeExistemNossoNumeroDuplicado(nossoNumero) {
        if (nossoNumero?.payCnabNossoNumero) {
            setResponse.WARNING({message: "Ops, aparentemente um dos códigos já existe no banco de dados. Por favor, tente novamente."});
        }
    }

    static verificarSeEPagamentoPendente({dadosPagamento, res}) {
        const pagamentosFiltrados = dadosPagamento.filter((pagamento) => pagamento.payStatus !== 508);

        if (pagamentosFiltrados?.length > 0) {
            return setResponse.WARNING({message: "Selecione apenas pagamento com o status aguradando gerar boleto"});
        }

        return;
    }

    static verificarSeTipoDePagamentoEBoleto({dadosPagamento, res}) {
        const pagamentosFiltrados = dadosPagamento.filter((pagamento) => pagamento.payTipopagamento !== 1 && pagamento.payTipopagamento !== 6 && pagamento.payTipopagamento !== 7);

        if (pagamentosFiltrados?.length > 0) {
            return setResponse.WARNING({message: "Selecione apenas pagamento do tipo boleto"});
        }

        return;
    }

    static async atualizarStatusRetornoCnabEStatusDoPagamento({informacoesArquivos = Object(), listaNossoNumeroPendenteDeAtualizacao = Array(), res}) {
        this.listaFiltrada = Array();
        listaNossoNumeroPendenteDeAtualizacao.map((nossoNumero) => {
            if (informacoesArquivos?.[nossoNumero?.nossoNumero]) {
                this.listaFiltrada.push({...nossoNumero, retorno: informacoesArquivos?.[nossoNumero?.nossoNumero] || {}});
            }
        });

        if (this.listaFiltrada?.length === 0) return setResponse.WARNING({message: "Nenhuma código nosso número localizado no arquivo de retorno"});

        return this.listaFiltrada;
    }

    static async verificarSePlataformaEAsaasParaGerarBoleto({pay, cartaFianca}) {
        if (pay?.payPlatform == 15 && [1, 6, 9].includes(pay?.payTipopagamento)) {
            const [pedidoPagarme] = await onda_pagarme_pedido.getOne({code: cartaFianca?.contrato});
            const dadosPagamento = await onda_pagarme_cliente.getOne(pedidoPagarme?.customer?.id);
            const tiposMensagem = {
                241: `Recebimento de carta fiança`,
                242: `Recebimento de sinistro`,
                243: `Recebimento de adesão de carta fiança`,
            };

            const dictionary = {
                241: `PAY-${pay?.payHelpersTipoPagamentoId}-${cartaFianca?.contrato}`,
                242: pay?.payCodCobranca,
            };

            const dadosBoleto = {
                dueDate: pay?.payDataVencimento,
                externalReference: dictionary?.[pay.payHelpersTipoPagamentoId],
                installmentCount: pay?.payParcelas,
                totalValue: pay?.payValorTotal,
                description: `${tiposMensagem?.[pay?.payHelpersTipoPagamentoId] || `Tipo inválido`} - PAY-${pay?.payHelpersTipoPagamentoId}-${cartaFianca?.contrato} - ${
                    pay?.payDesc
                }`,
            };

            const boletos = await helpersControllerAsaas.criarCobrancaNoBoleto({cartaFianca: cartaFianca, dadosPagamento: dadosPagamento, dadosBoleto: dadosBoleto});

            const newPay =
                Object.keys(boletos)?.length > 0
                    ? {
                          ...pay,
                          payInstallments: Object.keys(boletos)?.length > 0 ? boletos?.data?.[0]?.installment : null,
                          payStatusPagamento: Object.keys(boletos)?.length > 0 ? 504 : 508,
                          payInvoiceUrl: Object.keys(boletos).length > 0 ? boletos?.data?.[0]?.invoiceUrl : null,
                      }
                    : pay;

            return {boletos, newPay};
        }

        return {boletos: [], newPay: {}};
    }
    static async verificarAtualizacaoPermitidaAsaas(pay, old_payment) {
        const newPayment = pay[0];

        delete newPayment.onda_pay_desc;
        delete newPayment.onda_pay_datapagamento;

        if (newPayment?.onda_pay_plataforma == 15 || old_payment?.onda_pay_plataforma == 15) {
            const newDataCriacao = new Date(newPayment.onda_pay_datacriacao).getTime();
            const oldDataCriacao = new Date(old_payment.onda_pay_datacriacao).getTime();

            const camposComuns = Object.keys(newPayment).filter((key) => key in old_payment && key !== "onda_pay_datacriacao");

            const camposAlterados = camposComuns.filter((key) => {
                if (key.includes("data")) {
                    const newDate = newPayment[key] ? new Date(newPayment[key]).getTime() : null;
                    const oldDate = old_payment[key] ? new Date(old_payment[key]).getTime() : null;
                    return newDate !== oldDate;
                }

                return newPayment[key] !== old_payment[key];
            });

            const apenasDataCriacaoAlterada = camposAlterados.length === 0 && newDataCriacao !== oldDataCriacao;

            if (!apenasDataCriacaoAlterada) {
                return setResponse.WARNING({
                    message: "Boletos da plataforma Asaas só podem ter o campo 'data de criação' atualizado. Outros campos devem ser atualizados dentro da plataforma Asaas.",
                });
            }
        }

        return null;
    }

    static async verificarSeOValorExcedOValorDaCartafianca({pay, cf, token, total}) {
        const valorCartaFianca = Number(cf.valorCartaFianca) + Number(cf.valoradesao);
        const valorPay = Number(pay?.payValorTotal);
        const total_pago = Number(total) + Number(valorPay);

        if (parseFloat(valorCartaFianca.toFixed(1)) < parseFloat(total_pago.toFixed(1))) {
            await onda_followup.postFollowup({
                token: token,
                cod: `PAY-241-${cf.contrato}`,
                event: `Ação bloqueada pois o valor é maior que o valor da Cartafiança ou ela já está paga. total pago:${total_pago.toFixed(
                    1
                )}, valor cf: ${valorCartaFianca.toFixed(1)}, total: ${Number(total).toFixed(1)}`,
            });
            return setResponse.CONFLICT({
                message: `Ação bloqueada pois o valor é maior que o valor da Cartafiança ou ela já está paga. total pago:${total_pago.toFixed(
                    1
                )}, valor cf: ${valorCartaFianca.toFixed(1)}, total: ${Number(total).toFixed(1)}`,
            });
        }

        return false;
    }
};

export default servicesFinanceiroRegras;
