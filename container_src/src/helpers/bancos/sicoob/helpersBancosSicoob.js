//BIBLIOTECAS
import fs from "fs";
import https from "https";
import yup from "yup";
import axios from "axios";
import BigNumber from "bignumber.js";
//HELPERS
//BANCO DE DADOS
//MODELS
import onda_financeiro_boletos from "../../../mvc/models/mongoose/onda_financeiro_boletos.js";
import onda_followup from "../../../mvc/models/public/onda_followup.js";
//SERVICES
//UTILS
import utilsFormatar from "../../../mvc/utils/formatar/formatar.js";
import setResponse from "../../response/setResponse.js";
import utilsGeradorIdAleatorio from "../../../mvc/utils/gerador/id-aleatorio.js";
import servicesFinanceiroQuery from "../../../mvc/services/financeiro/query/servicesFinanceiroQuery.js";
import getDataHorarioAtual from "../../../mvc/utils/datas/get-data-horario-atual.js";
import helpersBancosUtilsData from "../utils/helpersBancosUtilsData.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";
//variáveis ambiente
const URL_TOKEN_API_SICOOB = process.env.URL_TOKEN_API_SICOOB;
const BASE_URL_CADASTRAR_BOLETOS = process.env.BASE_URL_WAVE_CADASTRAR_BOLETOS_SICOOB;
const TOKEN_API_SICOOB = process.env.SK_TOKEN_SECRET_SICOOB;
const CLIENT_ID_SICOOB = process.env.SK_TOKEN_CLIENT_ID_SICOOB;
const CERTIFICATE_PATH = process.env.CERTIFICATE_PATH;
const CERTIFICATE_PASSPHRASE = process.env.CERTIFICATE_PASSPHRASE;
//arquivos

