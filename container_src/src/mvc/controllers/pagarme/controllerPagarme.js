//BIBLIOTECAS
//HELPERS
import yup from "yup";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import apiPagarme from "../../../helpers/api/pagarme/api-pagarme.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import onda_helpers from "../../../mvc/models/public/onda_helpers.js";
import onda_pagarme_cobranca from "../../../mvc/models/pagarme/onda_pagarme_cobranca.js";
import onda_pagarme_cliente from "../../../mvc/models/pagarme/onda_pagarme_cliente.js";
import onda_pagrme_pedido from "../../../mvc/models/pagarme/onda_pagarme_pedido.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
//SERVICES
import servicesPagarmeQuery from "../../services/pagarme/query/servicesPagarmeQuery.js";

const controllerPagarme = class controllerPagarme {
    static async sincronizarDadosCobrancas(req, res) {
        try {
            const cobrancas = await onda_pagarme_cobranca.apiGetAllCobrancas();

            setResponse.SUCCESS({message: "2 minutos para sincronizar dados cobrança!", res: res});

            for (const cobranca of cobrancas) {
                await onda_pagarme_cobranca.create(cobranca);
            }
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async sincronizarDadosCobrancasCartaoDeCredito(req, res) {
        try {
            const {allClientes, listCode} = await onda_pagarme_cobranca.apiGetAllCobrancasCartaDeCredito();

            setResponse.SUCCESS({message: "2 minutos para sincronizar dados cobrança!", res: res, results: allClientes});

            await onda_pagarme_cobranca.sincPaidCreditCard(listCode)

            // for (const cobranca of allClientes) {
            //     await onda_pagarme_cobranca.create(cobranca);
            // }


        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarCobrancas(req, res) {
        try {
            const cobrancas = await onda_pagarme_cobranca.getAll();

            const results = {
                cobrancas: cobrancas,
            };
            return setResponse.SUCCESS({message: "Sucesso ao buscar cobrança pagarme!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarCobrancasPeloContrato(req, res) {
        try {
            const {cod} = req?.params;

            const cobrancas = await onda_pagarme_cobranca.getPeloCod({code: cod});

            const results = {
                cobrancas: cobrancas,
            };
            return setResponse.SUCCESS({message: "Sucesso ao buscar cobrança pagarme!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async sincronizarDadosClientes(req, res) {
        try {
            const clientes = await onda_pagarme_cliente.apiGetAllClientes();

            setResponse.SUCCESS({message: "2 minutos para sincronizar dados clientes!", res: res});
            for await (const cliente of clientes) {
                await onda_pagarme_cliente.create(cliente);
            }
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarClientes(req, res) {
        try {
            const clientes = await onda_pagarme_cliente.getAll();

            const results = {
                clientes: clientes,
            };
            return setResponse.SUCCESS({message: "Sucesso ao bucar clientes pagarme!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarPedidoPeloContrato(req, res) {
        try {
            const {cod} = req?.params;

            const clientes = await onda_pagrme_pedido.getOne({code: cod});

            const results = {
                pedidos: clientes,
            };
            return setResponse.SUCCESS({message: "Sucesso ao buscar pedido pagarme!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarPedidos(req, res) {
        try {
            const clientes = await onda_pagrme_pedido.getAll();

            const results = {
                pedidos: clientes,
            };
            return setResponse.SUCCESS({message: "Sucesso ao buscar pedidos pagarme!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async solicitarLinkPedidoCheckout(req, res) {
        try {
            const {pagarme, token} = req?.body;

            const arrayIds = await onda_helpers.buscarArrayIdHelpersStatus();

            const schema = yup.object().shape({
                pagarme: yup.object().shape({
                    contrato: yup.string().required("Contrato é obrigatório!").matches(/^OND-/, "O código deve ser o contrato ex: OND-4564564231-2024!"),
                    opcoesPagamento: yup
                        .object()
                        .shape({
                            id: yup
                                .number()
                                .required("pagarme.opcoesPagamento do pagarme é obrigatório")
                                .test("", `pagarme.opcoesPagamento deve ser: ${arrayIds?.helpers?.opcoesPagamentoPagarme}!`, (value) => {
                                    return arrayIds?.helpers?.opcoesPagamentoPagarme?.includes(value);
                                }),
                            value: yup.string().required("value do pagarme é obrigatório"),
                        })
                        .required("O pagarme é obrigatório!"),
                    tipoPagamento: yup
                        .object()
                        .shape({
                            id: yup
                                .number()
                                .required("pagarme.tipoPagamento do pagarme é obrigatório")
                                .test("", `pagarme.tipoPagamento deve ser: ${arrayIds?.tipoPagamento?.tiposLinkPagamentoPagarme}!`, (value) => {
                                    return arrayIds?.tipoPagamento?.tiposLinkPagamentoPagarme?.includes(value);
                                }),
                            value: yup.string().required("value do pagarme é obrigatório"),
                        })
                        .required("O pagarme é obrigatório!"),
                }),
            });

            const validacao = await yupSchemaValidate(schema, {pagarme}, {abortEarly: false});

            const cartaFianca = await onda_cartafianca.getOneNotResView(pagarme?.contrato);

            const accepted_multi_payment_methods = servicesPagarmeQuery.gerarArrayMultPagamentos({opcoesPagamento: validacao?.pagarme?.opcoesPagamento});

            if (validacao?.pagarme?.opcoesPagamento?.id == 406) {
                const adesao = servicesPagarmeQuery.gerarLinkCheckoutAdesao({cartaFianca: cartaFianca, accepted_multi_payment_methods: accepted_multi_payment_methods});
                await apiPagarme.gerarLinkPagarme({cartaFianca: cartaFianca, token: token, setPagamentosPagarme: adesao});
                return setResponse.SUCCESS({message: "Sucesso ao gerar link!", results: [], res: res});
            }

            if (validacao?.pagarme?.tipoPagamento?.id == 5) {
                return setResponse.WARNING({message: "Pagamento não informado!", results: [], res: res});
            }

            //boleto 30% ok
            if (validacao?.pagarme?.tipoPagamento?.id == 6) {
                const boleto30Percento = servicesPagarmeQuery.gerarLinkCheckouBoleto30Porcento({
                    cartaFianca: cartaFianca,
                    accepted_multi_payment_methods: accepted_multi_payment_methods,
                });
                await apiPagarme.gerarLinkPagarme({
                    cartaFianca: cartaFianca,
                    token: token,
                    setPagamentosPagarme: boleto30Percento,
                });
            }

            //cartão de crédito ok
            if (validacao?.pagarme?.tipoPagamento?.id == 2) {
                const cartaoCredito = servicesPagarmeQuery.gerarLinkCartaoCredito({cartaFianca: cartaFianca, accepted_multi_payment_methods: accepted_multi_payment_methods});
                await apiPagarme.gerarLinkPagarme({
                    cartaFianca: cartaFianca,
                    token: token,
                    setPagamentosPagarme: cartaoCredito,
                });
            }

            //recorrente precisa ser feito por checkout transparente
            // if (validacao?.pagarme?.tipoPagamento?.id == 3) {
            //     return setResponse.WARNING({message: "Precisa gerar uma assinatura!", results: [], res: res});

            //     const recorrente = servicesPagarmeQuery.gerarLinkCartaRecorrente({cartaFianca: cartaFianca});
            //     await apiPagarme.gerarLinkPagarme({cartaFianca: cartaFianca, token: token, setPagamentosPagarme: recorrente});
            // }

            //pix ok
            if (validacao?.pagarme?.tipoPagamento?.id == 4) {
                const recorrente = servicesPagarmeQuery.gerarPix({cartaFianca: cartaFianca, accepted_multi_payment_methods: accepted_multi_payment_methods});
                await apiPagarme.gerarLinkPagarme({cartaFianca: cartaFianca, token: token, setPagamentosPagarme: recorrente});
            }

            //de entrada +  parcelas sem juros no cartão de crédito
            if (validacao?.pagarme?.tipoPagamento?.id == 8) {
                const restante_pagar_cartao = servicesPagarmeQuery.gerar_link_restante_pagar_cartao_credito({
                    cartaFianca: cartaFianca,
                });
                const boleto30Percento = servicesPagarmeQuery.gerarLinkCheckouBoleto30Porcento({
                    cartaFianca: cartaFianca,
                    accepted_multi_payment_methods: accepted_multi_payment_methods,
                    meta_data: "cartao de crédito",
                    gerarBoletos: "false",
                });

                await Promise.all([
                    apiPagarme.gerarLinkPagarme({
                        cartaFianca: cartaFianca,
                        token: token,
                        setPagamentosPagarme: boleto30Percento,
                    }),
                    apiPagarme.gerarLinkPagarme({
                        cartaFianca: cartaFianca,
                        token: token,
                        setPagamentosPagarme: restante_pagar_cartao,
                    }),
                ]);
            }

            //1 + parcelas no boleto com juros
            if (validacao?.pagarme?.tipoPagamento?.id == 9) {
                const recorrente = servicesPagarmeQuery.gerarPix1XMaisParcelasUsadoNaRenovacao({
                    cartaFianca: cartaFianca,
                    accepted_multi_payment_methods: accepted_multi_payment_methods,
                });
                await apiPagarme.gerarLinkPagarme({cartaFianca: cartaFianca, token: token, setPagamentosPagarme: recorrente});
            }

            return setResponse.SUCCESS({message: "Sucesso ao gerar link!", results: [], res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async gerarLinkPagarmeDefaultValoresSetadosPeloUsuario(req, res) {
        try {
            const {pagarme, token} = req?.body;

            //const arrayIds = await onda_helpers.buscarArrayIdHelpersStatus();

            const schema = yup.object().shape({
                pagarme: yup.object().shape({
                    contrato: yup
                        .string()
                        .required("Contrato é obrigatório!")
                        .matches(/^OND-/, "O código deve ser o contrato ex: OND-4564564231-2024!")
                        .transform((value) => value?.trim()),
                    matrix: yup
                        .string()
                        .required("Matrix é obrigatório!")
                        .transform((value) => value?.trim()),
                    valor: yup
                        .number()
                        .required("Valor da cobrança é obrigatório!")
                        .transform((value) => Number(value) * 100),
                    parcelas: yup.number().required("Parcelas da cobrança é obrigatório!"),
                    // tipoPagamento: yup
                    //     .object()
                    //     .shape({
                    //         id: yup
                    //             .number()
                    //             .required("pagarme.tipoPagamento do pagarme é obrigatório")
                    //             .test("", `pagarme.tipoPagamento deve ser: ${arrayIds?.tipoPagamento?.tiposLinkPagamentoPagarme}!`, (value) => {
                    //                 return arrayIds?.tipoPagamento?.tiposLinkPagamentoPagarme?.includes(value);
                    //             }),
                    //         value: yup.string().required("value do pagarme é obrigatório"),
                    //     })
                    //     .required("O pagarme é obrigatório!"),
                }),
            });

            const {
                pagarme: {matrix, contrato, valor, parcelas, tipoPagamento},
            } = await yupSchemaValidate(schema, {pagarme}, {abortEarly: false});

            const matrixContrato = matrix + contrato;

            const setPagamentosPagarme = await servicesPagarmeQuery.gerarLinkCheckoutCobrancaPadrao({
                parcelas: parcelas,
                matrix: matrixContrato,
                valorAvistaPagarme: valor,
                valorPrazoPagarme: valor * 0.1,
            });

            const cartaFianca = await onda_cartafianca.getOneNotResView(contrato);
            cartaFianca.contrato = matrixContrato;

            await apiPagarme.gerarLinkPagarme({
                cartaFianca: cartaFianca,
                token: token,
                setPagamentosPagarme: setPagamentosPagarme,
            });

            return setResponse.SUCCESS({message: "Sucesso ao gerar link pagarme!", results: [], res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerPagarme;
