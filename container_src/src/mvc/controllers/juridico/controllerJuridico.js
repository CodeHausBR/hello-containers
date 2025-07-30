//BIBLIOTECAS

//HELPERS
import getToken from "../../../helpers/token/get-token.js";
import httpRequestProvider from "../../../helpers/response/http-request-provider.js";
import setResponse from "../../../helpers/response/setResponse.js";
import pdfGenerate from "../../../helpers/pdf/pdf-generate.js";
import pdfSinistro from "../../../helpers/pdf/pdf-sinistro.js";
//import apiAtosCobranca from "../../../helpers/api/atosCobranca/api-atos-cobranca.js";

//BANCO DE DADOS
import onda_sinistro_item from "../../models/juridico/onda_sinistro_item.js";
import onda_sinistro_cobranca from "../../models/juridico/onda_sinistro_cobranca.js";
import onda_followup from "../../models/public/onda_followup.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
import onda_sinistro from "../../models/juridico/onda_sinistro.js";
import onda_status from "../../models/public/onda_status.js";
import onda_docs from "../../models/public/onda_docs.js";
import onda_imobiliaria_config from "../../models/imobiliaria/onda_imobiliaria_config.js";
import onda_errors from "../../models/public/onda_errors.js";
//SERVICES
import servicesJuridicoEmail from "../../services/juridico/email/servicesJuridicoEmail.js";
import servicesAnaliseQuery from "../../services/analise/query/servicesAnaliseQuery.js";
import servicesJuridicoQuery from "../../services/juridico/query/servicesJuridicoQuery.js";
import servicesJuridicoValidate from "../../services/juridico/validate/servicesJuridicoValidate.js";
import servicesJuridicoRegras from "../../services/juridico/regras/servicesJuridicoRegras.js";

//WEBSOCKET
import webSocketClient from "../../../helpers/response/web-socket-client.js";

//MONGOOSE
import VW_CARTAFIANCA_GERAL from "../../models/mongoose/VW_CARTAFIANCA_GERAL.js";
import onda_colaborador from "../../models/users/onda_colaborador.js";
import onda_user from "../../models/users/onda_user.js";
import onda_imob from "../../models/users/onda_imob.js";
import onda_juridico from "../../models/juridico/onda_juridico.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";