const helpersBancosSicoob = class helpersBancosSicoob {
    constructor(data) {
        const newData = this.#validarObjetoSicoob(data);

        this.tokenSicoob = TOKEN_API_SICOOB;

        this.res = data?.res;
        this.token = data?.token;
        this.listaIdsPagamento = data?.listaIdsPagamento;
        this.acao = {
            id: newData?.acao?.id,
            value: newData?.acao?.value,
        };

        this.banco = {
            idBanco: 14,
            numeroCliente: 4985133,
            banco: 756,
            numeroContaCorrente: 1975897,
        };
        this.pagador = [
            {
                id: "",
                payCod: "",
                payLocatario: "",
                payLocatarioCpf: "",
                payLocatarioEmail: "",
                payStatus: "",
                payNumeroParcela: "",
                payValorparcelas: "",
                payVencimento: "",
                payVencimentoFormat: "",
                payCnabNossoNumero: "",
                payCnabSeuNumero: "",
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

        this.pagador.shift();
        this.pagador.push(...newData?.pagador);

        //utilizado na resposta de api da sicoob
        this.responsePostBoletosIncluirBoletos = {
            numeroCliente: "",
            //   codigoModalidade: 1,
              numeroContaCorrente: "",
              codigoEspecieDocumento: "DM",
              dataEmissao: "",
              nossoNumero: "",
              seuNumero: "",
              identificacaoBoletoEmpresa: "",
              codigoBarras: "",
              linhaDigitavel: "",
            //   identificacaoEmissaoBoleto: 1,
            //   identificacaoDistribuicaoBoleto: 1,
              valor: "",
              dataVencimento: "",
              dataLimitePagamento: "",
              tipoDesconto: "",
              tipoMulta: "",
              dataMulta: "",
              valorMulta: "",
              tipoJurosMora: "",
              dataJurosMora: "",
              valorJurosMora: "",
              numeroParcela: "",
              codigoNegativacao: "",
              numeroDiasNegativacao: "",
              pagador: {
                numeroCpfCnpj: "",
                nome: "",
                endereco: "",
                bairro: "",
                cidade:"",
                cep: "",
                uf: "",
                email: ""
              },
              pdfBoleto: "",
              qrCode: "",
        };
    }

    #validarObjetoSicoob(data) {
        try {
            const schema = yup.object().shape({
                acao: yup
                    .object()
                    .shape({
                        id: yup.number().integer().required(),
                        value: yup.string().required(),
                    })
                    .required(),
                pagador: yup.array().of(
                    yup.object().shape({
                        id: yup.number().integer().required(),
                        payCod: yup.string().required(),
                        payLocatario: yup.string().required(),
                        payLocatarioCpf: yup.string().required(),
                        payLocatarioEmail: yup.string().required().lowercase(),
                        payStatus: yup.number().integer().required(),
                        payNumeroParcela: yup.number().required(),
                        payValorparcelas: yup.string().required(),
                        payVencimento: yup.date().required(),
                        payVencimentoFormat: yup
                            .string()
                            .transform((value, originaValue) => {
                                if (originaValue && /\d{2}\/\d{2}\/\d{4}/.test(originaValue)) {
                                    const [dia, mes, ano] = originaValue.split("/");
                                    return `${ano}-${mes}-${dia}`;
                                }
                                return originaValue;
                            })
                            .test("is-valid-date", "A data não é válida", (value) => !isNaN(Date.parse(value)))
                            .required(),
                        payCnabNossoNumero: yup.string().nullable(),
                        payCnabSeuNumero: yup.string().nullable(),
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
            return schema.validateSync({acao: data?.acao, pagador: data?.pagador}, {abortEarly: true});
        } catch (error) {
            return setResponse.WARNING({message: `${error?.errors?.[0]}`, results: error?.errors});
        }
    }

    async controller() {
        await this.#postRequisicaoToken();
        // await this.#validarObjetoSicoob({acao: this.acao, pagador: this.pagador})
        await this.#postBoletosIncluirBoletos();
    }
    // token

    async #postRequisicaoToken() {
        try {
            const pfxPath = fs.readFileSync(`${CERTIFICATE_PATH}`);

            // Configurar o agente HTTPS
            const agent = new https.Agent({
                pfx: pfxPath,
                passphrase: `${CERTIFICATE_PASSPHRASE}`, // Verifique se está correta
            });

            // Configuração dos headers
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                Cookie: "TS01dfa94a=017a3a183b4fde23a32a7b0ea9c839a8301ee28f8dc4cf9e5748acf613237538ababbb11588547a042c7eb7defed12e4224fa29b1e16ba6067510e4296f31fab22c6787449b1193b1670ec884b363fe5d5cf3c459b; 447fb61b35fb4f9d67cbcbbebfb597fc=830981f775a2b3cadc29748d5768e9a2; TS012629b2=017a3a183b694a16d4f3ea6ccd1e16cb64836933e33fe6a0d35e7675fca0b57ce5e63d31be6798caacd0b0dfd0749979c3cd954639a8ab27689e1e6191c63f0c433d354c04",
            };

            // Configuração do corpo da requisição
            const data = new URLSearchParams();
            data.append("grant_type", "client_credentials");
            data.append("client_id", `${CLIENT_ID_SICOOB}`);
            data.append(
                "scope",
                `pagamentos_consulta pagamentos_inclusao pagamentos_alteracao boletos_consulta boletos_alteracao boletos_inclusao webhooks_inclusao webhooks_consulta webhooks_alteracao cco_transferencias cco_saldo cco_extrato cco_consulta convenios_escrita convenios_consulta investimentos_resgate investimentos_aplicacao investimentos_consulta sicoob_consentimento_pagamento_itp_leitura sicoob_consentimento_pagamento_itp_escrita pixpagamentos_webhook pixpagamentos_escrita pixpagamentos_consulta pix.write payloadlocation.write pix.read webhook.write cob.write lotecobv.write poupanca_aplicacoes poupanca_consulta poupanca_resgates spb_consulta spb_escrita`
            );

            // Fazer a requisição com Axios
            const response = await axios.post(`${URL_TOKEN_API_SICOOB}`, data, {
                headers: headers,
                httpsAgent: agent, // Passa o agente HTTPS
            });

            return (this.tokenSicoob = response.data.access_token);
        } catch (error) {
            await onda_errors.postNotRes({
                classe: "helpersBancosSicoob",
                statico: "postRequisicaoToken",
                funcao: "postReqyusicaoToken",
                status: "500",
                code: "ERROR_CONSULTA",
                type: "error",
                message: JSON.stringify(error?.message || error?.response?.data),
            });
        }
    }

    async #postBoletosIncluirBoletos() {
        const pfxPath = fs.readFileSync("./src/helpers/bancos/arquivos/sicoob.pfx");

        // Configurar o agente HTTPS
        const agent = new https.Agent({
            pfx: pfxPath,
            passphrase: `${CERTIFICATE_PASSPHRASE}`,
        });

        async function delay(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        const sqlForUpdate = [];

        for (const item of this.pagador) {
            function valorJurosMora(valor = Number(), porcentagem = Number()) {
                if (!valor || !porcentagem) return;
                const resultado = new BigNumber(Number(valor) * Number(porcentagem));
                return resultado.decimalPlaces(2);
            }

            const jurosMora = valorJurosMora(item?.payValorparcelas, 0.03);

            const raw = JSON.stringify({
                numeroCliente: this.banco.numeroCliente,
                codigoModalidade: 1,
                numeroContaCorrente: this.banco.numeroContaCorrente,
                codigoEspecieDocumento: "DM",
                dataEmissao: getDataHorarioAtual.YYYY_MM_DD(),
                // nossoNumero: 2588658,
                seuNumero: utilsGeradorIdAleatorio.gerarIdComNumeroDeCaracteresEspecifico(18),
                identificacaoBoletoEmpresa: item?.payCod,
                identificacaoEmissaoBoleto: 1,
                identificacaoDistribuicaoBoleto: 1,
                valor: Number(item?.payValorparcelas),
                dataVencimento: item?.payVencimentoFormat,
                // dataLimitePagamento: "2018-09-20",
                // valorAbatimento: 1,
                tipoDesconto: 0,
                // dataPrimeiroDesconto: "2018-09-20",
                // valorPrimeiroDesconto: 1,
                // dataSegundoDesconto: "2018-09-20",
                // valorSegundoDesconto: 0,
                // dataTerceiroDesconto: "2018-09-20",
                // valorTerceiroDesconto: 0,
                tipoMulta: 2,
                dataMulta: helpersBancosUtilsData.proximo_dia_yyyy_mm_dd(item?.payVencimento),
                valorMulta: 2,
                tipoJurosMora: 1,
                dataJurosMora: helpersBancosUtilsData.proximo_dia_yyyy_mm_dd(item?.payVencimento),
                valorJurosMora: Number(jurosMora),
                numeroParcela: Number(item?.payNumeroParcela),
                // aceite: true,
                codigoNegativacao: 2,
                numeroDiasNegativacao: 7,
                // codigoProtesto: 3,
                // numeroDiasProtesto: 1,
                pagador: {
                    numeroCpfCnpj: item?.payLocatarioCpf,
                    nome: utilsFormatar.abreviarNome(item?.payLocatario, 50),
                    endereco: item?.address?.street,
                    bairro: item?.address?.neighborhood,
                    cidade: item?.address?.city,
                    cep: item?.address?.zip_code,
                    uf: item?.address?.state,
                    email: item?.payLocatarioEmail,
                },
                // beneficiarioFinal: {
                //     numeroCpfCnpj: "98784978699",
                //     nome: "Lucas de Lima"
                // },
                mensagensInstrucao: [
                    `A partir ${helpersBancosUtilsData.proximo_dia_dd_mm_yyyy(item?.payVencimento)} juros 0,03% ao dia.`,
                    `A partir ${helpersBancosUtilsData.proximo_dia_dd_mm_yyyy(item?.payVencimento)} multa de 2%`,
                    `Não conceder desconto.`,
                    `Negativar no 7º dia após venc.`,
                ],
                gerarPdf: false,
                // rateioCreditos: [
                //     {
                //         numeroBanco: 756,
                //         numeroAgencia: 4027,
                //         numeroContaCorrente: 0,
                //         contaPrincipal: true,
                //         codigoTipoValorRateio: 1,
                //         valorRateio: 100,
                //         codigoTipoCalculoRateio: 1,
                //         numeroCpfCnpjTitular: "98765432185",
                //         nomeTitular: "Marcelo dos Santos",
                //         codigoFinalidadeTed: 10,
                //         codigoTipoContaDestinoTed: "CC",
                //         quantidadeDiasFloat: 1,
                //         dataFloatCredito: "2020-12-30"
                //     }
                // ],
                codigoCadastrarPIX: 0,
                // numeroContratoCobranca: 1,
            });

            try {
                let config = {
                    method: "post",
                    maxBodyLength: Infinity,
                    url: `${BASE_URL_CADASTRAR_BOLETOS}/cobranca-bancaria/v3/boletos`,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.tokenSicoob}`,
                        Accept: "application/json",
                        client_id: `${CLIENT_ID_SICOOB}`,
                    },
                    data: raw,
                    httpsAgent: agent,
                };

                const response = await axios.request(config);

                // return
                if (response?.status !== 200) {
                    return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao cadastrar boletos na Sicoob"});
                }

                this.responsePostBoletosIncluirBoletos = response?.data?.resultado;

                sqlForUpdate.push(
                    new Object({
                        id: item?.id,
                        payStatus: 504,
                        payCnabSeuNumero: this.responsePostBoletosIncluirBoletos?.seuNumero,
                        payCnabNossoNumero: this.responsePostBoletosIncluirBoletos?.nossoNumero,
                    })
                );

                await onda_financeiro_boletos.post({data:this.responsePostBoletosIncluirBoletos, codPagamento:item?.payCod})

            } catch (error) {
                // console.error(error?.response?.data, "error");
                await onda_followup.postFollowup({token: this.token, cod: item?.payCod, event: JSON.stringify(error?.response?.data?.mensagens?.[0]?.mensagem)})
                return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao cadastrar boletos"});
            }
            // Aguarda 1/2 segundo antes de continuar para o próximo item
            await delay(500);
        }

        await servicesFinanceiroQuery.verificaSeERemessaDeCriacaoEAtualizaPagamentosSelecionados({
            config: this.acao?.id,
            bancoID: this.banco.idBanco,
            dataBody: {devedor: sqlForUpdate},
            token: this.token,
        });

        return;
    }
};

export default helpersBancosSicoob;
