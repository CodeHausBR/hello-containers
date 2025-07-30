//BIBLIOTECAS

//HELPERS
import getToken from "../../../helpers/token/get-token.js";
import httpRequestProvider from "../../../helpers/response/http-request-provider.js";
import pdfCobranca from "../../../helpers/pdf/pdf-cobranca.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import onda_pay from "../../models/analise/onda_pay.js";
import onda_sinistro from "../../models/juridico/onda_sinistro.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
import onda_sinistro_cobranca from "../../models/juridico/onda_sinistro_cobranca.js";
import onda_sinistro_item from "../../models/juridico/onda_sinistro_item.js";
//SERVICES
import servicesCobrancaQuery from "../../services/cobranca/query/servicesCobrancaQuery.js";
import servicesCobrancaValidate from "../../services/cobranca/validate/servicesCobrancaValidate.js";
import servicesJuridicoRegras from "../../services/juridico/regras/servicesJuridicoRegras.js";
import servicesJuridicoQuery from "../../services/juridico/query/servicesJuridicoQuery.js";
//UTILS
import geradorDeParcelas from "../../utils/gerador/parcelas.js";
import onda_followup from "../../models/public/onda_followup.js";
import webSocketClient from "../../../helpers/response/web-socket-client.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import {extrairCodigosCobranca} from "../../utils/datas/extract-cod.js";
import onda_cobranca from "../../models/cobranca/onda_cobranca.js";
import helpersControllerAsaas from "../../../helpers/bancos/asaas/controller/helpersControllerAsaas.js";