const controllerJuridico = class controllerJuridico {
    static async updateStatusSinistro(req, res) {
        try {
            const arrayStatusSinistro = await onda_status.getArrayStatusSinistro();

            const dadosValidados = await servicesJuridicoValidate.atualizarStatusSinistro_validate(req?.params, arrayStatusSinistro);

            const sinistroAtualizado = await onda_sinistro.atualizarStatusSinistro(dadosValidados);

            return setResponse.SUCCESS({
                message: "Status sinistro atualizado com sucesso!",
                res: res,
                results: sinistroAtualizado,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async updateStatusCobranca(req, res) {
        try {
            const arrayStatusCobranca = await onda_status.getArrayStatusCobranca();

            const dadosValidados = await servicesJuridicoValidate.atualizarStatusSinistro_validate(req?.params, arrayStatusCobranca);

            const cobrancaAtualizada = await onda_sinistro.atualizarStatusCobranca(dadosValidados);

            return setResponse.SUCCESS({
                message: "Status cobrança atualizado com sucesso!",
                res: res,
                results: cobrancaAtualizada,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async juridico(req, res) {
        try {
            const results = await onda_sinistro.getAllNotResView();
            return setResponse.SUCCESS({ results: results });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarSinistroPeloContrato(req, res) {
        try {
            const cod = req?.params?.cod;

            const results = await onda_sinistro.buscarSinistroPeloContrato({
                codContrato: cod,
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar sinistros pelo contrato!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarJuridicoCod(req, res) {
        try {
            const codigo = req?.params?.cod;

            const sinistro = await onda_sinistro.getOneNotResByCodView({
                cod: codigo,
            });

            const cartaFianca = await onda_cartafianca.getOneNotResView(sinistro?.sinistroContrato);

            const [gruposSinistro, itensSinistro] = await Promise.all([
                onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                    cartaFianca: cartaFianca,
                }),
                onda_sinistro_item.getOneNotResByMatrixView({ codSinistro: codigo }),
            ]);

            const pendencias = await verificadorDePendenciasSinistro({ ...sinistro, codSinistro: codigo }, req?.token);

            const results = {
                pendencias: pendencias?.itens,
                grupos: gruposSinistro?.grupos,
                itensSinistro: itensSinistro,
                sinistro: sinistro,
                cartaFianca: gruposSinistro?.cartaFianca,
            };

            return setResponse.SUCCESS({ results: results, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarSinistro(req, res) {
        try {
            const { sinistro, itensSinistro, token } = req?.body;

            const sinistroVerificado = sinistro;
            const id = token.onda_imob_id;
            await onda_imob.verificarSeAImobiliariaEstaNaBlackList(id);

            servicesJuridicoRegras.validarSeFoiPassadoOsItensDoSinistro({
                itensSinistro: itensSinistro,
            });

            const cartaFianca = await onda_cartafianca.getOneNotResView(sinistroVerificado?.contrato);
            await servicesJuridicoRegras.verificarValidadeSinistro({ contrato: cartaFianca });
            await servicesJuridicoRegras.verificaContratoEncerrado({ contrato: cartaFianca, tipoSinistro: sinistro?.tipoSinistroId });
            await servicesJuridicoRegras.verificaContratoExonerados({ contrato: cartaFianca, tipoSinistro: sinistro?.tipoSinistroId });
            const newSinistro = await onda_sinistro.postSinistro({
                dadosBody: sinistroVerificado,
                cartaFianca: cartaFianca,
                token: token,
            });

            const ws = new webSocketClient();
            // ---- Linhas comentadas pois não enviaremos mais cobrança para ATOS no ato da abertura do sinistro e sim quando o colaborador da cobrança desejar
            // const cartaFianca = await onda_cartafianca.getOneNotResView(newSinistro?.sinistroContrato);

            await onda_sinistro_cobranca.post({ sinistro: newSinistro, token: token });

            const newItensSinistro = await onda_sinistro_item.postSinistroItem({
                dadosBody: itensSinistro,
                token: token,
                cod: newSinistro?.sinistroCodigo,
            });

            // const gruposSinistro = await onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({cartaFianca: cartaFianca, codSinistro: newSinistro?.sinistroCodigo});

            // const newCobranca = await servicesJuridicoQuery.cadastrarCobrancaApiAtos({
            //     cartaFianca: cartaFianca,
            //     gruposSinistro: gruposSinistro,
            //     cobranca: cobranca,
            //     itensSinistro: newItensSinistro,
            //     sinistro: sinistro,
            // });

            // await apiAtosCobranca.postCobranca({dadosDevedor: newCobranca, token: token, codCobranca: cobranca?.sinistroCobrancaCod, codSinistro: newSinistro?.sinistroCodigo});

            // Cadastra uma cobrança sempre que um sinistro é aberto!
            const results = {
                sinistro: newSinistro,
                itensSinistro: newItensSinistro,
            };

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    follow: { on: true, message: "Novo sinistro cadastrado!" },
                    event: "new",
                    item: newSinistro,
                },
            });

            if (cartaFianca.statusInadimplente == 1) {
                await onda_followup.postFollowup({
                    token: token,
                    cod: newSinistro?.sinistroCodigo,
                    event: "* Cadastro de sinistro com contrato inadimplente.",
                });
            }

            return setResponse.SUCCESS({
                message: "Sucesso ao cadastrar sinistro!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarSinistro(req, res) {
        try {
            const ws = new webSocketClient();
            const { sinistro, itensSinistro, token } = req?.body;

            //VERIFICAR SE O CONTRATO É MESMO DA IMOBILIÁRIA QUE ESTÁ ENVIANDO PELO TOKEN

            const newSinistro = await onda_sinistro.putSinistro({
                dadosBody: sinistro,
                token: token,
            });

            const cartaFianca = await onda_cartafianca.getOneNotResView(newSinistro?.sinistroContrato);

            const gruposSinistroAntigo = await onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                cartaFianca: cartaFianca,
            });

            const itensSinistroAtualizado = await servicesJuridicoRegras.validarSeTemLimiteDisponivelNosGrupos({
                gruposSinistro: gruposSinistroAntigo?.grupos,
                itensSinistro: itensSinistro,
            });

            const newItensSinistro = await onda_sinistro_item.putSinistroItem({
                dadosBody: itensSinistroAtualizado,
                token: token,
                cod: sinistro?.codSinistro,
            });

            const gruposSinistroNovo = await onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                cartaFianca: cartaFianca,
            });

            // const [arquivosPendentes, qtddItensPendente] = await Promise.all([
            //   onda_docs.verificarSeExistemArquivosPendentes({
            //     matrix: sinistro?.codSinistro,
            //   }),
            //   onda_sinistro_item.quantidadeItensPendenteAnalise({
            //     codSinistro: sinistro?.codSinistro,
            //   }),
            // ]);
            const pendencias = await verificadorDePendenciasSinistro(sinistro, token);

            const results = {
                pendencias: pendencias?.itens,
                grupos: gruposSinistroNovo?.grupos,
                itensSinistro: newItensSinistro,
                sinistro: newSinistro,
                cartaFianca: gruposSinistroNovo?.cartaFianca,
            };

            // await onda_sinistro.putSinistro({
            //   dadosBody: {
            //     ...sinistro,
            //     sinistroPendencias: pendencias.documentos + pendencias.itens,
            //   },
            //   token: token,
            //   cod: sinistro?.codSinistro,
            // });

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    follow: { on: true, message: "Nova atualização no sinistro!" },
                    event: "update",
                    item: newSinistro,
                },
            });

            await onda_followup.postFollowup({
                token: token,
                cod: sinistro?.codSinistro,
                event: "*Sinistro atualizado com sucesso!",
            });
            // await onda_followup.postFollowup({
            //     token: token,
            //     cod: `TLI-${sinistro?.codSinistro}`,
            //     event: "Sinistro atualizado",
            // });
            return setResponse.SUCCESS({
                message: "Sucesso ao cadastrar sinistro!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async exonerarCartaFianca(req, res) {
        try {
            const { token } = req?.body;
            const { cod, email } = req?.params;

            const sk_token = await getToken(req, res);

            const [anexo1, simulacao, exoneracao] = await servicesAnaliseQuery.buscarAnexo1_query(cod);

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            const pageHtml = await pdfGenerate.gerarEstornoAnexo1({
                cartaFianca: cartaFianca,
            });

            const [formData, pdfBuffer] = await pdfGenerate.gerarPdf(pageHtml, "Exoneração", 1000);

            await Promise.all([
                httpRequestProvider.salvarDocBucket(sk_token, formData, cod),
                httpRequestProvider.deletarDocBucket(sk_token, exoneracao),
                servicesJuridicoEmail.enviarEmailExoneracaoCf(cartaFianca, pdfBuffer, email, token),
                servicesJuridicoQuery.atualizarStatusComercialCf({
                    cartaFianca: cartaFianca,
                    token: token,
                }),
            ]);

            await onda_followup.postFollowup({
                token: token,
                cod: cod,
                event: "*Exoneração do contrato gerada com sucesso!",
            });
            await onda_followup.postFollowup({
                token: token,
                cod: `TLI-${cod}`,
                event: "🤖 *Exoneração do contrato gerada 🆗",
            });

            const cfAtualizada = await onda_cartafianca.getOneNotResView(cod);

            await VW_CARTAFIANCA_GERAL.post(cfAtualizada);

            return setResponse.SUCCESS({
                message: "Sucesso ao exonerar anexo 1!",
                results: cfAtualizada,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async abrirSinistroParaAnalisarNoPrazo7Dias(req, res) {
        try {
            const dadosBody = req?.body;
            const token = await getToken(req, res);
            const dadosValidados = await servicesJuridicoValidate.validarCodSinistro({
                dadosBody: dadosBody,
            });
            const cod = dadosValidados?.sinistro?.codSinistro;

            const ws = new webSocketClient();

            const oldSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: cod,
            });

            servicesJuridicoRegras.verificaSeOStatusJaEstaComoAnaliseSinistro7Dias({
                oldSinistro: oldSinistro,
            });

            const arquivosPendentes = await onda_docs.verificarSeExistemArquivosPendentes({ matrix: cod });

            servicesJuridicoRegras.verificarSeExistemArquivosPendentesSolicitadosEParaAnalise({ arquivosPendentes: arquivosPendentes });

            const cartaFianca = await onda_cartafianca.getOneNotResView(oldSinistro?.sinistroContrato);

            await servicesJuridicoQuery.atualizarStatusParaAnaliseSinistro7Dias({
                sinistro: oldSinistro,
            });

            const [valoresSinistro, itensSinistro, newSinistro, qtddItensPendente] = await Promise.all([
                onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                    cartaFianca: cartaFianca,
                }),
                onda_sinistro_item.getOneNotResByMatrixView({ codSinistro: cod }),
                onda_sinistro.getOneNotResByCodView({ cod: cod }),

                onda_sinistro_item.quantidadeItensPendenteAnalise({
                    codSinistro: cod,
                }),
                onda_followup.postFollowup({
                    token: token,
                    cod: cod,
                    event: "*Sinistro inicializado com sucesso!",
                }),
                // onda_followup.postFollowup({
                //     token: token,
                //     cod: `TLI-${cod}`,
                //     event: "🤖 *Sinistro inicializado 🆗",
                // }),
            ]);

            await onda_followup.postFollowup({
                token: token,
                cod: cod,
                event: "*Inicio análise 15 dias do sinistro!",
            });
            await onda_followup.postFollowup({
                token: token,
                cod: `TLI-${cod}`,
                event: "🤖 *Início da contagem de prazo para análise ℹ️",
            });

            const results = {
                pendencias: {
                    documentos: arquivosPendentes?.docsPendentes,
                    itens: qtddItensPendente?.quantidadePendenteAnalise,
                },
                grupos: valoresSinistro?.grupos,
                itensSinistro: itensSinistro,
                sinistro: newSinistro,
                cartaFianca: cartaFianca,
            };

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    follow: { on: true, message: "Sinistro em análise!" },
                    event: "update",
                    item: newSinistro,
                },
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao inciar análise de 15 dias!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async enviarParaAceiteNoPortal(req, res) {
        try {
            const dadosBody = req?.body;

            const token = await getToken(req, res);
            const dadosValidados = await servicesJuridicoValidate.validarCodSinistro({
                dadosBody: dadosBody,
            });
            const cod = dadosValidados?.sinistro?.codSinistro;

            const ws = new webSocketClient();

            const sinistro = await onda_sinistro.getOneNotResByCodView({ cod: cod });

            servicesJuridicoRegras.valirdarSeOSinistroJaFoiAbertoParaAnalise({
                sinistro: sinistro,
            });

            servicesJuridicoRegras.verificarSeSinistroFoiEnviadoParaAceite({
                sinistro: sinistro,
            });

            const cartaFianca = await onda_cartafianca.getOneNotResView(sinistro?.sinistroContrato);

            const itensSinistro = await onda_sinistro_item.getOneNotResByMatrixView({
                codSinistro: cod,
            });

            servicesJuridicoRegras.validarSeNaoTemItensComStatusAguardando({
                itensSinistro: itensSinistro,
            });

            const arquivosPendentes = await onda_docs.verificarSeExistemArquivosPendentes({ matrix: cod });

            servicesJuridicoRegras.verificarSeExistemArquivosPendentesSolicitadosEParaAnalise({ arquivosPendentes: arquivosPendentes });

            const [valoresSinistro, qtddItensPendente, contaBancaria] = await Promise.all([
                onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                    cartaFianca: cartaFianca,
                }),
                onda_sinistro_item.quantidadeItensPendenteAnalise({
                    codSinistro: cod,
                }),
                onda_followup.postFollowup({
                    token: token,
                    cod: cod,
                    event: "*Sinistro enviado para aceite com sucesso!",
                }),
                onda_followup.postFollowup({
                    token: token,
                    cod: `TLI-${cod}`,
                    event: "🤖 *Sinistro enviado para aceite da imobiliária ℹ️",
                }),
                //onda_contabancaria.getContaBancariaPagamentoSinistro({codImobiliaria: cartaFianca?.imobCodigo}),
            ]);

            //servicesJuridicoRegras.validarSeExisteContaBancariaParaAbrirSinistro({contaBancaria: contaBancaria});

            await servicesJuridicoQuery.atualizarStatusSinistroParaEnviadoParaAssinatura({ dadosBody: dadosValidados, token: token });

            const newSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: cod,
            });

            const totalAprovadoNosItensSinistro = await onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                cartaFianca: cartaFianca,
                codSinistro: cod,
            });

            const simuHtml = pdfSinistro.finalizarSinistro({
                sinistro: newSinistro,
                cartaFianca: cartaFianca,
                itensSinistro: itensSinistro,
                valoresSinistro: totalAprovadoNosItensSinistro, //precisa mandar o valor referente ao sinistro e não ao valor do contrato
                contaBancaria: {},
            });

            const [formData, pdfBuffer] = await pdfGenerate.gerarPdf(simuHtml, "sinistro", 35);

            await httpRequestProvider.salvarDocBucket(token, formData, cod);

            await onda_followup.postFollowup({
                token: token,
                cod: cod,
                event: "*Enviado para aceite no portal!",
            });

            const results = {
                pendencias: {
                    documentos: arquivosPendentes?.docsPendentes,
                    itens: qtddItensPendente?.quantidadePendenteAnalise,
                },
                grupos: valoresSinistro?.grupos,
                itensSinistro: itensSinistro,
                sinistro: newSinistro,
                cartaFianca: cartaFianca,
            };

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    follow: { on: true, message: "Aguardando aceite do sinistro!" },
                    event: "update",
                    item: newSinistro,
                },
            });

            // ----Era utilizado para atualizar a cobrança na ATOS ao enviar para assinatura
            // const cobranca = await onda_sinistro_cobranca.getOneCobrancaAgrupadaPelaMatrixNotResView({codSinistro: newSinistro?.sinistroCodigo})

            // const newCobranca = await servicesJuridicoQuery.atualizarCobrancaApiAtos({
            //     cartaFianca: cartaFianca,
            //     gruposSinistro: totalAprovadoNosItensSinistro,
            //     cobranca: cobranca,
            //     itensSinistro: itensSinistro,
            //     sinistro: newSinistro,
            // });

            // await apiAtosCobranca.postCobranca({dadosDevedor: newCobranca, token: token, codCobranca: cobranca?.sinistroCobrancaCod, codSinistro: newSinistro?.sinistroCodigo});

            return await setResponse.SUCCESS({
                message: "Sucesso ao enviar para aceite no portal!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async aceitarSinistroNoPortal(req, res) {
        try {
            const { codSinistro } = req?.params;
            const { sinistro, token } = req?.body;

            const dadosValidados = await servicesJuridicoValidate.validarDadosAceitarSinistroPortal({
                codSinistro: codSinistro,
                sinistro: sinistro,
            });

            const ws = new webSocketClient();

            const oldSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: codSinistro,
            });

            servicesJuridicoRegras.verificarSeSinistroJaFoiAssinadoNoPortal({
                sinistro: oldSinistro,
            });

            const cartaFianca = await onda_cartafianca.getOneNotResView(oldSinistro?.sinistroContrato);

            const totalAprovadoNosItensSinistro = await onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({
                cartaFianca: cartaFianca,
                codSinistro: codSinistro,
            });

            await servicesJuridicoQuery.atualizarStatusAceitoSinistroPortal({
                dadosBody: dadosValidados,
                valoresAprovados: totalAprovadoNosItensSinistro,
                token: token,
            });
            const configImobiliaria = await onda_imobiliaria_config.getOne({
                matrix: cartaFianca?.imobCodigo,
            });

            const newSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: codSinistro,
                configImobiliaria: configImobiliaria,
            });

            const messageWs1 = await servicesJuridicoRegras.verificaSeFoiAceitoComOnusGeraPagamentoFinanceiro({
                res: res,
                dadosValidados: dadosValidados,
                sinistro: newSinistro,
                token: token,
                valoresAprovados: totalAprovadoNosItensSinistro,
            });

            const messageWs2 = await servicesJuridicoRegras.verificaSeFoiAceitoSemOnusCancelaCobranca({
                token: token,
                dadosValidados: dadosValidados,
                valoresAprovados: totalAprovadoNosItensSinistro,
                sinistro: newSinistro,
                res: res,
            });
            const messageWs3 = await servicesJuridicoRegras.verificaSeFoiRecusado({
                token: token,
                dadosValidados: dadosValidados,
                sinistro: newSinistro,
                res: res,
            });

            const followMessage = messageWs1 || messageWs2 || messageWs3;

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    fonte: "portal",
                    follow: { on: true, message: followMessage },
                    event: "update",
                    item: newSinistro,
                },
            });

            return;
        } catch (error) {
            await onda_errors.postNotRes({
                classe: "controllerJuridico",
                statico: "aceitarSinistroNoPortal",
                message: JSON.stringify(error)?.slice(0, 4900),
            });
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cancelarSinistroNoPortal(req, res) {
        try {
            const { token } = req?.body;
            const { codSinistro } = req?.params;

            const dadosValidados = await servicesJuridicoValidate.validarDadosCancelamentoSinistroPortal({
                codSinistro: codSinistro,
            });

            const ws = new webSocketClient();

            const oldSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: dadosValidados?.codSinistro,
            });
            //Pode cancelar depois de assinado?
            // - não
            servicesJuridicoRegras.verificarSeSinistroJaFoiCancelado({
                sinistro: oldSinistro,
            });

            const contasAPagar = await servicesJuridicoQuery.buscaStatusDaContaAPagarPeloSinistro({ sinistro: oldSinistro });

            const cobranca = await servicesJuridicoQuery.buscaStatusDaCobrancaPeloSinistro({ sinistro: oldSinistro });

            await servicesJuridicoRegras.verificarOsStatusDeContaAPagarECobrancaParaDefinirStatus({ contasAPagar: contasAPagar, cobranca: cobranca });

            // await servicesJuridicoQuery.atualizarStatusCanceladoSinistroPortal({
            //   dadosBody: dadosValidados,
            // });

            await servicesJuridicoQuery.atualizarStatusCanceladoSinistroWave({
                dadosBody: oldSinistro,
                codStatusCancelado: "608",
            });

            const newSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: codSinistro,
            });

            //Verificar se existe cobrança?
            //Deletar ou alterar status da cobrança?
            const results = {
                sinistro: newSinistro,
            };

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    fonte: "portal",
                    follow: { on: true, message: "Sinistro cancelado no Portal!" },
                    event: "update",
                    item: newSinistro,
                },
            });

            await onda_followup.postFollowup({ token: token, cod: codSinistro, event: "🤖 Cobrança alterada para o status cancelado pela imobiliária! 🆗" });

            return setResponse.SUCCESS({
                message: "Cancelamento efetuado com sucesso!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cancelarSinistroNoWave(req, res) {
        try {
            const { codSinistro } = req?.params;
            const { token } = req?.body;

            const dadosValidados = await servicesJuridicoValidate.validarDadosCancelamentoSinistroPortal({
                codSinistro: codSinistro,
            });

            const ws = new webSocketClient();

            const oldSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: dadosValidados?.codSinistro,
            });

            //Pode cancelar depois de assinado?
            // - não
            servicesJuridicoRegras.verificarSeSinistroJaFoiCancelado({
                sinistro: oldSinistro,
            });

            const contasAPagar = await servicesJuridicoQuery.buscaStatusDaContaAPagarPeloSinistro({ sinistro: oldSinistro });

            const cobranca = await servicesJuridicoQuery.buscaStatusDaCobrancaPeloSinistro({ sinistro: oldSinistro });

            await servicesJuridicoRegras.verificarOsStatusDeContaAPagarECobrancaParaDefinirStatus({ contasAPagar: contasAPagar, cobranca: cobranca });

            // await servicesJuridicoQuery.atualizarStatusCanceladoSinistroWave({
            //   dadosBody: dadosValidados,
            // });

            await servicesJuridicoQuery.atualizarStatusCanceladoSinistroWave({
                dadosBody: oldSinistro,
            });

            const newSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: codSinistro,
            });

            //Verificar se existe cobrança?
            //Deletar ou alterar status da cobrança?
            const results = {
                sinistro: newSinistro,
            };

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    fonte: "portal",
                    follow: { on: true, message: "Sinistro cancelado no Portal!" },
                    event: "update",
                    item: newSinistro,
                },
            });

            await onda_followup.postFollowup({ token: token, cod: codSinistro, event: "🤖 Cobrança alterada para o status cancelado pelo wave! 🆗" });

            return setResponse.SUCCESS({
                message: "Cancelamento efetuado com sucesso!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async finalizarContestacaoSinistro(req, res) {
        try {
            const { codSinistro } = req?.params;
            const { token } = req?.body;

            const dadosValidados = await servicesJuridicoValidate.validarDadosFinalizarContestacaoSinistro({ codSinistro: codSinistro });

            const ws = new webSocketClient();

            await servicesJuridicoQuery.finalizarContestacaoSinistroWave({
                dadosBody: dadosValidados,
            });

            const newSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: codSinistro,
            });

            //Verificar se existe cobrança?
            //Deletar ou alterar status da cobrança?
            const results = {
                sinistro: newSinistro,
            };

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    follow: { on: true, message: "Contestção removida!" },
                    event: "update",
                    item: newSinistro,
                },
            });

            await onda_followup.postFollowup({
                token: token,
                cod: codSinistro,
                event: "*Contestação Finalizada com sucesso!",
            });
            await onda_followup.postFollowup({
                token: token,
                cod: `TLI-${codSinistro}`,
                event: "🤖 *Contestação Finalizada 🆗",
            });

            return setResponse.SUCCESS({
                message: "Contestação finalizada com sucesso!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async aprovarContestacaoSinistro(req, res) {
        try {
            const { codSinistro } = req?.params;

            const dadosValidados = await servicesJuridicoValidate.validarDadosFinalizarContestacaoSinistro({ codSinistro: codSinistro });

            const ws = new webSocketClient();

            await servicesJuridicoQuery.aprovarContestacaoSinistroWave({
                dadosBody: dadosValidados,
            });

            const newSinistro = await onda_sinistro.getOneNotResByCodView({
                cod: codSinistro,
            });

            //Verificar se existe cobrança?
            //Deletar ou alterar status da cobrança?
            const results = {
                sinistro: newSinistro,
            };

            ws.enviarParaEspecificos({
                ws: {
                    setor: "sinistro",
                    follow: { on: true, message: "Contestação aprovada!" },
                    event: "update",
                    item: newSinistro,
                },
            });

            return setResponse.SUCCESS({
                message: "Contestação aprovada com sucesso!",
                results: results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarResponsavelSinistro(req, res) {
        try {
            const { sinistro, token } = req?.body;
            // VERIFICA SE O SINISTRO EXISTE

            const verificaSinistro = await onda_sinistro.getOneNotResByCodView({ cod: sinistro?.cod_sinistro });

            if (!verificaSinistro) {
                setResponse.WARNING({
                    message: "Sinistro inexistente, verifique os dados fornecidos!",
                    res,
                });
            }
            const verificaColaborador = await onda_user.getOneByIdNotRes(sinistro?.id_colaborador);

            if (!verificaColaborador) {
                setResponse.WARNING({
                    message: "Colaborador não encontrado, verifique os dados fornecidos!",
                    res,
                });
            }

            const newSinistro = await onda_sinistro.atualizarResponsavelSinistro({
                userID: sinistro?.id_colaborador,
                sinistroCod: sinistro?.cod_sinistro,
            });

            await onda_followup.postFollowup({
                token: token,
                cod: newSinistro?.sinistroCodigo,
                event: "🤖 *Colaborador responsavel atualizado com sucesso!",
            });

            return setResponse.SUCCESS({
                message: "Colaborador responsavel atualizado com sucesso",
                results: newSinistro,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async BuscarSinistrosPeloFiltroDinamico(req, res) {
        try {
            const sinistro = await servicesJuridicoQuery.BuscarSinistrosPeloFiltroDinamico(req.query);

            return setResponse.SUCCESS({ message: "Sinistros buscados com sucesso.", results: sinistro, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async registrarAcordoJudicial(req, res) {
        try {
            const { token, ...body } = req?.body;
            const validateBody = await servicesJuridicoValidate.validarRegistroAcordo({ data: body });
            const referenceCode = gerarCondigoSetores("JURI");
            const imobiliaria = await servicesJuridicoRegras.validaContasRegistroAcordo({ contas: validateBody?.conta });
            for (const conta of validateBody?.conta) {
                const data = {
                    ...validateBody,
                    conta: conta.contaCod,
                    valorContaRef: conta.contaValor,
                    reference: referenceCode,
                    suspender: 0,
                    statusAcordo: 808,
                    userCriacao: token.codigo,
                    userCriacaoNome: token.nome,
                    userUpdateNome: token.nome,
                    userUpdate: token.codigo,
                    imobiliaria: imobiliaria,
                };
                await onda_juridico.registerAcordo(data);
                await servicesJuridicoQuery.updateStatusContaAcordoextrajudicial({ cod: conta.contaCod, acordo: referenceCode, status: 1407 });
                await onda_followup.postFollowup({
                    token: token,
                    cod: conta.contaCod,
                    event: ` Conta encerrada por meio de acordo extrajudicial ${referenceCode}, feito entre as partes, processado pelo usuário ${token?.nome}, com o código ${token?.codigo}.`,
                });
            }
            await onda_followup.postFollowup({
                token: token,
                cod: referenceCode,
                event: `Acordo criado com código ${referenceCode}, feito entre as partes, processado pelo usuário ${token?.nome}, com o código ${token?.codigo}, acordo contempla ${validateBody?.conta.length} contas, no total de ${validateBody?.divida}.`,
            });

            return setResponse.SUCCESS({
                message: "Acordo judicial cadastrado com sucesso.",
                results: { reference: referenceCode },
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarAcordosJudiciais(req, res) {
        try {
            const filtros = {
                dataInicial: req?.query?.dataInicial || null,
                dataFinal: req?.query?.dataFinal || null,
            };
            const acordos = await onda_juridico.getAllAcordos(filtros);
            const result = acordos?.map((item) => servicesJuridicoRegras.processandoDadosDaTabela({ data: item }));
            return setResponse.SUCCESS({
                message: "Sucesso ao buscar acordos.",
                results: { acordos: result },
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async buscarAcordosJudiciaisPeloCodigo(req, res) {
        try {
            const { cod } = await servicesJuridicoValidate.validaBuscarAcordo({ data: req?.params });
            const acordos = await onda_juridico.getAcordoByCod({ cod });
            const result = acordos?.map((item) => servicesJuridicoRegras.processandoDadosDaTabela({ data: item }));
            return setResponse.SUCCESS({
                message: "Sucesso ao buscar acordos.",
                results: { acordos: result },
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarReferenciaPeloCodigoDaConta(req, res) {
        try {
            const { cod } = await servicesJuridicoValidate.validaBuscarAcordo({ data: req?.params });
            const reference = await onda_juridico.getReferenciaByCodConta({ cod });

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar referência",
                results: reference,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarAcordoJudicial(req, res) {
        try {
            const { token, ...body } = req?.body;
            const { data, cod } = await servicesJuridicoValidate.validaUpdateAcordo({ data: body });
            const acordo = await onda_juridico.getAcordoByCod({ cod });
            await servicesJuridicoRegras.verificaAtualizacaoAcordoExtrajudicial({ acordo: acordo[0] });
            // const processData = await servicesJuridicoRegras.calculandoValorPagodeAcordo({ data });
            if ([810].includes(data?.statusAcordo)) {
                const { isValid, messages } = await servicesJuridicoRegras.verificaFinalizacaoAcordoExtrajudicial({ cod, token });
                if (!isValid) {
                    return setResponse.WARNING({
                        message: messages,
                    });
                }
            }

            await onda_juridico.updateAcordos({ cod, data, token });
            const results = await onda_juridico.getAcordoByCod({ cod });

            if ([809].includes(data?.statusAcordo)) {
                await servicesJuridicoRegras.retornarContasAcopladasAoAcordoExtrajudicial({ codAcordo: cod, token });
                await onda_followup.postFollowup({
                    token: token,
                    cod: cod,
                    event: `Conta reativada devido ao cancelamento do acordo extrajudicial efetuado pelo usuário ${token?.nome}, com o código ${token?.codigo}, do departamento ${token?.departamento}.`,
                });
            }


            await onda_followup.postFollowup({
                token: token,
                cod: cod,
                event: `Acordo atualizado, processado pelo usuário ${token?.nome}, com o código ${token?.codigo}.`,
            });


            return setResponse.SUCCESS({
                message: "Acordo judicial atualizado com sucesso.",
                results,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

// ALTERAÇÃO DESCARTADA, OPÇÃO TRIGGER DIRETO NO BANCO ADOTADA
const verificadorDePendenciasSinistro = async (sinistro, token) => {
    try {
        const [arquivosPendentes, qtddItensPendente] = await Promise.all([
            onda_docs.verificarSeExistemArquivosPendentes({
                matrix: sinistro?.codSinistro,
            }),
            onda_sinistro_item.quantidadeItensPendenteAnalise({
                codSinistro: sinistro?.codSinistro,
            }),
        ]);

        return {
            totalPendencias: arquivosPendentes?.docsPendentes + qtddItensPendente?.quantidadePendenteAnalise,
            itens: {
                documentos: arquivosPendentes?.docsPendentes,
                cobrancas: qtddItensPendente?.quantidadePendenteAnalise,
            },
        };
    } catch (error) {
        return setResponse.WARNING({ message: "Erro ao verificar pendências do sinistro!" });
    }
};

export default controllerJuridico;
