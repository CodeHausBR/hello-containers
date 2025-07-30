//BIBLIOTECAS
import "dotenv/config";

//HELPERS
import onda_errors from "../../../mvc/models/public/onda_errors.js";
//BANCO DE DADOS
import onda_followup from "../../../mvc/models/public/onda_followup.js";
import onda_pagarme_pedido from "../../../mvc/models/pagarme/onda_pagarme_pedido.js";
import setResponse from "../../response/setResponse.js";
//SERVICES
import servicesPagarmeQuery from "../../../mvc/services/pagarme/query/servicesPagarmeQuery.js";
const SK_PAGARME = process.env.SK_TOKEN_PAGARME;

const apiPagarme = class apiPagarme {
    static header() {
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");
        myHeaders.append("content-type", "application/json");
        myHeaders.append("authorization", `${SK_PAGARME}`);
        return myHeaders;
    }

    static formatarMoedaPagarme(valor) {
        return (valor / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }
    /**
     * Cria um pedido no checkout com vários meios de pagamento.
     *
     * @param {Object} props - Objeto contendo as propriedades necessárias.
     * @param {Object} props.cartaFianca - O código do pedido.
     * @param {Object} props.token - O código do pedido.
     * @param {Object} props.setPagamentosPagarme - O código do pedido.
     * @returns {Promise} - Uma promessa que resolve quando o pedido é criado.
     * @throws {Error} - Lança um erro se houver algum problema na criação do pedido.
     */

    static async gerarLinkPagarme(props) {
        const { cartaFianca, token, setPagamentosPagarme } = props;
        if (cartaFianca?.statusAnaliseCod !== 111 && cartaFianca?.statusAnaliseCod !== 114) return;

        const clientePagarme = await this.postCliente({ cartaFianca: cartaFianca, token: token });

        const myHeaders = this.header();

        const raw = JSON.stringify({
            code: cartaFianca?.contrato, // Codigo da carta fiança OND-123123123-2024
            customer_id: clientePagarme?.id, // Código do consumidos criado no pagarme: "cus_14yW44bFohM3WOJk"
            ...setPagamentosPagarme,
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        const results = await fetch("https://api.pagar.me/core/v5/orders", requestOptions)
            .then((response) => response.json())
            .then(async (response) => {
                if (response?.code != cartaFianca?.contrato) {
                    await onda_errors.postNotRes({ classe: "apiPagarme", statico: "gerarLinkPagarme", message: response });
                    await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `🤖 *Erro ao gerar link checkout pagarme 1 🛑` });
                } else {
                    await onda_pagarme_pedido.create({ data: response, token: token });
                    await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `🤖 *Sucesso ao gerar link checkout pagarme 🆗` });
                }
                return response;
            })
            .catch(async (err) => {
                await onda_errors.postNotRes({ classe: "apiPagarme", statico: "gerarLinkPagarme", message: err });
                await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `🤖 *Erro ao gerar link checkout pagarme 2 🛑` });
            });

        return results;
    }

    static async gerarLinkCadastroAnalise(props) {
        const { cartaFianca, token } = props;
        // await this.gerarLinkPagarme({
        //     cartaFianca: cartaFianca,
        //     token: token,
        //     setPagamentosPagarme: servicesPagarmeQuery.gerarLinkCheckoutAdesao({cartaFianca: cartaFianca}),
        // });
        await this.gerarLinkPagarme({
            cartaFianca: cartaFianca,
            token: token,
            setPagamentosPagarme: servicesPagarmeQuery.gerarLinkCheckouBoleto30Porcento({ cartaFianca: cartaFianca, meta_data: "cartao de crédito" }),
        });

        // await this.gerarLinkPagarme({
        //     cartaFianca: cartaFianca,
        //     token: token,
        //     setPagamentosPagarme: servicesPagarmeQuery.gerarLinkCheckoutTodosMeiosAvista({cartaFianca: cartaFianca}),
        // });
    }

    static async getPedido() {
        const options = {
            method: "GET",
            headers: {
                accept: "application/json",
                authorization: `${SK_PAGARME}`,
            },
        };

        fetch("https://api.pagar.me/core/v5/orders/or_wLMK2ONs7s1pGQEb", options)
            .then((response) => response.json())
            .then((response) => response)
            .catch((err) => console.error(err));
    }

    /**
     * Busca todos os pedidos relacionado ao contrato na carta fiança.
     *
     * @param {Object} props - Objeto contendo as propriedades necessárias.
     * @param {Object} props.cartaFianca - O código do pedido.
     * @param {Object} props.token - token.
     * @returns {Promise} - Uma promessa que resolve quando o pedido é criado.
     * @throws {Error} - Lança um erro se houver algum problema na criação do pedido.
     */
    static async getPedidos(props) {
        const { cartaFianca, token } = props;
        const options = {
            method: "GET",
            headers: {
                accept: "application/json",
                authorization: `${SK_PAGARME}`,
            },
        };

        const results = await fetch(`https://api.pagar.me/core/v5/orders?page=1&size=10&code=${cartaFianca?.contrato}`, options)
            .then((response) => response.json())
            .then(async (response) => {
                await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `*Sucesso ao buscar pedidos pagarme!` });
                return response;
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `*Erro ao buscar pedidos pagarme!` });
            });

        return results;
    }

    /**
     * Busca todos os pedidos relacionado ao contrato na carta fiança.
     *
     * @param {Object} props - Objeto contendo as propriedades necessárias.
     * @param {Object} props.cartaFianca - O código do pedido.
     * @param {Object} props.token - token.
     * @param {String} props.order_id - order_id cadastrado no pagarme como di co pedido.
     * @returns {Promise} - Uma promessa que resolve quando o pedido é criado.
     * @throws {Error} - Lança um erro se houver algum problema na criação do pedido.
     */
    static async cancelarPedido(props) {
        const { cartaFianca, token, order_id } = props;

        const options = {
            method: "PATCH",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                authorization: `${SK_PAGARME}`,
            },
            body: JSON.stringify({ status: "canceled" }),
        };

        const result = await fetch(`https://api.pagar.me/core/v5/orders/${order_id}/closed`, options)
            .then((response) => response.json())
            .then(async (response) => {
                await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `*Sucesso ao cancelar pedido pagarme!` });
                return response;
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `*Erro ao cancelar pedido pagarme!` });
            });

        return result;
    }

    /**
     * Busca todos os pedidos relacionado ao contrato na carta fiança.
     *
     * @param {Object} props - Objeto contendo as propriedades necessárias.
     * @param {Object} props.cartaFianca - O código do pedido.
     * @param {Object} props.token - token.
     * @returns {Promise} - Uma promessa que resolve quando o pedido é criado.
     * @throws {Error} - Lança um erro se houver algum problema na criação do pedido.
     */
    static async postCliente(props) {
        const { cartaFianca, token } = props;

        const myHeaders = this.header();

        const raw = JSON.stringify({
            phones: {
                home_phone: {
                    area_code: cartaFianca?.locatarioCelular?.slice(0, 2), //47
                    number: cartaFianca?.locatarioCelular?.slice(2), // 999065178
                    country_code: "55",
                },
            },
            name: cartaFianca?.locatario,
            email: cartaFianca?.locatarioEmail,
            code: cartaFianca?.locatarioCodigo, // codigo do locatario na tabela onda_locatario
            document: removerCaracteresEspeciaisEespacos(cartaFianca?.cpf),
            document_type: verificarSECpfOuCnpj(cartaFianca?.cpf),
            type: "individual",
            gender: "male",
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        const results = await fetch("https://api.pagar.me/core/v5/customers", requestOptions)
            .then((response) => response.json())
            .then(async (response) => {
                await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `*Sucesso ao cadastrar/atualizar cliente pagarme!` });
                return response;
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({ token: token, cod: cartaFianca?.contrato, event: `*Erro ao cadastrar/atualizar cliente pagarme!` });
            });

        function removerCaracteresEspeciaisEespacos(value) {
            const regex = /[^a-zA-Z0-9\s]/g;
            return value.replace(regex, "");
        }

        function verificarSECpfOuCnpj(value) {
            if (value.length > 11) {
                return "CNPJ";
            } else {
                return "CPF";
            }
        }

        return results;
    }

    static async getAllCobrancas() {
        const pageSize = 30; // Quantidade de itens por página
        const options = {
            method: "GET",
            headers: {
                accept: "application/json",
                authorization: `${SK_PAGARME}`,
            },
        };

        // Primeiro, faça uma requisição para obter a quantidade total de itens
        const firstResponse = await fetch(`https://api.pagar.me/core/v5/charges?page=1&size=${pageSize}`, options)
            .then((response) => response.json())
            .catch((err) => {
                return setResponse.INTERNAL_REQUEST_API_FAILED({ message: "Erro ao buscar pagamentos no pagarme!" });
            });

        // Pega a quantidade total de itens
        const quantidade = firstResponse?.paging?.total;

        // Calcula o número de páginas necessárias
        const totalPages = Math.ceil(quantidade / pageSize);

        // Array para armazenar todas as cobranças
        let allCobrancas = [];

        // Adiciona as cobranças da primeira página
        if (firstResponse?.data) {
            allCobrancas.push(...firstResponse.data);
        }

        // Para cada página restante, faça uma requisição
        for (let page = 2; page <= totalPages; page++) {
            const response = await fetch(`https://api.pagar.me/core/v5/charges?page=${page}&size=${pageSize}`, options)
                .then((response) => response.json())
                .catch((err) => {
                    return setResponse.INTERNAL_REQUEST_API_FAILED({ message: "Erro ao buscar pagamentos no pagarme!" });
                });

            if (response?.data) {
                allCobrancas.push(...response.data);
            }
        }

        // Retorna todas as cobranças juntas
        return allCobrancas;
    }
};

export default apiPagarme;

//Status das transações de Pix (Transaction)

// Status	         Descrição
// waiting_payment	 Aguardando pagamento
// paid	             Pago
// pending_refund	 Aguardando estorno
// refunded	         Estornado
// with_error	     Com erro
// failed	         Falha
