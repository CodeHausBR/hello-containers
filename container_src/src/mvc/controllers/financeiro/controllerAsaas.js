//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import helpersControllerAsaas from "../../../helpers/bancos/asaas/controller/helpersControllerAsaas.js";
import onda_followup from "../../models/public/onda_followup.js";
import onda_errors from "../../models/public/onda_errors.js";
import onda_pay from "../../models/analise/onda_pay.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
//BANCO DE DADOS

//SERVICES

const controllerAsaas = class controllerAsaas {
    static async sincronizarCobrancasPelaInstalment(req, res) {
        try {
            const installment_id = req?.params?.installment_id;

            const cobrancas = await helpersControllerAsaas.buscaCobrancasPeloInstallments({instalments: installment_id});

            return setResponse.SUCCESS({message: "Sucesso ao sincronizar pagamentos com Asaas!", results: cobrancas});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async sincronizarCobrancasPeloIdCliente(req, res) {
        try {
            const customerId = req?.query?.customerId;

            const cobrancas = await helpersControllerAsaas.buscaCobrancasPeloIdCliente({customerId: customerId});

            return setResponse.SUCCESS({message: "Sucesso ao sincronizar pagamentos com Asaas!", results: cobrancas});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async sincronizarClientesPelaCPFEmail(req, res) {
        try {
            const userCpf = req?.query?.cpf;
            // const userName = req?.query?.name;
            // const userEmail = req?.query?.email;

            const clientes = await helpersControllerAsaas.buscaClientesAsaasPeloNomeCPFEmail({
                cpf: userCpf,
                // , name: userName,
                // email: userEmail
            });

            return setResponse.SUCCESS({message: "Sucesso ao sincronizar pagamentos com Asaas!", results: clientes});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async geracaoReferenciaExternaPorParcela(req, res) {
        try {
            const {parcelas, customerId, token} = req.body;

            if (!parcelas || !Array.isArray(parcelas)) {
                return setResponse.BAD_REQUEST(res, {message: "Array de parcelas não fornecido ou inválido"});
            }

            const results = [];
            let payParcelas, payValorTotal;

            const firstParcela = parcelas[0];
            const identifier = firstParcela.installmentNumber !== null ? firstParcela.installment : firstParcela.id;
            for (const parcela of parcelas) {
                const {id, value, dueDate, externalReference, installmentNumber} = parcela;

                if (installmentNumber === null) {
                    payParcelas = 1;
                    payValorTotal = value;
                }
                await helpersControllerAsaas.geraReferenciaExterna({
                    idParcela: id,
                    valueParcela: value,
                    dueDateParcela: dueDate,
                    externalReference: externalReference,
                });
                results.push({idParcela: id, message: "Referência externa gerada com sucesso"});
            }

            const groupedBillings = await helpersControllerAsaas.buscaUltimaCobrancasPeloIdCliente({customerId, identifier});
            payParcelas = groupedBillings.installments.length;
            payValorTotal = groupedBillings.total;

            const externalReference = parcelas[0].externalReference;
            const cod = externalReference.slice(8, externalReference.length);
            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            if (!cartaFianca) {
                throw new Error("Carta fiança não encontrada para o código fornecido");
            }

            const parcelasEnriquecidas = parcelas.map((parcela) => {
                const statusPayment = helpersControllerAsaas.definir_status_conta_pelo_event_public({
                    status: parcela.status || "PENDING",
                });

                return {
                    ...parcela,
                    externalReference: parcela.externalReference,
                    statusPayment,
                };
            });

            const parcelasData = {data: parcelasEnriquecidas};

            await onda_pay
                .gerarParcelasApartirQuesEstaoDentroDoAsaas({
                    token: token,
                    cartaFianca: cartaFianca,
                    boletoAsaas: parcelasData || "",
                    cod: cod,
                    payParcelas: payParcelas,
                    payValorTotal: payValorTotal,
                })
                .then(async () => {
                    await onda_followup.postFollowup({cod: cod, event: "*Sucesso ao cadastrar pagamento no financeiro!"});
                })
                .catch(async (error) => {
                    await onda_errors.postNotRes({
                        classe: "servicesWebhookQuery",
                        statico: "postContasAReceberEGerarParcelas",
                        message: JSON.stringify(error)?.slice(0, 4900),
                    });
                    await onda_followup.postFollowup({cod: cod, event: "*Erro ao cadastrar pagamento no financeiro!"});
                    return setResponse.WARNING({message: "Erro ao cadastrar conta no evento webhook pagarme!"});
                });

            return setResponse.SUCCESS({message: "Referências externas atualizadas com sucesso!", results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerAsaas;
