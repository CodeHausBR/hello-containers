//BIBLIOTECAS
import yup from "yup";
//HELPERS
//UTILS
import setResponse from "../../response/setResponse.js";
// HELPERS BANCOS
import helpersBancosSicoob from "../sicoob/helpersBancosSicoob.js";
import helpersBancosSicredi from "../sicred/helpersBancosSicred.js";
//SERVICES
import servicesFinanceiroRegras from "../../../mvc/services/financeiro/regras/servicesFinanceiroRegras.js";
import servicesFinanceiroQuery from "../../../mvc/services/financeiro/query/servicesFinanceiroQuery.js";
//BANCO DE DADOS
import onda_pay from "../../../mvc/models/analise/onda_pay.js";

const helpersBancosController = class helpersBancosController {
    constructor(data) {
        this.#validar_entrada(data);
        //definido pelo usuário no front
        this.acao = {
            id: data?.acao?.id,
            value: data?.acao?.value,
        };
        //array de ids vindo do front da tabela selecionada
        this.listaIdsPagamento = data?.listaIdsPagamento;
        //id do banco vindo do select do front
        this.banco = {
            id: data?.banco?.id,
            value: data?.banco?.value,
        };

        this.res = data?.res;
        this.token = data?.token;

        this.info_pagador = [];
        this.dadosParaGerarBoleto = {};
    }

    #validar_entrada(data) {
        try {
            const schema = yup.object().shape({
                acao: yup
                    .object()
                    .shape({
                        id: yup.number().integer().required("A ação é obrigatória!"),
                        value: yup.string().nullable(),
                    })
                    .required(),
                listaIdsPagamento: yup.array().required(),
                banco: yup
                    .object()
                    .shape({
                        id: yup.number().required(),
                        value: yup.string().required(),
                    })
                    .required("O banco é obrigatório!"),
            });

            schema.validateSync(data, {abortEarly: true});
            return true;
        } catch (error) {
            return setResponse.WARNING({message: `${error?.errors?.[0]}`, results: error?.errors});
        }
    }

    async controller() {
        this.dadosParaGerarBoleto = await this.#buscar_info_pagador();

        switch (this.acao.id) {
            case 1:
                await this.#regra_verificar_acao_cadastrar_boleto();
                break;
            default:
                return setResponse.WARNING({message: "Ação não enviada."});
        }

        await this.#verificar_banco_selecionado();
    }

    async #verificar_banco_selecionado() {
        if (this.banco.id == 10) {
            return await new helpersBancosSicredi({...this.dadosParaGerarBoleto, res: this.res}).controller();
        }

        if (this.banco.id == 14) {
            return await new helpersBancosSicoob({...this.dadosParaGerarBoleto, res: this.res}).controller();
        }

        return setResponse.NOT_FOUND({message: "Banco não encontrado"});
    }

    //REGRAS DE NECOCIO NAS AÇÕES DE VERIFICAR BOLETO
    async #regra_verificar_acao_cadastrar_boleto() {
        await servicesFinanceiroRegras.verificarSeASelecaoDeIdsDoContasAReceberPossuiArquivosCnabGeradoENaoGerado({ids: this.listaIdsPagamento, res: this.res});

        servicesFinanceiroRegras.verificarSeEPagamentoPendente({dadosPagamento: this.dadosParaGerarBoleto?.pagador, res: this.res});

        servicesFinanceiroRegras.verificarSeTipoDePagamentoEBoleto({dadosPagamento: this.dadosParaGerarBoleto?.pagador, res: this.res});
    }

    //FUNLÇ
    async #buscar_info_pagador() {
        const dadosPagamentoViewPay = await onda_pay.getAllPaymentsById({ids: this.listaIdsPagamento});

        const locatarios = await servicesFinanceiroQuery.buscarEnderecosDeCobrancaNoPagarme({arrayPagamentos: dadosPagamentoViewPay});
        const dadosParaGerarBoleto = new Object({acao: this.acao, pagador: locatarios, listaIdsPagamento: this.listaIdsPagamento, token: this.token});

        return dadosParaGerarBoleto;
    }
};

export default helpersBancosController;