const controllerCobranca = class controllerCobranca {
    // função disfuncional
    static async status(req, res) {
        try {
            const arrayStatus = await servicesCobrancaQuery.buscarArrayStatusCobranca_query();

            const dadosValidados = await servicesCobrancaValidate.atualizarStatusCobranca_validate(req?.params, arrayStatus);
            // função disfuncional
            await servicesCobrancaQuery.atualizarStatusCobranca_query(dadosValidados);
            return setResponse.SUCCESS({message: "Status cobrança com sucesso!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarCobrancaAgrupadoPorMatrix(req, res) {
        try {
            // const {limit = 100, offset = 0, search = ''} = req.query;

            // const searchPattern = `%${search}%`;

            const sinistroCobranca = await onda_sinistro_cobranca
                .buscarTodasAsCobrancasAgrupadasMatrix
                // { limit: limit, offset: offset }
                ();

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar cobranças!",
                results: sinistroCobranca,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarCobrancaSinistroPeloContrato(req, res) {
        try {
            const cod = req?.params?.cod;

            // const sinistro = await onda_sinistro.getOneAgrupandoPeloContrato({codContrato: cod});

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            const [cobrancasPorContratro, totalRecebido, totalDevido] = await Promise.all([
                // onda_sinistro.buscarSinistroPeloContrato({codContrato: sinistro?.sinistroContrato}),
                onda_sinistro_cobranca.getOneCobrancaAgrupadaPeloContratoNotResView({
                    codContrato: cod,
                }),
                onda_pay.buscarOqueFoiRecebidoDosSinistrosPeloContrato({
                    codContrato: cod,
                }),
                onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                    cartaFianca: cartaFianca,
                }),
            ]);

            const response = {
                valoresCobranca: {
                    porcentagemRecebida: (Number(totalRecebido?.totalRecebidoCobrancaSinistro) / Number(totalDevido?.grupos?.totalAprovado)) * Number(100),
                    recebido: Number(totalRecebido?.totalRecebidoCobrancaSinistro),
                    devido: Number(totalDevido?.grupos?.totalAprovado) + Number(totalDevido?.grupos?.totalPendente),
                    saldoDevedor: Number(totalDevido?.grupos?.totalAprovado) + Number(totalDevido?.grupos?.totalPendente) - Number(totalRecebido?.totalRecebidoCobrancaSinistro),
                },
                cobrancasPorContratro: cobrancasPorContratro,
                cartaFianca: cartaFianca,
            };

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar sinistros pelo contrato!",
                results: response,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarItensSisnitro(req, res) {
        try {
            const cod = req?.params?.cod;

            const itensSinistro = await onda_sinistro_item.getOneNotResByMatrixView({
                codSinistro: cod,
            });

            const results = {
                itensSinistro: itensSinistro,
            };

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar sinistros pelo contrato!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarCobranca(req, res) {
        try {
            const {cobranca, token} = req?.body;

            // START -  MODIFICAÇÃO TEMPORÁRIA

            // if (cobranca.sinistroCobrancaStatusId == 1105) {
            //     await onda_sinistro_cobranca.verificaSePossivelResponsavelCobrancaEhSetorCobranca({
            //         dadosBody: cobranca,
            //     });
            // }

            if (cobranca.sinistroCobrancaStatusId == 1102) {
                return setResponse.WARNING({message: "Setor cobrança não tem autorização!"});
            }

            if (cobranca.sinistroCobrancaStatusId == 1104) {
                const cod = cobranca.sinistroCobrancaMatrix;
                const oldSinistro = await onda_sinistro.getOneNotResByCodView({
                    cod: cod,
                });
                servicesJuridicoRegras.verificarSeSinistroJaFoiCancelado({
                    sinistro: oldSinistro,
                });
                const contasAPagar = await servicesJuridicoQuery.buscaStatusDaContaAPagarPeloSinistro({sinistro: oldSinistro});
                const oldCobranca = await servicesJuridicoQuery.buscaStatusDaCobrancaPeloSinistro({sinistro: oldSinistro});
                await servicesJuridicoRegras.verificarOsStatusDeContaAPagarECobrancaParaDefinirStatus({contasAPagar: contasAPagar, cobranca: oldCobranca});
                await servicesJuridicoQuery.atualizarStatusCanceladoSinistroPelaCobranca({
                    dadosBody: oldSinistro,
                    codStatusCancelado: "614",
                });
                await onda_followup.postFollowup({
                    token: token,
                    cod: cod,
                    event: `Sinistro Cancelado pelo usuário ${token.nome} com o ID ${token.id} ,devido ao pagamento da Cobrança na imobiliária`,
                });
                const newSinistro = await onda_sinistro.getOneNotResByCodView({
                    cod: cod,
                });
                const ws = new webSocketClient();
                ws.enviarParaEspecificos({
                    ws: {
                        setor: "sinistro",
                        fonte: "portal",
                        follow: {on: true, message: "Sinistro cancelado no Wave pela Cobrança!"},
                        event: "update",
                        item: newSinistro,
                    },
                });
            }
            // FINISH -  MODIFICAÇÃO TEMPORÁRIA

            const sinistroCobranca = await onda_sinistro_cobranca.put({
                dadosBody: cobranca,
                res: res,
            });

            const {sinistroCobrancaCod} = sinistroCobranca;

            await onda_followup.postFollowup({
                cod: sinistroCobrancaCod,
                token,
                event: `Cobrança atualizada para o status ${sinistroCobranca.sinistroCobrancaStatusDesc} pelo usuário ${token.nome} com o ID ${token.id} com sucesso`,
            });

            // const newCobranca = await onda_sinistro.getOneNotResByCodView({cod: cod});

            // await servicesCobrancaValidate.atualizarCobrancaAtos({cobranca: newCobranca});

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar cobrança!",
                results: sinistroCobranca,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async gerarDocumentoQuitacaoDebito(req, res) {
        try {
            const {token} = req?.body;
            const {
                data: {codContrato, valorQuitacao},
            } = await servicesCobrancaValidate.quitacaoDivida(req?.body);

            const sk_token = await getToken(req, res);

            const cartaFianca = await onda_cartafianca.getOneNotResViewNotFormat(codContrato);

            const htmlPdf = pdfCobranca.quitacaoDebito({
                cartaFianca: cartaFianca,
                valorQuitacao: valorQuitacao,
            });

            const [formData, buffer] = await pdfCobranca.gerarPdf(htmlPdf, "Termo de quitação", 37);

            await httpRequestProvider.salvarDocBucket(sk_token, formData, `OSC-${codContrato}`);

            //TODO: VERIFICAR SE O CÓDIGO ESTA CORRETO
            await onda_followup.postFollowup({
                token: token,
                cod: `OSC-${codContrato}`,
                event: "*Termo de quitação gerado com Sucesso!",
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao gerar documento de quitação!",
                results: [],
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async gerarDocumentoConfissaoDeDivida(req, res) {
        try {
            const {token} = req?.body;
            const {
                data: {codContrato, negociacao, sinistros},
            } = await servicesCobrancaValidate.confissaoDivida(req?.body);

            const sk_token = await getToken(req, res);

            const parcelamento = geradorDeParcelas.gerarParcelasComJuros({
                valorTotal: negociacao?.valorTotal,
                parcelas: negociacao?.parcelas,
                vencimento: negociacao?.vencimento,
                juros: negociacao?.juros,
            });

            const cartaFianca = await onda_cartafianca.getOneNotResViewNotFormat(codContrato);

            const itensSinistros = await onda_sinistro_item.getAllItensByMatrixArray({
                sinistros: sinistros,
            });

            const htmlPdf = pdfCobranca.confissaoDivida({
                cartaFianca: cartaFianca,
                negociacao: parcelamento,
                sinistros: sinistros,
                itensSinistro: itensSinistros,
            });

            const [formData, buffer] = await pdfCobranca.gerarPdf(htmlPdf, "Termo de confissão de dívida", 36);

            await httpRequestProvider.salvarDocBucket(sk_token, formData, `OSC-${codContrato}`);

            //TODO: VERIFICAR SE O CÓDIGO ESTA CORRETO
            await onda_followup.postFollowup({
                token: token,
                cod: `OSC-${codContrato}`,
                event: "*Termo de Confissão gerado com Sucesso!",
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao gerar documento de confissão de dívida!",
                results: [],
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarColaboradorResposavelCobranca(req, res) {
        try {
            const {cobranca, token} = req?.body;

            await onda_sinistro_cobranca.verificaSePossivelResponsavelCobrancaEhSetorCobranca({
                dadosBody: cobranca,
            });

            await onda_sinistro_cobranca.verificarSeExistePeloIdContrato(cobranca?.id_contrato);

            await onda_sinistro_cobranca.atualizarColaboradorResposavel({
                dadosBody: cobranca,
            });

            const response = await onda_sinistro.buscarCobrancaPorIdContrato(cobranca.id_contrato);

            const {sinistroCobrancaCod} = cobranca;

            await onda_followup.postFollowup({
                cod: sinistroCobrancaCod,
                token,
                event: "🤖Colaborar Responsável Cadastrado com Sucesso! 🆗",
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar o responsável pela cobrança",
                results: [response],
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async avisaRemoverCobrancaNoAsaas(req, res) {
        try {
            const {cobranca} = req.body;
            const cod = cobranca.sinistroCobrancaPagamentoConjunto;
            const codigosCobranca = extrairCodigosCobranca(cod);
            const cobrancaItem = await onda_pay.getCobrancaConjuntaCod([cod]);
            const warningResponse = await helpersControllerAsaas.buscarUmaCobrancaPeloId({id: cobrancaItem[0].onda_pay_assas_payment_id, res: res});

            if (warningResponse) {
                return warningResponse;
            }

            await onda_cobranca.removerConteudoCobrancaItemPagamentoConjunto(codigosCobranca);

            return setResponse.SUCCESS({
                message: "Sucesso ao remover cobrança conjunta",
                results: [],
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerCobranca;
