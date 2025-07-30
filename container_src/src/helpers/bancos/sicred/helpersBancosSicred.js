//BIBLIOTECAS
import yup from "yup";
//HELPERS
import helpersArquivosBoleto from "../arquivos/boleto.js";
import helpersArquivosCnab400 from "../arquivos/cnab-400.js";
//BANCO DE DADOS
import onda_pay from "../../../mvc/models/analise/onda_pay.js";
//SERVICES
import servicesFinanceiroRegras from "../../../mvc/services/financeiro/regras/servicesFinanceiroRegras.js";
import servicesFinanceiroQuery from "../../../mvc/services/financeiro/query/servicesFinanceiroQuery.js";
//UTILS
import utilsArquivosDeLote from "../utils/ler-arquivo-retorno.js";
import setResponse from "../../response/setResponse.js";
import getToken from "../../token/get-token.js";
import onda_followup from "../../../mvc/models/public/onda_followup.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";

const helpersBancosSicredi = class helpersBancosSicredi {
    /**
     * @description -- Classe usada para realizar ações como cadastro de titulo no banco Sicredi
     * @param {object} data -- Objeto composto por um config = Object e locatario = Array
     */
    constructor(data) {
        this.#validar_objeto_yup(data);

        this.acao = {id: data?.acao?.id, value: data?.acao?.value};

        this.listaIdsPagamento = data?.listaIdsPagamento;
        this.banco = {
            id: "10",
            banco: "748",
            cooperativaAgencia: "2606",
            posto: "21",
            conta: "33009",
            digitoConta: "5",
            convenio: "08945",
            cnpj: "47389801000154",
            carteira: "1",
            moeda: "9",
            jurosDia: 0.3,
        };

        this.locatario = [
            {
                id: "",
                payCode: "",
                payContratoId: "",
                payContrato: "",
                payLocatario: "",
                payLocatarioCpf: "",
                payTitular: "",
                payDatacriacaoFormat: "",
                payCpf: "",
                payStatus: "",
                payPlatform: "",
                payValorTotal: "",
                payParcelas: "",
                payNumeroParcela: "",
                payValorparcelas: "",
                payVencimento: "",
                payVencimentoFormat: "",
                payTipopagamento: "",
                payCnabStatusGerado: "",
                payCnabNossoNumero: "",
                payCnabSeuNumero: "",
                payCnabStatusRetornoId: "",
                payTipoContaId: "",
                address: {
                    country: "",
                    state: "",
                    city: "",
                    neighborhood: "",
                    zip_code: "",
                    number: "",
                    street: "",
                },
            },
        ];
        this.locatario.shift();
        this.locatario.push(...data.pagador);

        this.token = data?.token;
        this.res = data?.res;
    }

    #validar_objeto_yup(data) {
        const schema = yup.object().shape({
            acao: yup.object().shape({
                id: yup.number().required("A ação é obrigatória!"),
                value: yup.string().required("A ação é obrigatória!"),
            }),
            // banco: yup.object().shape({
            //     banco: yup.string().required().min(3).max(3),
            //     cooperativaAgencia: yup.string().required().min(4).max(4),
            //     posto: yup.string().required().min(2).max(2),
            //     conta: yup.string().required().min(5).max(5),
            //     digitoConta: yup.string().required().min(1).max(1),
            //     convenio: yup.string().required().min(5).max(5),
            //     cnpj: yup.string().required().min(14).max(14),
            //     carteira: yup.string().required().min(1).max(1),
            //     moeda: yup.string().required().min(1).max(1),
            //     jurosDia: yup.number().required().max(1),
            // }),
            pagador: yup.array().of(
                yup.object().shape({
                    id: yup.number().required(),
                    payCod: yup.string().required(),
                    payContratoId: yup.string().required(),
                    payContrato: yup.string().required(),
                    payLocatario: yup.string().required(),
                    payLocatarioCpf: yup.string().required(),
                    payTitular: yup.string().required(),
                    payDatacriacaoFormat: yup.string().required(),
                    payCpf: yup.string().required(),
                    payStatus: yup.string().required(),
                    payPlatform: yup.string().required(),
                    payValorTotal: yup.string().required(),
                    payParcelas: yup.string().required(),
                    payNumeroParcela: yup.string().required(),
                    payValorparcelas: yup.string().required(),
                    payVencimento: yup.string().required(),
                    payVencimentoFormat: yup.string().required(),
                    payTipopagamento: yup.string().required(),
                    payCnabStatusGerado: yup.string().required(),
                    payCnabNossoNumero: yup.string().nullable(),
                    payCnabSeuNumero: yup.string().nullable(),
                    payCnabStatusRetornoId: yup.string().nullable(),
                    payTipoContaId: yup.string().required(),
                    address: yup.object().shape({
                        country: yup.string().required(),
                        state: yup.string().required(),
                        city: yup.string().required(),
                        neighborhood: yup.string().required(),
                        zip_code: yup.string().required(),
                        number: yup.string().required(),
                        street: yup.string().required(),
                    }),
                })
            ),
        });

        try {
            schema.validateSync(data, {abortEarly: false});
            return true;
        } catch (error) {
            const erros = error.inner.map((err) => ({
                campo: err.path,
                mensagem: err.message,
            }));
            return setResponse.WARNING({message: "Erro ao validar Sicredi", results: erros});
        }
    }

    async controller() {
        const executarAcao = {
            1: this.#gerarcnab(),
            2: this.#solicitarBaixa(),
        };
        try {
            await executarAcao?.[this.acao?.id];
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao gerar cnab para o banco Sicredi"});
        }
    }

    async #buscarToken() {
        return getToken();
    }

    async #gerarcnab() {
        if (this.acao.id !== 1) return;

        try {
            const ultimoRegistroDeNossoNumero = await onda_pay.getMaxByNossoNumero();

            const dataBody = await helpersArquivosBoleto.sicred({
                dadosBeneficiario: this.banco,
                dadosDevedor: this.locatario,
                ultimoNossoNumero: ultimoRegistroDeNossoNumero?.ultimoNossoNumero,
            });

            const listaDeNossosNumeros = await utilsArquivosDeLote.buscarNossosNumerosGerados(dataBody);

            const nossoNumeroJaExistente = await onda_pay.getAllNossoNumeroByNossoNumero(listaDeNossosNumeros);

            await servicesFinanceiroRegras.verificarSeExistemNossoNumeroDuplicado(nossoNumeroJaExistente);

            await servicesFinanceiroQuery.verificaSeERemessaDeCriacaoEAtualizaPagamentosSelecionados({
                config: this.acao.id,
                bancoID: this.banco.id,
                dataBody: dataBody,
                token: this.token,
            });

            const {buffer, nomeArquivo} = await helpersArquivosCnab400.gerarArquivoLoteTituloSicredi({dataBody: dataBody});

            this.res.setHeader("Content-Disposition", `attachment; filename=${"nomedoarquivo.rem"}`);
            this.res.setHeader("Content-Type", "application/octet-stream");
            this.res.send(buffer);
        } catch (error) {
            await onda_errors.postNotRes({
                classe: "helpersBancosSicredi",
                statico: "",
                funcao: "gerarcnab",
                status: "500",
                code: "ERROR_CONSULTA",
                type: "error",
                message: JSON.stringify(error),
            });
            return setResponse.WARNING({message: "Erro ao gerar cnab para o banco Sicredi"});
        }
    }

    async #solicitarBaixa() {}
};

export default helpersBancosSicredi;
