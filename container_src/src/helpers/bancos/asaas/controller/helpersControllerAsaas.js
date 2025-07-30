//BIBLIOTECAS
import yup from "yup";
import axios from "axios";
//HELPERS
import setResponse from "../../../response/setResponse.js";
//BANCO DE DADOS

//SERVICES
import helpersServicesValidateAsaas from "../services/helpersServicesValidateAsaas.js";
import helpersServicesQueryAsaas from "../services/helpersServicesQueryAsaas.js";
import onda_errors from "../../../../mvc/models/public/onda_errors.js";
import onda_locatario from "../../../../mvc/models/analise/onda_locatario.js";
import serviceLocatarioQuery from "../../../../mvc/services/locatario/query/serviceLocatarioQuery.js";
import onda_followup from "../../../../mvc/models/public/onda_followup.js";
import executarQuery from "../../../../mvc/utils/mysql/funcoesQuery/executarQuery.js";
import {extrairCodigosCobranca} from "../../../../mvc/utils/datas/extract-cod.js";
const SK_TOKEN_ASAAS = process.env.SK_TOKEN_ASAAS;
const BASE_URL_ASAAS = process.env.BASE_URL_ASAAS;

const configBoletoMok = {
    billingType: "BOLETO",
    discount: {
        value: 0, //Valor perecetual ou fixo de desconto
        dueDateLimitDay: 0, // Até o dia do vencimento, 1 - 1 dia após o vencimento....
        type: "PERCENT", // PERCENT, FIXED
    },
    interest: {
        value: 3, //percentual de juros ao mês sobre o valor da cobrança após o vencimento
    },
    fine: {
        value: 0.03, //Percentual de multa sobre o valor da cobrança para pagamento após o vencimento
        type: "PERCENT", // PERCENT, FIXED
    },
};

const headers = () => {
    return {
        accept: "application/json",
        "content-type": "application/json",
        access_token: SK_TOKEN_ASAAS,
    };
};

const configNotificaoMok = [
    {
        enabled: true,
        emailEnabledForProvider: false,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: true,
        event: "PAYMENT_CREATED",
        scheduleOffset: 0,
        deleted: false,
    },
    {
        enabled: false,
        emailEnabledForProvider: false,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: false,
        smsEnabledForCustomer: false,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: false,
        event: "PAYMENT_RECEIVED",
        scheduleOffset: 0,
        deleted: false,
    },
    {
        enabled: true,
        emailEnabledForProvider: false,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: true,
        event: "PAYMENT_UPDATED",
        scheduleOffset: 0,
        deleted: false,
    },
    {
        enabled: true,
        emailEnabledForProvider: false,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: true,
        event: "PAYMENT_DUEDATE_WARNING",
        scheduleOffset: 10,
        deleted: false,
    },
    {
        enabled: true,
        emailEnabledForProvider: false,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: true,
        event: "PAYMENT_DUEDATE_WARNING",
        scheduleOffset: 0,
        deleted: false,
    },
    {
        enabled: true,
        emailEnabledForProvider: false,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: false,
        event: "SEND_LINHA_DIGITAVEL",
        scheduleOffset: 0,
        deleted: false,
    },
    {
        enabled: true,
        emailEnabledForProvider: true,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: true,
        event: "PAYMENT_OVERDUE",
        scheduleOffset: 0,
        deleted: false,
    },
    {
        enabled: true,
        emailEnabledForProvider: false,
        smsEnabledForProvider: false,
        emailEnabledForCustomer: true,
        smsEnabledForCustomer: true,
        phoneCallEnabledForCustomer: false,
        whatsappEnabledForCustomer: true,
        event: "PAYMENT_OVERDUE",
        scheduleOffset: 1,
        deleted: false,
    },
];

