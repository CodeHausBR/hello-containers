//BIBLIOTECAS
//HELPERS

//BANCO DE DADOS

//SERVICES

const servicesPagarmeQuery = class servicesPagarmeQuery {
    static formatarMoedaPagarme(valor) {
        return (valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    static gerarParcelasCartaoCredito(cartaFianca) {
        const {parcelas, valorAvistaSemAdesaoPagarme, valorPrazoSemAdesaoPagarme} = cartaFianca;

        //USADO AGORA
        if (parcelas == 1) {
            return [{number: 1, total: valorAvistaSemAdesaoPagarme}];
        } else {
            return [{number: parcelas, total: valorPrazoSemAdesaoPagarme}];
        }

        //USADO ANTES:
        // const parcelasArray = [];

        // parcelasArray.push({
        //     number: 1,
        //     total: valorAvistaSemAdesaoPagarme,
        // });

        // for (let i = 2; i <= parcelas; i++) {
        //     parcelasArray.push({
        //         number: Number(i),
        //         total: valorPrazoSemAdesaoPagarme,
        //     });
        // }

        // return parcelasArray;
    }

    static gerarParcelasCartaoCreditoDefault({parcelas, valorAvistaSemAdesaoPagarme, valorPrazoSemAdesaoPagarme}) {
        //USADO AGORA
        if (parcelas == 1) {
            return [{number: 1, total: valorAvistaSemAdesaoPagarme}];
        } else {
            return [{number: parcelas, total: valorPrazoSemAdesaoPagarme}];
        }
        // const parcelasArray = [];

        // parcelasArray.push({
        //     number: 1,
        //     total: valorAvistaSemAdesaoPagarme,
        // });

        // for (let i = 2; i <= parcelas; i++) {
        //     parcelasArray.push({
        //         number: Number(i),
        //         total: valorPrazoSemAdesaoPagarme,
        //     });
        // }

        // return parcelasArray;
    }

    static gerar_link_restante_pagar_cartao_credito(props) {
        const {cartaFianca = []} = props;
        //de entrada +  parcelas sem juros no cartão de crédito
        return {
            metadata: {
                tipo: "cartão crédito",
                gerarAnexo1: true,
            },
            items: [
                {
                    amount: Number(cartaFianca?.restantePagar), // Preço final da carta fiança com as taxas
                    description: "Carta fiança - Onda Segura",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 1440000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "credit_card",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["credit_card"], //"boleto", "credit_card", "debit_card", "pix"
                        //accepted_multi_payment_methods: accepted_multi_payment_methods,
                        credit_card: {
                            capture: true,
                            statement_descriptor: "Onda Segura",
                            installments: [{number: Number(cartaFianca?.parcelas), total: Number(cartaFianca?.restantePagar)}],
                        },
                        // boleto: {
                        //     bank: "033",
                        //     instructions: "Pagamento Carta fiança - Onda Segura",
                        //     due_at: new Date(),
                        // },
                    },
                },
            ],
        };
    }

    static gerarLinkCheckouBoleto30Porcento(props) {
        const {cartaFianca, accepted_multi_payment_methods = [], meta_data, gerarBoletos} = props;
        return {
            metadata: {
                // Este tipo é utilizado para cadastrar os boletos quando ele é do tipo boleto
                tipo: `${meta_data || "boleto"} ${cartaFianca?.porcentagemPagamento * 100}% + adesão`,
                gerarAnexo1: "true",
                gerarBoletos: gerarBoletos || "true",
            },
            items: [
                {
                    amount: Number(cartaFianca?.pagamentoPorcentoPix11xBoletoPagarme), // Preço final da carta fiança com as taxas
                    description: `Entrada ${cartaFianca?.porcentagemPagamento * 100}% no pix de: ${this.formatarMoedaPagarme(
                        cartaFianca?.pagamentoPorcentoPix11xBoletoPagarme
                    )} + adesão.`,
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 1440000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "pix",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["pix"], //"boleto", "credit_card", "debit_card", "pix"
                        accepted_multi_payment_methods: accepted_multi_payment_methods,
                        pix: {
                            expires_in: "86400000", // 10 dias
                            additional_information: [
                                {
                                    name: "Onda Segura",
                                    value: "boleto30",
                                },
                            ],
                        },
                    },
                },
            ],
        };
    }

    static gerarLinkCheckoutAdesao(props) {
        const {cartaFianca, accepted_multi_payment_methods = []} = props;
        return {
            metadata: {
                tipo: "adesao",
                gerarAnexo1: false,
            },
            items: [
                {
                    amount: Number(cartaFianca?.valorAdesaoPagarme), // Preço final da carta fiança com as taxas
                    description: "Pagamento adesão da carta fiança locaticia - Onda Segura.",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 1440000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "pix",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["pix"],
                        accepted_multi_payment_methods: accepted_multi_payment_methods,
                        pix: {
                            expires_in: "86400000", // 10 dias
                            additional_information: [
                                {
                                    name: "Onda Segura",
                                    value: "adesao",
                                },
                            ],
                        },
                    },
                },
            ],
        };
    }

    static gerarLinkCheckoutTodosMeiosAvista(props) {
        const {cartaFianca, accepted_multi_payment_methods = []} = props;
        return {
            metadata: {
                tipo: "avista",
                gerarAnexo1: true,
            },
            items: [
                {
                    amount: Number(cartaFianca?.valorAvistaPagarme), // Preço final da carta fiança com as taxas
                    description: "Carta fiança - Onda Segura",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 1440000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "pix",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["pix", "boleto", "credit_card", "debit_card"], //"boleto", "credit_card", "debit_card", "pix"
                        //accepted_multi_payment_methods: accepted_multi_payment_methods,
                        // accepted_multi_payment_methods: [
                        //     //["credit_card", "credit_card"],
                        //     //["pix", "credit_card"],
                        // ],
                        boleto: {
                            bank: "033",
                            instructions: "Pagamento Carta fiança - Onda Segura",
                            due_at: new Date(),
                        },
                        pix: {
                            expires_in: "8640000", // 10 dias
                            additional_information: [
                                {
                                    name: "Onda Segura",
                                    value: "avista",
                                },
                            ],
                        },
                        debit_card: {
                            authentication: {
                                statement_descriptor: "Onda Segura",
                                type: "threed_secure",
                                threed_secure: {
                                    mpi: "acquirer",
                                    success_url: "https://ondasegura.com.br/",
                                },
                            },
                        },
                        credit_card: {
                            recurrence: false,
                            installments: this.gerarParcelasCartaoCredito(cartaFianca),
                            statement_descriptor: "Onda Segura",
                            success_url: "https://ondasegura.com.br/",
                            metadata: {
                                name: "Onda Segura",
                                value: "avista",
                            },
                        },
                    },
                },
            ],
        };
    }

    static gerarLinkCartaoCredito(props) {
        const {cartaFianca, accepted_multi_payment_methods = []} = props;

        const accepted_payment_methods = () => {
            if (accepted_multi_payment_methods?.[0]?.length > 0) return ["credit_card", "boleto"];
            return ["credit_card"];
        };

        return {
            metadata: {
                tipo: "cartão crédito",
                gerarAnexo1: true,
            },
            items: [
                {
                    amount: cartaFianca?.parcelas == 1 ? Number(cartaFianca?.valorAvistaSemAdesaoPagarme) : Number(cartaFianca?.valorPrazoSemAdesaoPagarme), // Preço final da carta fiança com as taxas
                    description: "Carta fiança - Onda Segura",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 144000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "credit_card",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: accepted_payment_methods(), //"boleto", "credit_card", "debit_card", "pix"
                        accepted_multi_payment_methods: accepted_multi_payment_methods,
                        credit_card: {
                            capture: true,
                            statement_descriptor: "Onda Segura",
                            installments: this.gerarParcelasCartaoCredito(cartaFianca),
                        },
                        boleto: {
                            bank: "033",
                            instructions: "Pagamento Carta fiança - Onda Segura",
                            due_at: new Date(),
                        },
                    },
                },
            ],
        };
    }

    static gerarLinkCartaRecorrente(props) {
        const {cartaFianca, accepted_multi_payment_methods = []} = props;
        return {
            metadata: {
                tipo: "recorrente",
                gerarAnexo1: true,
            },
            items: [
                {
                    amount: Number(cartaFianca?.valorCartaFiancaPagarme), // Preço final da carta fiança com as taxas
                    description: "Carta fiança - Onda Segura",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 14400, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "credit_card",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["credit_card"], //"boleto", "credit_card", "debit_card", "pix"
                        accepted_multi_payment_methods: accepted_multi_payment_methods,
                        // accepted_multi_payment_methods: [
                        //     //["credit_card", "credit_card"],
                        //     //["pix", "credit_card"],
                        // ],
                        credit_card: {
                            recurrence: true,
                            installments: cartaFianca?.parcelas, // Quantidade de parcelas escolhidas no sistema
                            statement_descriptor: "Onda Segura",
                            success_url: "https://ondasegura.com.br/",
                            metadata: {
                                name: "Onda Segura",
                                value: "credit_card",
                            },
                        },
                    },
                },
            ],
        };
    }

    static gerarPix(props) {
        const {cartaFianca, accepted_multi_payment_methods = []} = props;
        return {
            metadata: {
                tipo: "pix",
                gerarAnexo1: true,
            },
            items: [
                {
                    amount: Number(cartaFianca?.valorAvistaPagarme), // Preço final da carta fiança com as taxas
                    description: "Carta fiança - Onda Segura",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 14400, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "pix",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["pix"], //"boleto", "credit_card", "debit_card", "pix"
                        //accepted_multi_payment_methods: accepted_multi_payment_methods,
                        pix: {
                            expires_in: "864000", // 10 dias
                            additional_information: [
                                {
                                    name: "Onda Segura",
                                    value: "avista",
                                },
                            ],
                        },
                    },
                },
            ],
        };
    }

    static gerarArrayMultPagamentos(props) {
        const {opcoesPagamento} = props;

        if (opcoesPagamento?.id == 400) return [["credit_card", "credit_card"]];
        if (opcoesPagamento?.id == 401) return [];
        if (opcoesPagamento?.id == 402) return [];
        if (opcoesPagamento?.id == 403) return [["boleto", "credit_card"]];
        if (opcoesPagamento?.id == 404) return [["debit_card", "credit_card"]];
        if (opcoesPagamento?.id == 405) return [];

        return;
    }

    static gerarBoletoSemEntrada(props) {
        const {cartaFianca, accepted_multi_payment_methods = []} = props;

        const accepted_payment_methods = () => {
            if (accepted_multi_payment_methods?.[0]?.length > 0) return ["boleto", "credit_card"];
            return ["boleto"];
        };
        return {
            metadata: {
                tipo: "boleto sem entrada",
                gerarAnexo1: true,
            },
            items: [
                {
                    amount: Number(cartaFianca?.valorAvistaPagarme), // Preço final da carta fiança com as taxas
                    description: "Carta fiança - Onda Segura",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 144000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "boleto",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: accepted_payment_methods(), //"boleto", "credit_card", "debit_card", "pix"
                        accepted_multi_payment_methods: accepted_multi_payment_methods,
                        // accepted_multi_payment_methods: [
                        //     //["credit_card", "credit_card"],
                        //     //["pix", "credit_card"],
                        // ],
                        boleto: {
                            //bank: "033",
                            instructions: "Pagamento Carta fiança - Onda Segura",
                            due_at: new Date(),
                        },
                        // pix: {
                        //     expires_in: "864000", // 10 dias
                        //     additional_information: [
                        //         {
                        //             name: "Onda Segura",
                        //             value: "avista",
                        //         },
                        //     ],
                        // },
                        // debit_card: {
                        //     authentication: {
                        //         statement_descriptor: "Onda Segura",
                        //         type: "threed_secure",
                        //         threed_secure: {
                        //             mpi: "acquirer",
                        //             success_url: "https://ondasegura.com.br/",
                        //         },
                        //     },
                        // },
                        // credit_card: {
                        //     recurrence: false,
                        //     //installments: 1, // Quantidade de parcelas escolhidas no sistema
                        //     statement_descriptor: "Onda Segura",
                        //     success_url: "https://ondasegura.com.br/",
                        //     metadata: {
                        //         name: "Onda Segura",
                        //         value: "avista",
                        //     },
                        // },
                    },
                },
            ],
        };
    }

    static async gerarLinkCheckoutCobrancaPadrao({parcelas, matrix, valorAvistaPagarme, valorPrazoPagarme}) {
        return {
            metadata: {
                tipo: "cobranca-sinistro",
            },
            items: [
                {
                    amount: Number(valorAvistaPagarme), // Preço final da carta fiança com as taxas
                    description: "Pagamento de sinistro - Onda Segura",
                    quantity: 1,
                    code: matrix, // Codigo da carta fiança + OSC código da cobrança OSC-OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 144000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "pix",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["pix", "boleto", "credit_card", "debit_card"], //"boleto", "credit_card", "debit_card", "pix"
                        //accepted_multi_payment_methods: accepted_multi_payment_methods,
                        // accepted_multi_payment_methods: [
                        //     //["credit_card", "credit_card"],
                        //     //["pix", "credit_card"],
                        // ],
                        boleto: {
                            bank: "033",
                            instructions: "Pagamento Sinistro - Onda Segura",
                            due_at: new Date(),
                        },
                        pix: {
                            expires_in: "864000", // 10 dias
                            additional_information: [
                                {
                                    name: "Onda Segura",
                                    value: "avista",
                                },
                            ],
                        },
                        debit_card: {
                            authentication: {
                                statement_descriptor: "Onda Segura",
                                type: "threed_secure",
                                threed_secure: {
                                    mpi: "acquirer",
                                    success_url: "https://ondasegura.com.br/",
                                },
                            },
                        },
                        credit_card: {
                            recurrence: false,
                            installments: this.gerarParcelasCartaoCreditoDefault({
                                valorAvistaPagarme: valorAvistaPagarme,
                                parcelas: parcelas,
                                valorPrazoPagarme: valorPrazoPagarme,
                            }),
                            statement_descriptor: "Onda Segura",
                            success_url: "https://ondasegura.com.br/",
                            metadata: {
                                name: "Onda Segura",
                                value: "avista",
                            },
                        },
                    },
                },
            ],
        };
    }

    static gerarPix1XMaisParcelasUsadoNaRenovacao(props) {
        const {cartaFianca, accepted_multi_payment_methods = []} = props;

        const valorDivididoPor100 = Number(cartaFianca?.valorPrazoPagarme) / 100;
        const valorAgerar = Number(valorDivididoPor100) / Number(cartaFianca?.parcelas);
        const parcelaPagarAvista = Number(valorAgerar) * 1;

        const gerarVAlorPagarFormatoPagarme = Math.trunc(parcelaPagarAvista * 100);

        return {
            metadata: {
                tipo: "1 + parcelas no boleto com juros",
                gerarAnexo1: "true",
                gerarBoletos: "true",
            },
            items: [
                {
                    amount: Number(gerarVAlorPagarFormatoPagarme), // Preço final da carta fiança com as taxas
                    description: "Carta fiança - Onda Segura",
                    quantity: 1,
                    code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
                },
            ],
            payments: [
                {
                    payment_method: "checkout",
                    checkout: {
                        expires_in: 144000, // 10 dias Tempo, em minutos, para a expiração do checkout. Caso não seja enviado, o checkout não irá expirar.
                        customer_editable: false,
                        skip_checkout_success_page: false,
                        default_payment_method: "pix",
                        success_url: "https://ondasegura.com.br/",
                        accepted_payment_methods: ["pix"], //"boleto", "credit_card", "debit_card", "pix"
                        //accepted_multi_payment_methods: accepted_multi_payment_methods,
                        pix: {
                            expires_in: "864000", // 10 dias
                            additional_information: [
                                {
                                    name: "Onda Segura",
                                    value: "avista",
                                },
                            ],
                        },
                    },
                },
            ],
        };
    }
};

export default servicesPagarmeQuery;