const helpersControllerAsaas = class helpersControllerAsaas {
    /**
     * @typedef {Object} CobrancaEventos
     * @property {string} PAYMENT_AUTHORIZED - Pagamento em cartão que foi autorizado e precisa ser capturado.
     * @property {string} PAYMENT_APPROVED_BY_RISK_ANALYSIS - Pagamento em cartão aprovado pela análise manual de risco.
     * @property {string} PAYMENT_CREATED - Geração de nova cobrança.
     * @property {string} PAYMENT_CONFIRMED - Cobrança confirmada (pagamento efetuado, porém o saldo ainda não foi disponibilizado).
     * @property {string} PAYMENT_ANTICIPATED - Cobrança antecipada.
     * @property {string} PAYMENT_DELETED - Cobrança removida.
     * @property {string} PAYMENT_REFUNDED - Cobrança estornada.
     * @property {string} PAYMENT_REFUND_DENIED - Estorno negado.
     * @property {string} PAYMENT_CHARGEBACK_REQUESTED - Recebido chargeback.
     * @property {string} PAYMENT_AWAITING_CHARGEBACK_REVERSAL - Disputa vencida, aguardando repasse da adquirente.
     * @property {string} PAYMENT_DUNNING_REQUESTED - Requisição de negativação.
     * @property {string} PAYMENT_CHECKOUT_VIEWED - Fatura da cobrança visualizada pelo cliente.
     * @property {string} PAYMENT_PARTIALLY_REFUNDED - Cobrança estornada parcialmente.
     * @property {string} PAYMENT_SPLIT_DIVERGENCE_BLOCK - Valor da cobrança bloqueado por divergência de split.
     * @property {string} PAYMENT_AWAITING_RISK_ANALYSIS - Pagamento em cartão aguardando aprovação pela análise manual de risco.
     * @property {string} PAYMENT_REPROVED_BY_RISK_ANALYSIS - Pagamento em cartão reprovado pela análise manual de risco.
     * @property {string} PAYMENT_UPDATED - Alteração no vencimento ou valor de cobrança existente.
     * @property {string} PAYMENT_RECEIVED - Cobrança recebida.
     * @property {string} PAYMENT_OVERDUE - Cobrança vencida.
     * @property {string} PAYMENT_RESTORED - Cobrança restaurada.
     * @property {string} PAYMENT_REFUND_IN_PROGRESS - Estorno em processamento (liquidação já está agendada, cobrança será estornada após executar a liquidação).
     * @property {string} PAYMENT_RECEIVED_IN_CASH_UNDONE - Recebimento em dinheiro desfeito.
     * @property {string} PAYMENT_CHARGEBACK_DISPUTE - Em disputa de chargeback (caso sejam apresentados documentos para contestação).
     * @property {string} PAYMENT_DUNNING_RECEIVED - Recebimento de negativação.
     * @property {string} PAYMENT_BANK_SLIP_VIEWED - Boleto da cobrança visualizado pelo cliente.
     * @property {string} PAYMENT_CREDIT_CARD_CAPTURE_REFUSED - Captura do cartão recusada.
     * @property {string} PAYMENT_SPLIT_CANCELLED - Cobrança teve um split cancelado.
     * @property {string} PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED - Bloqueio do valor da cobrança por divergência de split foi finalizado.
     */

    /**
     * Objeto contendo todos os tipos de eventos da Asaas
     * @type {CobrancaEventos}
     */
    constructor({cobranca}) {
        this.cobranca = {
            webhook: {
                id: cobranca.id, // evt_d26e303b238e509335ac9ba210e51b0f&8679046

                /**
                 * Tipo de evento recebido do webhook.
                 * Use a constante EVENTOS_ASAAS para obter as opções disponíveis com autocomplete.
                 * @type {keyof CobrancaEventos}
                 * @example
                 * // Definir o evento da cobrança:
                 * cobranca.event = EVENTOS_ASAAS.PAYMENT_RECEIVED;
                 */
                event: cobranca.event, // PAYMENT_RECEIVED

                dateCreated: cobranca.dateCreated, // 2025-03-11 17:47:02
            },
            payment: {
                object: cobranca.payment.object, // payment
                id: cobranca.payment.id, // pay_xnvypzl1r0q22gjh
                dateCreated: cobranca.payment.dateCreated, // 2025-03-11
                customer: cobranca.payment.customer, // cus_000006562871
                installment: cobranca.payment.installment, // 8d91458d-88cb-417a-87e6-dd19cdbfdcf2
                paymentLink: cobranca.payment.paymentLink, // null
                value: cobranca.payment.value, // 33.33
                netValue: cobranca.payment.netValue, // 32.34
                originalValue: cobranca.payment.originalValue, // null
                interestValue: cobranca.payment.interestValue, // null
                description: cobranca.payment.description, // Parcela 3 de 6. Pedido 056984
                billingType: cobranca.payment.billingType, // BOLETO
                canBePaidAfterDueDate: cobranca.payment.canBePaidAfterDueDate, // true
                confirmedDate: cobranca.payment.confirmedDate, // 2025-03-11
                pixTransaction: cobranca.payment.pixTransaction, // null
                status: cobranca.payment.status, // RECEIVED
                dueDate: cobranca.payment.dueDate, // 2025-08-10
                originalDueDate: cobranca.payment.originalDueDate, // 2025-08-10
                paymentDate: cobranca.payment.paymentDate, // 2025-03-11
                clientPaymentDate: cobranca.payment.clientPaymentDate, // 2025-03-11
                installmentNumber: cobranca.payment.installmentNumber, // 3
                invoiceUrl: cobranca.payment.invoiceUrl, // https://sandbox.asaas.com/i/xnvypzl1r0q22gjh
                invoiceNumber: cobranca.payment.invoiceNumber, // 07907291
                externalReference: cobranca.payment.externalReference, // 056984
                deleted: cobranca.payment.deleted, // false
                anticipated: cobranca.payment.anticipated, // false
                anticipable: cobranca.payment.anticipable, // false
                creditDate: cobranca.payment.creditDate, // 2025-03-11
                estimatedCreditDate: cobranca.payment.estimatedCreditDate, // 2025-03-11
                transactionReceiptUrl: cobranca.payment.transactionReceiptUrl, // https://sandbox.asaas.com/comprovantes/h/UEFZTUVOVF9SRUNFSVZFRDpwYXlfeG52eXB6bDFyMHEyMmdqaA%3D%3D
                nossoNumero: cobranca.payment.nossoNumero, // 10695118
                bankSlipUrl: cobranca.payment.bankSlipUrl, // https://sandbox.asaas.com/b/pdf/xnvypzl1r0q22gjh
                lastInvoiceViewedDate: cobranca.payment.lastInvoiceViewedDate, // null
                lastBankSlipViewedDate: cobranca.payment.lastBankSlipViewedDate, // null
                discount: {
                    value: cobranca?.payment?.discount?.value, // 10
                    limitDate: cobranca?.payment?.discount?.limitDate, // null
                    dueDateLimitDays: cobranca?.payment?.discount?.dueDateLimitDays, // 0
                    type: cobranca?.payment?.discount?.type, // PERCENTAGE
                },
                fine: {
                    value: cobranca?.payment?.fine?.value, // 1
                    type: cobranca?.payment?.fine?.type, // PERCENTAGE
                },
                interest: {
                    value: cobranca?.payment?.interest?.value, // 2
                    type: cobranca?.payment?.interest?.type, // PERCENTAGE
                },
                postalService: cobranca?.payment?.postalService, // false
                custody: cobranca?.payment?.custody, // null
                escrow: cobranca?.payment?.escrow, // null
                refunds: cobranca?.payment?.refunds, // null
            },
        };

        this.erro_validar_schema = this.#validar_objeto_webhook_cobranca_asaas();
        this.onda_pay_desc = this.#obter_descricao_evento();
        this.onda_pay_status = this.#definir_status_conta_pelo_event();
        this.onda_pay_status_status_cobranca = this.#definir_status_conta_pelo_status_da_cobranca();
    }

    static async createCustomer({cartaFianca, dadosCliente}) {
        const locatario = await helpersServicesQueryAsaas.getCustomerClient({codLocatario: cartaFianca?.locatarioCodigo});

        const verificarSeJaExisteCustomerNoAsaas = await helpersServicesQueryAsaas.getOneCostumerAsaas({cosutmerId: locatario?.onda_locatario_customer_id_asaas});

        let costumerAsaas = {};

        if (!locatario?.onda_locatario_customer_id_asaas || locatario?.onda_locatario_customer_id_asaas == null || !verificarSeJaExisteCustomerNoAsaas) {
            const options = {
                method: "POST",
                url: `${BASE_URL_ASAAS}/customers`,
                headers: headers(),
                data: {
                    name: locatario?.onda_locatario_nome,
                    cpfCnpj: locatario?.onda_locatario_cnpjcpf,
                    email: locatario?.onda_locatario_email,
                    phone: locatario?.onda_locatario_telefone,
                    mobilePhone: locatario?.onda_locatario_celular,
                    address: dadosCliente?.address?.street || null,
                    addressNumber: dadosCliente?.address?.number || null,
                    complement: dadosCliente?.address?.complement || null,
                    province: dadosCliente?.address?.neighborhood || null,
                    postalCode: dadosCliente?.address?.zip_code || null,
                    // externalReference: "12987382",
                    notificationDisabled: false,
                    // additionalEmails: "john.doe@asaas.com,john.doe.silva@asaas.com.br",
                    // municipalInscription: "46683695908",
                    // stateInscription: "646681195275",
                    // observations: "ótimo pagador, nenhum problema até o momento",
                    // groupName: null,
                    // company: null,
                    // foreignCustomer: false,
                },
            };

            await axios
                .request(options)
                .then(async (res) => {
                    costumerAsaas = res?.data;
                    await serviceLocatarioQuery.atualizarCostumerAsaas(locatario?.onda_locatario_codigo, costumerAsaas?.id);
                    await this.atualizarConfigNotificacoesPadrao({idCustomer: costumerAsaas?.id, configNotificacao: configNotificaoMok});
                })
                .catch(async (error) => {
                    await onda_errors.postNotRes({classe: "helpersControllerAsaas", statico: "createCustomer", message: JSON.stringify(error?.data)?.slice(0, 4900)});
                });
        }

        return costumerAsaas?.id || locatario?.onda_locatario_customer_id_asaas;
    }

    static async criarCobrancaNoBoleto({cartaFianca, dadosPagemento, dadosBoleto}) {
        const customerId = await this.createCustomer({cartaFianca: cartaFianca, dadosCliente: dadosPagemento});

        function ajustarDataProximoMes(dataString) {
            const data = new Date(dataString);
            const hoje = new Date();

            const isDataValida = !isNaN(data.getTime());

            if (!isDataValida || data < hoje) {
                const proximoMes = new Date();
                proximoMes.setMonth(proximoMes.getMonth() + 1);
                proximoMes.setDate(10);
                proximoMes.setHours(3, 0, 0, 0);

                return proximoMes.toISOString();
            }

            return dataString;
        }

        const options = {
            method: "POST",
            url: `${BASE_URL_ASAAS}/payments`,
            headers: headers(),
            data: {
                billingType: configBoletoMok?.billingType,
                customer: customerId,
                // dueDate: cartaFianca?.dataVencimentoBoletos || cartaFianca?.dataPagamentoIntervalo1MesParaDia10,
                dueDate: ajustarDataProximoMes(dadosBoleto?.dueDate),
                description: "",
                // externalReference: `${cartaFianca?.contrato}`,
                externalReference: dadosBoleto?.externalReference,
                // installmentCount: cartaFianca?.parcelas,
                installmentCount: dadosBoleto?.installmentCount,
                // totalValue: totalRestantePagar,
                totalValue: dadosBoleto?.totalValue,
                description: dadosBoleto?.description || "",
                // discount: {value: 10, dueDateLimitDays: 0, type: "PERCENTAGE"},
                interest: configBoletoMok?.interest,
                fine: configBoletoMok?.fine,
                postalService: false,
            },
        };

        const result = await axios
            .request(options)
            .then(async (res) => {
                await onda_followup.postFollowup({cod: dadosBoleto?.externalReference, event: "🆗" + "Sucesso ao gerar boleto na plataforma Asaas!"});
                if (res.data.status === "PENDING") {
                    const sinistroCobrancaCod = res?.data?.externalReference;
                    const adimplante = 1107;

                    if (sinistroCobrancaCod) {
                        const codigosCobranca = extrairCodigosCobranca(sinistroCobrancaCod);

                        if (codigosCobranca.length > 1) {
                            for (const cobranca of codigosCobranca) {
                                await executarQuery(`UPDATE onda_sinistro_cobranca SET onda_sinistro_cobranca_status = ? WHERE onda_sinistro_cobranca_cod = ?;`, [
                                    adimplante,
                                    cobranca,
                                ]);
                                await onda_followup.postFollowup({cod: sinistroCobrancaCod, event: "🤖 Status da cobrança alterado para adimplente! 🆗"});
                            }
                            await onda_followup.postFollowup({
                                cod: sinistroCobrancaCod,
                                event: "🤖 Todas as cobranças do conjunto alteradas para adimplente! 🆗",
                            });
                        } else {
                            await executarQuery(`UPDATE onda_sinistro_cobranca SET onda_sinistro_cobranca_status = ? WHERE onda_sinistro_cobranca_cod = ?;`, [
                                adimplante,
                                sinistroCobrancaCod,
                            ]);
                            await onda_followup.postFollowup({cod: sinistroCobrancaCod, event: "🤖 Status da cobrança alterado para adimplente! 🆗"});
                        }
                    }
                }
                return await this.buscaCobrancasPeloInstallments({instalments: res?.data?.installment});
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({cod: dadosBoleto?.externalReference, event: JSON.stringify(err?.response?.data)?.slice(0, 4900)});
                await onda_followup.postFollowup({cod: cartaFianca?.contrato, event: JSON.stringify(err?.response?.data)?.slice(0, 4900)});
                await onda_errors.postNotRes({classe: "helpersControllerAsaas", statico: "criarCobrancaNoBoleto", message: JSON.stringify(err?.response?.data)?.slice(0, 4900)});
                return {error: true};
            });

        return result;
    }

    static async buscaCobrancasPeloInstallments({instalments}) {
        const options = {
            method: "GET",
            url: `${BASE_URL_ASAAS}/payments?installment=${instalments}&limit=100`,
            headers: {
                accept: "application/json",
                access_token: SK_TOKEN_ASAAS,
            },
        };
        const boletos = await axios
            .request(options)
            .then((res) => {
                return res?.data;
            })
            .catch(async (err) => {
                await onda_errors.postNotRes({classe: "helpersControllerAsaas", statico: "buscaCobrancasPeloInstallments", message: JSON.stringify(err)?.slice(0, 4900)});
            });

        return boletos;
    }

    static async atualizarConfigNotificacoesPadrao({idCustomer = String(), configNotificacao = Array()}) {
        const listConfig = await this.buscarConfigDeNotificacao({idCustomer: idCustomer});

        const newConfig = listConfig?.data?.map((config) => {
            const configsPadrao = configNotificacao.filter((item) => item?.event == config?.event);
            for (const configs of configsPadrao) {
                if (configs?.scheduleOffset > 0 && config?.scheduleOffset > 0) {
                    const [cfg] = configsPadrao?.filter((item) => item?.scheduleOffset > 0);

                    Object.keys(cfg).forEach((key) => {
                        config[key] = cfg?.[key];
                    });
                } else if (configs?.scheduleOffset == 0 && config?.scheduleOffset == 0) {
                    const [cfg] = configsPadrao?.filter((item) => item?.scheduleOffset == 0);

                    Object.keys(cfg).forEach((key) => {
                        config[key] = cfg?.[key];
                    });
                }
            }

            return config;
        });

        const options = {
            method: "PUT",
            url: `${BASE_URL_ASAAS}/notifications/batch`,
            headers: headers(),
            data: {
                customer: idCustomer,
                notifications: newConfig,
            },
        };

        const configuracaoDeNotificacaoAtualizada = await axios
            .request(options)
            .then((res) => res?.data)
            .catch(async (err) => {
                await onda_errors.postNotRes({
                    classe: "helpersControllerAsaas",
                    statico: "atualizarConfigNotificacoesPadrao",
                    message: JSON.stringify(err?.response?.data)?.slice(0, 4900),
                });
            });
    }

    static async buscarConfigDeNotificacao({idCustomer}) {
        const options = {
            method: "GET",
            url: `${BASE_URL_ASAAS}/customers/${idCustomer}/notifications`,
            headers: {accept: "application/json", "content-type": "application/json", access_token: SK_TOKEN_ASAAS},
        };

        const data = await axios
            .request(options)
            .then((res) => res?.data)
            .catch(async (err) => {
                await onda_errors.postNotRes({
                    classe: "helpersControllerAsaas",
                    statico: "buscarConfigDeNotificacao",
                    message: JSON.stringify(err?.response?.data)?.slice(0, 4900),
                });
            });

        return data;
    }

    static async buscaClientesAsaasPeloNomeCPFEmail({
        cpf,
        // , email, name
    }) {
        try {
            const options = {
                method: "GET",
                url: `${BASE_URL_ASAAS}/customers?cpfCnpj=${cpf}`,
                headers: {accept: "application/json", "content-type": "application/json", access_token: SK_TOKEN_ASAAS},
            };
            const data = await axios
                .request(options)
                .then((res) => res?.data)
                .catch(async (err) => {
                    await onda_errors.postNotRes({
                        classe: "helpersControllerAsaas",
                        statico: "buscarConfigDeNotificacao",
                        message: JSON.stringify(err?.response?.data)?.slice(0, 4900),
                    });
                });
            return data;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao buscar cliente pelo CPF e E-mail"});
        }
    }

    static async buscaCobrancasPeloIdCliente({customerId}) {
        try {
            const options = {
                method: "GET",
                url: `${BASE_URL_ASAAS}/payments?customer=${customerId}`,
                headers: {accept: "application/json", "content-type": "application/json", access_token: SK_TOKEN_ASAAS},
            };
            const data = await axios
                .request(options)
                .then((res) => res?.data)
                .catch(async (err) => {
                    await onda_errors.postNotRes({
                        classe: "helpersControllerAsaas",
                        statico: "buscarConfigDeNotificacao",
                        message: JSON.stringify(err?.response?.data)?.slice(0, 4900),
                    });
                });

            return data;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao buscar cobrança pelo Id do cliente"});
        }
    }

    static async buscaUltimaCobrancasPeloIdCliente({customerId, identifier}) {
        try {
            const options = {
                method: "GET",
                url: `${BASE_URL_ASAAS}/payments?customer=${customerId}`,
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    access_token: SK_TOKEN_ASAAS,
                },
            };

            const response = await axios.request(options);
            const payments = response.data.data;

            const groupBillings = (payments) => {
                const billingsMap = {};
                payments.forEach((payment) => {
                    const installmentId = payment.installment == null ? payment.id : payment.installment;

                    if (!billingsMap[installmentId]) {
                        billingsMap[installmentId] = {
                            id: installmentId,
                            description: payment.externalReference == null ? payment.description : payment.description.split(".")[1]?.trim() || "Cobrança sem descrição",
                            total: 0,
                            status: "Pendente",
                            installments: [],
                        };
                    }
                    billingsMap[installmentId].installments.push({...payment});
                    billingsMap[installmentId].total += payment.value;
                });
                return Object.values(billingsMap);
            };
            const groupedBillings = groupBillings(payments);
            const relevantGroup = groupedBillings.find((group) => group.id === identifier || group.installment === identifier);
            if (!relevantGroup) {
                throw new Error("Grupo de cobranças não encontrado para o identifier fornecido");
            }
            return relevantGroup;
        } catch (error) {
            // Tratamento de erro
            await onda_errors.postNotRes({
                classe: "helpersControllerAsaas",
                statico: "buscaCobrancasPeloIdCliente",
                message: JSON.stringify(error?.response?.data)?.slice(0, 4900),
            });
            return []; // Retorna array vazio em caso de erro
        }
    }

    static async geraReferenciaExterna({idParcela, valueParcela, dueDateParcela, externalReference}) {
        try {
            const options = {
                method: "PUT",
                url: `${BASE_URL_ASAAS}/payments/${idParcela}`,
                headers: {accept: "application/json", "content-type": "application/json", access_token: SK_TOKEN_ASAAS},
                data: JSON.stringify({
                    billingType: "BOLETO",
                    value: valueParcela,
                    dueDate: dueDateParcela,
                    externalReference: externalReference,
                    description:
                        externalReference.slice(0, 7) === "PAY-241"
                            ? `pagamento da carta fiança sincronizado ${externalReference}`
                            : externalReference.slice(0, 7) === "PAY-242"
                            ? `pagamento do sinistro sincronizado ${externalReference}`
                            : "sem descrição",
                }),
            };
            const data = await axios
                .request(options)
                .then((res) => res?.data)
                .catch(async (err) => {
                    await onda_errors.postNotRes({
                        classe: "helpersControllerAsaas",
                        statico: "buscarConfigDeNotificacao",
                        message: JSON.stringify(err?.response?.data)?.slice(0, 4900),
                    });
                });
            return data;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao gerar referência externa"});
        }
    }

    static async buscarUmaCobrancaPeloId({id, res}) {
        try {
            if (!id) {
                return setResponse.WARNING({
                    message: "Usuário não cadastrado no asaas!",
                    res: res,
                });
            }
            const options = {
                method: "GET",
                url: `${BASE_URL_ASAAS}/payments/${id}`,
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    access_token: SK_TOKEN_ASAAS,
                },
            };

            const response = await axios.request(options);
            const cobranca = response.data;

            if (cobranca.deleted === false) {
                return setResponse.WARNING({
                    message: "Consolidação só pode ser removida se não houver boletos cadastrados!",
                    res: res,
                });
            }
            return null;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao buscar cobrança pelo id!", res: res});
        }
    }

    /**
     * Retorna a descrição correspondente ao evento da Asaas
     * @param {string} evento - Código do evento
     * @returns {string} Descrição do evento
     * @example
     * const descricao = obter_descricao_evento('PAYMENT_RECEIVED');
     * // Retorna: "Cobrança recebida"
     */
    #obter_descricao_evento() {
        const descricoes = {
            PAYMENT_AUTHORIZED: "Pagamento em cartão que foi autorizado e precisa ser capturado",
            PAYMENT_APPROVED_BY_RISK_ANALYSIS: "Pagamento em cartão aprovado pela análise manual de risco",
            PAYMENT_CREATED: "Geração de nova cobrança",
            PAYMENT_CONFIRMED: "Cobrança confirmada (pagamento efetuado, porém o saldo ainda não foi disponibilizado)",
            PAYMENT_ANTICIPATED: "Cobrança antecipada",
            PAYMENT_DELETED: "Cobrança removida",
            PAYMENT_REFUNDED: "Cobrança estornada",
            PAYMENT_REFUND_DENIED: "Estorno negado",
            PAYMENT_CHARGEBACK_REQUESTED: "Recebido chargeback",
            PAYMENT_AWAITING_CHARGEBACK_REVERSAL: "Disputa vencida, aguardando repasse da adquirente",
            PAYMENT_DUNNING_REQUESTED: "Requisição de negativação",
            PAYMENT_CHECKOUT_VIEWED: "Fatura da cobrança visualizada pelo cliente",
            PAYMENT_PARTIALLY_REFUNDED: "Cobrança estornada parcialmente",
            PAYMENT_SPLIT_DIVERGENCE_BLOCK: "Valor da cobrança bloqueado por divergência de split",
            PAYMENT_AWAITING_RISK_ANALYSIS: "Pagamento em cartão aguardando aprovação pela análise manual de risco",
            PAYMENT_REPROVED_BY_RISK_ANALYSIS: "Pagamento em cartão reprovado pela análise manual de risco",
            PAYMENT_UPDATED: "Alteração no vencimento ou valor de cobrança existente",
            PAYMENT_RECEIVED: "Cobrança recebida",
            PAYMENT_OVERDUE: "Cobrança vencida",
            PAYMENT_RESTORED: "Cobrança restaurada",
            PAYMENT_REFUND_IN_PROGRESS: "Estorno em processamento (liquidação já está agendada, cobrança será estornada após executar a liquidação)",
            PAYMENT_RECEIVED_IN_CASH_UNDONE: "Recebimento em dinheiro desfeito",
            PAYMENT_CHARGEBACK_DISPUTE: "Em disputa de chargeback (caso sejam apresentados documentos para contestação)",
            PAYMENT_DUNNING_RECEIVED: "Recebimento de negativação",
            PAYMENT_BANK_SLIP_VIEWED: "Boleto da cobrança visualizado pelo cliente",
            PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: "Captura do cartão recusada",
            PAYMENT_SPLIT_CANCELLED: "Cobrança teve um split cancelado",
            PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED: "Bloqueio do valor da cobrança por divergência de split foi finalizado",
        };

        return descricoes?.[this.cobranca.webhook.event] || "Evento desconhecido";
    }

    static definir_status_conta_pelo_event_public({status}) {
        // #REGRAS: QUANDO FOR 0 NÃO ATUALIZAR O CAMPO onda_pay_status APENAS CADASTRA DESCRIÇÃO EM onda_pay_desc
        const statusPorEvento = {
            PAYMENT_AUTHORIZED: 505,
            // DE: Pagamento em cartão que foi autorizado e precisa ser capturado
            // PARA: 505
            PAYMENT_APPROVED_BY_RISK_ANALYSIS: 505,
            // DE: Pagamento em cartão aprovado pela análise manual de risco
            // PARA: 505
            PAYMENT_CREATED: 505,
            // DE: Geração de nova cobrança
            // PARA: aguardando pagamento
            PAYMENT_CONFIRMED: 505,
            // DE: Cobrança confirmada (pagamento efetuado, porém o saldo ainda não foi disponibilizado)
            // PARA: 505
            PAYMENT_ANTICIPATED: 505,
            // DE: Cobrança antecipada
            // PARA: 505
            PAYMENT_DELETED: 512,
            // DE: Cobrança removida
            // PARA: 512
            PAYMENT_REFUNDED: 507,
            // DE: Cobrança estornada
            // PARA: 507
            PAYMENT_REFUND_DENIED: 505,
            // DE: Estorno negado
            // PARA: 505
            PAYMENT_CHARGEBACK_REQUESTED: 507,
            // DE: Recebido chargeback
            // PARA: 507
            PAYMENT_AWAITING_CHARGEBACK_REVERSAL: 504,
            // DE: Disputa vencida, aguardando repasse da adquirente
            // PARA: aguardando pagamento
            PAYMENT_DUNNING_REQUESTED: 504,
            // DE: Requisição de negativação
            // PARA: 504
            PAYMENT_CHECKOUT_VIEWED: 505,
            // DE: Fatura da cobrança visualizada pelo cliente
            // PARA: link/boleto emitido
            PAYMENT_PARTIALLY_REFUNDED: 507,
            // DE: Cobrança estornada parcialmente
            // PARA: 507
            PAYMENT_SPLIT_DIVERGENCE_BLOCK: 504,
            // DE: Valor da cobrança bloqueado por divergência de split
            // PARA: 504
            PAYMENT_AWAITING_RISK_ANALYSIS: 504,
            // DE: Pagamento em cartão aguardando aprovação pela análise manual de risco
            // PARA: 504
            PAYMENT_REPROVED_BY_RISK_ANALYSIS: 505,
            // DE: Pagamento em cartão reprovado pela análise manual de risco
            // PARA: 505
            PAYMENT_UPDATED: 504,
            // DE: Alteração no vencimento ou valor de cobrança existente
            // PARA: 504
            PAYMENT_RECEIVED: 506,
            // DE: Cobrança recebida
            // PARA: 506
            PAYMENT_OVERDUE: 513,
            // DE: Cobrança vencida
            // PARA: 513
            PAYMENT_RESTORED: 504,
            // DE: Cobrança restaurada
            // PARA: 504
            PAYMENT_REFUND_IN_PROGRESS: 507,
            // DE: Estorno em processamento (liquidação já está agendada, cobrança será estornada após executar a liquidação)
            // PARA: 507
            PAYMENT_RECEIVED_IN_CASH_UNDONE: 504,
            // DE: Recebimento em dinheiro desfeito
            // PARA: 504
            PAYMENT_CHARGEBACK_DISPUTE: 504,
            // DE: Em disputa de chargeback (caso sejam apresentados documentos para contestação)
            // PARA: 504
            PAYMENT_DUNNING_RECEIVED: 506,
            // DE: Recebimento de negativação
            // PARA: 505
            PAYMENT_BANK_SLIP_VIEWED: 0,
            // DE: Boleto da cobrança visualizado pelo cliente
            // PARA: 505
            PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: 505,
            // DE: Captura do cartão recusada
            // PARA: 505
            PAYMENT_SPLIT_CANCELLED: 505,
            // DE: Cobrança teve um split cancelado
            // PARA: 505
            PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED: 505,
            // DE: Bloqueio do valor da cobrança por divergência de split foi finalizado
            // PARA: 505

            PENDING: 504,
            // DE: Aguardando Pagamento
            // PARA: 505
            PAID: 506,
            // DE: Pago
            // PARA: 505
            RECEIVED: 506,
            // DE: recebido
            // PARA: 506
            CANCELLED: 512,
            // DE: Cancelado
            // PARA: 505
            REFUNDED: 507,
            // DE: Estornado
            // PARA: 505
            BANK_PROCESSING: 511,
            // DE: Enviado para o banco
            // PARA: 505
            FAILED: 509,
            // DE: Falhou
            // PARA: 505
            OVERDUE: 513,
            // DE: Atrasada
            // PARA: 513
            AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST: 511,
            // DE: Em análise
            // PARA: 505
        };
        //SUMARIO DOS STATUS em onda_status ATÉ O DIA 12/03/2025
        // 501	gerar link de cartão de crédito
        // 502	gerar boleto
        // 503	gerar boleto imobiliária
        // 504	aguardando pagamento
        // 505	link/boleto emitido
        // 506	pagamento confirmado
        // 507	pagamento estornado
        // 508	aguardando gerar boleto
        // 509	erro ao gerar boleto
        // 510	erro ao atualizar boleto
        // 511	aguardando retorno do banco
        // 512	pagamento cancelado
        // 513	cobrança vencida
        return statusPorEvento[status] || 505; // 0 Significa que o status não deve ser atualizado apenas a descrição!
    }

    #definir_status_conta_pelo_event() {
        // #REGRAS: QUANDO FOR 0 NÃO ATUALIZAR O CAMPO onda_pay_status APENAS CADASTRA DESCRIÇÃO EM onda_pay_desc
        const statusPorEvento = {
            PAYMENT_AUTHORIZED: 0,
            // DE: Pagamento em cartão que foi autorizado e precisa ser capturado
            // PARA: 0
            PAYMENT_APPROVED_BY_RISK_ANALYSIS: 0,
            // DE: Pagamento em cartão aprovado pela análise manual de risco
            // PARA: 0
            PAYMENT_CREATED: 0,
            // DE: Geração de nova cobrança
            // PARA: aguardando pagamento
            PAYMENT_CONFIRMED: 0,
            // DE: Cobrança confirmada (pagamento efetuado, porém o saldo ainda não foi disponibilizado)
            // PARA: 0
            PAYMENT_ANTICIPATED: 0,
            // DE: Cobrança antecipada
            // PARA: 0
            PAYMENT_DELETED: 512,
            // DE: Cobrança removida
            // PARA: 512
            PAYMENT_REFUNDED: 507,
            // DE: Cobrança estornada
            // PARA: 507
            PAYMENT_REFUND_DENIED: 0,
            // DE: Estorno negado
            // PARA: 0
            PAYMENT_CHARGEBACK_REQUESTED: 507,
            // DE: Recebido chargeback
            // PARA: 507
            PAYMENT_AWAITING_CHARGEBACK_REVERSAL: 504,
            // DE: Disputa vencida, aguardando repasse da adquirente
            // PARA: aguardando pagamento
            PAYMENT_DUNNING_REQUESTED: 504,
            // DE: Requisição de negativação
            // PARA: 504
            PAYMENT_CHECKOUT_VIEWED: 0,
            // DE: Fatura da cobrança visualizada pelo cliente
            // PARA: link/boleto emitido
            PAYMENT_PARTIALLY_REFUNDED: 507,
            // DE: Cobrança estornada parcialmente
            // PARA: 507
            PAYMENT_SPLIT_DIVERGENCE_BLOCK: 504,
            // DE: Valor da cobrança bloqueado por divergência de split
            // PARA: 504
            PAYMENT_AWAITING_RISK_ANALYSIS: 504,
            // DE: Pagamento em cartão aguardando aprovação pela análise manual de risco
            // PARA: 504
            PAYMENT_REPROVED_BY_RISK_ANALYSIS: 0,
            // DE: Pagamento em cartão reprovado pela análise manual de risco
            // PARA: 0
            PAYMENT_UPDATED: 504,
            // DE: Alteração no vencimento ou valor de cobrança existente
            // PARA: 504
            PAYMENT_RECEIVED: 506,
            // DE: Cobrança recebida
            // PARA: 506
            PAYMENT_OVERDUE: 513,
            // DE: Cobrança vencida
            // PARA: 513
            PAYMENT_RESTORED: 504,
            // DE: Cobrança restaurada
            // PARA: 504
            PAYMENT_REFUND_IN_PROGRESS: 507,
            // DE: Estorno em processamento (liquidação já está agendada, cobrança será estornada após executar a liquidação)
            // PARA: 507
            PAYMENT_RECEIVED_IN_CASH_UNDONE: 504,
            // DE: Recebimento em dinheiro desfeito
            // PARA: 504
            PAYMENT_CHARGEBACK_DISPUTE: 504,
            // DE: Em disputa de chargeback (caso sejam apresentados documentos para contestação)
            // PARA: 504
            PAYMENT_DUNNING_RECEIVED: 506,
            // DE: Recebimento de negativação
            // PARA: 0
            PAYMENT_BANK_SLIP_VIEWED: 0,
            // DE: Boleto da cobrança visualizado pelo cliente
            // PARA: 0
            PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: 0,
            // DE: Captura do cartão recusada
            // PARA: 0
            PAYMENT_SPLIT_CANCELLED: 0,
            // DE: Cobrança teve um split cancelado
            // PARA: 0
            PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED: 0,
            // DE: Bloqueio do valor da cobrança por divergência de split foi finalizado
            // PARA: 0
        };

        //SUMARIO DOS STATUS em onda_status ATÉ O DIA 12/03/2025
        // 501	gerar link de cartão de crédito
        // 502	gerar boleto
        // 503	gerar boleto imobiliária
        // 504	aguardando pagamento
        // 505	link/boleto emitido
        // 506	pagamento confirmado
        // 507	pagamento estornado
        // 508	aguardando gerar boleto
        // 509	erro ao gerar boleto
        // 510	erro ao atualizar boleto
        // 511	aguardando retorno do banco
        // 512	pagamento cancelado
        // 513	cobrança vencida
        return statusPorEvento[this.cobranca.webhook.event] || 0; // 0 Significa que o status não deve ser atualizado apenas a descrição!
    }

    #definir_status_conta_pelo_status_da_cobranca() {
        // #REGRAS: QUANDO FOR 0 NÃO ATUALIZAR NADA EM onda_pay
        const statusPorEvento = {
            RECEIVED: 506,
            // DE: Cobrança recebida
            // PARA: 506
        };

        //SUMARIO DOS STATUS em onda_status ATÉ O DIA 12/03/2025
        // 501	gerar link de cartão de crédito
        // 502	gerar boleto
        // 503	gerar boleto imobiliária
        // 504	aguardando pagamento
        // 505	link/boleto emitido
        // 506	pagamento confirmado
        // 507	pagamento estornado
        // 508	aguardando gerar boleto
        // 509	erro ao gerar boleto
        // 510	erro ao atualizar boleto
        // 511	aguardando retorno do banco
        // 512	pagamento cancelado
        // 513	cobrança vencida
        return statusPorEvento?.[this?.cobranca?.payment?.status] || 0; // 0 Significa que o status não deve ser atualizado apenas a descrição!
    }

    #validar_objeto_webhook_cobranca_asaas() {
        try {
            const schema = yup.object().shape({
                webhook: yup.object().shape({
                    id: yup.string(),
                    event: yup.string(),
                    dateCreated: yup.string(),
                }),
                payment: yup
                    .object()
                    .shape({
                        object: yup.string(),
                        id: yup.string(),
                        dateCreated: yup.string(),
                        customer: yup.string(),
                        installment: yup.string().nullable(),
                        paymentLink: yup.mixed().nullable(),
                        value: yup.number(),
                        netValue: yup.number(),
                        originalValue: yup.mixed().nullable(),
                        interestValue: yup.mixed().nullable(),
                        description: yup.string().nullable(),
                        billingType: yup.string(),
                        canBePaidAfterDueDate: yup.boolean(),
                        confirmedDate: yup.string().nullable(),
                        pixTransaction: yup.mixed().nullable(),
                        status: yup.string(),
                        dueDate: yup.string(),
                        originalDueDate: yup.string().nullable(),
                        paymentDate: yup.string().nullable(),
                        clientPaymentDate: yup.string().nullable(),
                        installmentNumber: yup.number().nullable(),
                        invoiceUrl: yup.string().nullable(),
                        invoiceNumber: yup.string().nullable(),
                        externalReference: yup.string().nullable(),
                        deleted: yup.boolean(),
                        anticipated: yup.boolean(),
                        anticipable: yup.boolean(),
                        creditDate: yup.string().nullable(),
                        estimatedCreditDate: yup.string().nullable(),
                        transactionReceiptUrl: yup.string().nullable(),
                        nossoNumero: yup.string().nullable(),
                        bankSlipUrl: yup.string().nullable(),
                        lastInvoiceViewedDate: yup.mixed().nullable(),
                        lastBankSlipViewedDate: yup.mixed().nullable(),
                        discount: yup
                            .object()
                            .shape({
                                value: yup.number(),
                                limitDate: yup.mixed().nullable(),
                                dueDateLimitDays: yup.number(),
                                type: yup.string(),
                            })
                            .nullable(),
                        fine: yup
                            .object()
                            .shape({
                                value: yup.number(),
                                type: yup.string(),
                            })
                            .nullable(),
                        interest: yup
                            .object()
                            .shape({
                                value: yup.number(),
                                type: yup.string(),
                            })
                            .nullable(),
                        postalService: yup.boolean().nullable(),
                        custody: yup.mixed().nullable(),
                        escrow: yup.mixed().nullable(),
                        refunds: yup.mixed().nullable(),
                    })
                    .required(`"Informações do pagamento são obrigatórias" ${this?.cobranca?.payment?.externalReference}`),
            });

            return schema.validateSync(this.cobranca, {abortEarly: true});
        } catch (error) {
            return {erro: true, message: error};
        }
    }
};

export default helpersControllerAsaas;
