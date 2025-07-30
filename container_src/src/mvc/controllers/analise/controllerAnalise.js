//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import helpers_api_serasa from "../../../helpers/api/serasa/serasa.js";
import getToken from "../../../helpers/token/get-token.js";
// import pdfGenerate from "../../../helpers/pdf/pdf-contrato-locacao.js";
import httpRequestProvider from "../../../helpers/response/http-request-provider.js";
import apiPagarme from "../../../helpers/api/pagarme/api-pagarme.js";
import apiProcob from "../../../helpers/api/procob/api-procob.js";
import apiProcobFinanceira from "../../../helpers/api/procob/api-procob-financeira.js";
import apiProcobJuridica from "../../../helpers/api/procob/api-procob-juridica.js";
import apiCebracoFinanceira from "../../../helpers/api/cebraco/api-cebraco-financeira.js";
//UTILS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import utilsFormatar from "../../utils/formatar/formatar.js";
//MODELS
import onda_locatario from "../../models/analise/onda_locatario.js";
import onda_pay from "../../models/analise/onda_pay.js";
import onda_config_taxas from "../../models/analise/onda_config_taxas.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
import onda_contas from "../../models/financeiro/onda_contas.js";
import onda_imob from "../../models/users/onda_imob.js";
import onda_historico_analise from "../../models/analise/onda_historico_analise.js";
import onda_procob from "../../models/mongoose/onda_procob.js";
import onda_errors from "../../models/public/onda_errors.js";
import onda_followup from "../../models/public/onda_followup.js";
import onda_parametros_carta_fianca from "../../models/mongoose/onda_parametros_carta_fianca.js";
//SERVICES
import servicesAnaliseValidate from "../../services/analise/validate/servicesAnaliseValidate.js";
import servicesAnaliseQuery from "../../services/analise/query/servicesAnaliseQuery.js";
import servicesAnaliseRegras from "../../services/analise/regras/servicesAnaliseRegras.js";
import servicesAnaliseEmail from "../../services/analise/email/servicesAnaliseEmail.js";
import servicesConsultaQuery from "../../services/consulta/query/servicesConsultaQuery.js";

//WEBSOKET
import webSocketClient from "../../../helpers/response/web-socket-client.js";

//MONGOOSE
import VW_CARTAFIANCA_GERAL from "../../models/mongoose/VW_CARTAFIANCA_GERAL.js";
import utilsValidate from "../../utils/validate/utilsValidate.js";
import pdfContratoLocacao from "../../../helpers/pdf/pdf-contrato-locacao.js";
import apiLocatario from "../../../helpers/api/locatario/api-locatario.js";
import utilsGeneratePassword from "../../utils/analise/generateLocatarioPassword.js";
import onda_cartafianca_encerramento from "../../models/analise/onda_cartafianca_encerramento.js";
import encerramentoContratoDistratoModal from "../../../helpers/pdf/analise/contrato-distrato-para-assinatura-modal.js";
import encerramentoContratoEstornoModal from "../../../helpers/pdf/analise/contrato-estorno-para-assinatura-modal.js";
import servicesJuridicoQuery from "../../services/juridico/query/servicesJuridicoQuery.js";
import onda_serasa_consulta_pf from "../../models/mongoose/onda_serasa_consulta_pf.js";
import apiAnalisando from "../../../helpers/api/analisando/api-analisando.js";
import onda_cartafianca_exoneracao from "../../models/analise/onda_cartafianca_exoneracao.js";
import onda_user from "../../models/users/onda_user.js";

const controllerAnalise = class controllerAnalise {
    static async status(req, res) {
        try {
            const ws = new webSocketClient();

            const arrayStatus = await servicesAnaliseQuery.buscarArrayStatusAnalise_query();

            const dadosValidados = await servicesAnaliseValidate.atualizarStatusAnalise_validate(req?.params, arrayStatus);

            const cfDesatualizada = await onda_cartafianca.getOneNotResView(dadosValidados.cod);

            await servicesAnaliseRegras.statusAnalise(cfDesatualizada, dadosValidados.status);

            await servicesAnaliseQuery.atualizarStatusAnalise_query(dadosValidados);

            const cfAtualizada = await onda_cartafianca.getOneNotResView(dadosValidados.cod);

            ws.enviarParaEspecificos({ws: {setor: "comercial", follow: {on: false, message: "Nova cartafiança cadastrada!"}, event: "update", item: cfAtualizada}});

            setResponse.SUCCESS({message: "Status analise atualizado com sucesso!", res: res, results: cfAtualizada});

            await servicesAnaliseEmail.enviarAprovacaoLocatario(cfAtualizada, cfDesatualizada, dadosValidados.status);

            await VW_CARTAFIANCA_GERAL.post(cfAtualizada);
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    /**
     * @deprecated
     */
    static async cadastrarAnalise(req, res) {
        try {
            const ws = new webSocketClient();
            const tokenCode = await getToken(req, res);

            const {token} = req?.body;

            const {locatario, infoAnalise} = await servicesAnaliseValidate.validarDadosEnvioAnalise({dadosBody: req?.body});

            const ultimaTaxaCadastrada = await onda_config_taxas.buscarUltimaTaxaCadastrada();

            const valoresCartaFiancaStart = await servicesAnaliseRegras.calcularCartaFianca_regra(infoAnalise, ultimaTaxaCadastrada);

            infoAnalise.cartafiancaParcela = await servicesAnaliseRegras.gerarValorMinimoParcelasBoleto(valoresCartaFiancaStart, ultimaTaxaCadastrada);

            await servicesAnaliseRegras.verificarSeEmailLocatarioJaEstaVinculadoEmOutroCpf({locatario: locatario});

            await servicesAnaliseRegras.verificarSeTelefoneLocatarioJaEstaVinculadoEmOutroCpf({locatario: locatario});

            await onda_imob.verificarSeAImobiliariaEstaNaBlackList(token?.onda_imob_id || infoAnalise?.cartafiancaImobiliaria);

            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra(infoAnalise, ultimaTaxaCadastrada);

            const newCartafianca = await servicesAnaliseQuery.cadastrarCartaFiancaParaAnalise_query(infoAnalise, valoresCartaFianca, locatario, token);

            setResponse.SUCCESS({message: "Análise enviada com sucesso!", results: newCartafianca, res: res});

            await apiProcobJuridica.controller({cartaFianca: newCartafianca, token: token, bearerToken: tokenCode, statusAnalise: true});

            // //RETIRAR

            // const randomPassword = utilsGeneratePassword.gerarSenhaAleatoria(8);

            await apiLocatario.sendLoginData({locatario: locatario});

            await apiProcobJuridica.controller({cartaFianca: newCartafianca, token: token, bearerToken: tokenCode, statusAnalise: true});

            // await servicesConsultaQuery.startConsultaApiCpfCnpj(locatario, infoAnalise, token, req, newCartafianca);

            const cfAtualizada = await onda_cartafianca.getOneNotResView(newCartafianca.contrato);

            const cfProcessada = await servicesAnaliseQuery.atualizarStatusAnaliseSeRenovacao({infoAnalise: infoAnalise, cfAtualizada: cfAtualizada, token: token});

            await servicesAnaliseRegras.gerarSimulacaoAnexo1(tokenCode, newCartafianca.contrato, true, cfProcessada);

            await VW_CARTAFIANCA_GERAL.post(cfProcessada);

            //REATIVAR

            await apiPagarme.gerarLinkCadastroAnalise({cartaFianca: cfProcessada, token: token});

            ws.enviarParaEspecificos({ws: {setor: "comercial", follow: {on: false, message: "Nova cartafiança cadastrada!"}, event: "new", item: cfProcessada}});

            return;
        } catch (error) {
            await onda_errors.postNotRes({classe: "controllerAnalise", statico: "cadastrarAnalise", message: error});

            return setResponse.SERVER_ERROR(res, error);
        }
    }
    /**
     * @deprecated
     */
    static async cadastrarAnaliseGerarPlanosAnalise(req, res) {
        try {
            const {token} = req?.body;

            const bearerToken = await getToken(req, res);

            const {locatario, infoAnalise} = await servicesAnaliseValidate.validarDadosEnvioAnalise({
                dadosBody: req?.body,
            });

            const ultimaTaxaCadastrada = await onda_config_taxas.buscarUltimaTaxaCadastrada();
            const paramentroAnalise = await onda_parametros_carta_fianca.getOneIdFixedIdFixed();

            const valoresCartaFiancaStart = await servicesAnaliseRegras.calcularCartaFianca_regra_new(infoAnalise, paramentroAnalise, ultimaTaxaCadastrada);

            infoAnalise.cartafiancaParcela = await servicesAnaliseRegras.gerarValorMinimoParcelasBoleto(valoresCartaFiancaStart, paramentroAnalise);

            await servicesAnaliseRegras.verificarSeEmailLocatarioJaEstaVinculadoEmOutroCpf({locatario: locatario});

            await onda_imob.verificarSeAImobiliariaEstaNaBlackList(token?.onda_imob_id || infoAnalise?.cartafiancaImobiliaria);

            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra_new(infoAnalise, paramentroAnalise, ultimaTaxaCadastrada);

            const newCartafianca = await servicesAnaliseQuery.cadastrarCartaFiancaParaAnalise_query(infoAnalise, valoresCartaFianca, locatario, token, paramentroAnalise);

            //VERIFICAR PARA USAR SOMENTE NA SELEÇÃO DO PLANO PARA VER SE VAI IR PARA ANALISE MANUAL OU NÃO
            //await servicesAnaliseRegras.verificarSeECnpjCpfEnviarParaAnaliseManual(newCartafianca, token, paramentroAnalise);

            await apiProcobJuridica.controller({cartaFianca: newCartafianca, token: token, bearerToken: bearerToken, parametrosAnalise: paramentroAnalise});

            const analise = await apiCebracoFinanceira.controller({cartaFianca: newCartafianca, token: token, bearerToken: bearerToken, valoresCartaFianca: valoresCartaFianca});

            const cfAtualizada = await onda_cartafianca.getOneNotResView(newCartafianca.contrato);

            const cfProcessada = await servicesAnaliseQuery.atualizarStatusAnaliseSeRenovacao({infoAnalise: infoAnalise, cfAtualizada: cfAtualizada, token: token});

            await VW_CARTAFIANCA_GERAL.post(cfProcessada);

            const results = {contrato: newCartafianca?.contrato, planosLiberados: analise?.planosLiberados};

            return setResponse.SUCCESS({message: "Planos da análise gerados com sucesso!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async renovarContratoVersao2025(req, res) {
        try {
            const {token} = req?.body;

            const bearerToken = await getToken(req, res);
            const {locatario, infoAnalise, cod} = await servicesAnaliseValidate.validarDadosRenovacao({
                dadosBody: req?.body,
            });
            const contrato = await servicesAnaliseQuery.buscarContratoPelaMatrix({cod});
            await servicesAnaliseRegras.verificarPermissaoRenovacao({contrato});
            const ultimaTaxaCadastrada = await onda_config_taxas.buscarUltimaTaxaCadastrada();
            const paramentroAnalise = await onda_parametros_carta_fianca.getOneIdFixed();
            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra_new(infoAnalise, paramentroAnalise, ultimaTaxaCadastrada);
            const newCartafianca = await servicesAnaliseQuery.cadastrarCartaFiancaParaAnalise_query(infoAnalise, valoresCartaFianca, locatario, token, paramentroAnalise);
            await servicesAnaliseQuery.atualizarStatusContratoRenovacaoSolicitada({infoAnalise: infoAnalise, newCF: newCartafianca, cod: cod, token: token});

            const cobrancas = await servicesAnaliseRegras.verificarExistenciaCobrancasemAberto(cod);
            const parcelasVencidas = await servicesAnaliseRegras.verificarExistenciaParcelasCartaFiancaVencidas(cod);
            await servicesAnaliseRegras.verificarCobrancasEParcelasCartaFianca({
                cobrancas: cobrancas,
                parcelasVencidas: parcelasVencidas,
                codCartaFiancaAnterior: cod,
                codCartafiancaNova: newCartafianca?.contrato,
            });

            await onda_followup.postFollowup({
                cod: cod,
                event: `🤖 *Análise Aprovada. Renovação do contrato iniciada. Novo contrato: ${newCartafianca?.contrato} 🆗`,
            });
            await onda_followup.postFollowup({
                cod: `TLI-${cod}`,
                event: `🤖 *Análise Aprovada. Renovação do contrato iniciada. Novo contrato: ${newCartafianca?.contrato} 🆗`,
            });
            await onda_cartafianca.atualizarStatus(111, newCartafianca?.contrato);
            const cfAtualizada = await onda_cartafianca.getOneNotResView(newCartafianca.contrato);
            const cfProcessada = await servicesAnaliseQuery.atualizarStatusAnaliseSeRenovacao({infoAnalise: infoAnalise, cfAtualizada: cfAtualizada, cod: cod, token: token});
            await VW_CARTAFIANCA_GERAL.post(cfProcessada);
            return setResponse.SUCCESS({message: "Contrato renovado com sucesso!", results: newCartafianca, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarAnaliseModeloDinamicoVersao2025(req, res) {
        try {
            const {token} = req?.body;
            const bearerToken = await getToken(req, res);

            // VALIDAÇÃO DE DADOS ENVIADOS YUP
            const {locatario, infoAnalise} = await servicesAnaliseValidate.validarDadosEnvioAnalise({dadosBody: req?.body});

            const ultimaTaxaCadastrada = await onda_config_taxas.buscarUltimaTaxaCadastrada();

            //  onda_parametros_carta_fianca.getOneIdFixed() => BUSCA AS TAXAS QUE ESTÃO NO MONGO - TaxasDinamicas
            const paramentroAnalise = await onda_parametros_carta_fianca.getOneIdFixed();

            // CALCULO DE VALOR PRAZO, AVISTA COM BASE NO PLANO
            // RETIRADO DIA 21/02/2025
            //const valoresCartaFiancaStart = await servicesAnaliseRegras.calcularCartaFianca_regra_new(infoAnalise, paramentroAnalise, ultimaTaxaCadastrada);
            // APLICAÇÃO DAS REGRAS DE PARCELAMENTO - REGRAS DE NEGÓCIO
            // RETIRADO DIA 21/02/2025
            // infoAnalise.cartafiancaParcela = await servicesAnaliseRegras.gerarValorMinimoParcelasBoleto(valoresCartaFiancaStart, ultimaTaxaCadastrada);
            infoAnalise.cartafiancaParcela = 6;

            await servicesAnaliseRegras.verificarSeTelefoneLocatarioJaEstaVinculadoEmOutroCpf({locatario: locatario});

            await servicesAnaliseRegras.verificarSeEmailLocatarioJaEstaVinculadoEmOutroCpf({locatario: locatario});

            const {verificar_black_list} = paramentroAnalise?.onda_config_regras_reprovacao_automatica;

            if (verificar_black_list) {
                await onda_imob.verificarSeAImobiliariaEstaNaBlackList(token?.onda_imob_id || infoAnalise?.cartafiancaImobiliaria);
            }

            // APLICAR NOVO CALCULO COM REGRA DE PARCELAS APLICADA
            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra_new(infoAnalise, paramentroAnalise, ultimaTaxaCadastrada);

            const newCartafianca = await servicesAnaliseQuery.cadastrarCartaFiancaParaAnalise_query(
                infoAnalise,
                valoresCartaFianca,
                locatario,
                token,
                paramentroAnalise,
                bearerToken
            );

            const valores_adicionais = servicesAnaliseRegras.verificar_se_renovacao_para_adicionar_taxas_fixas({infoAnalise: infoAnalise, paramentroAnalise: paramentroAnalise});

            // ADICIONADO PARA ANALISE MANUAL PARA CNPJ
            await servicesAnaliseRegras.verificarSeECnpjCpfEnviarParaAnaliseManual(newCartafianca, token, paramentroAnalise);
            // ATÉ O MOMENTO É SOMENTE GERAÇÃO DE DADOS E CALCULO, A ANÁLISE SERÁ REALIZA AGORA

            // IRÁ REALIZAR A CONSULTA NO PROCOB E CEBRACO P/ ATT. NA CARTA FIANCA COM O RESULTADO
            await apiProcobJuridica.controller({cartaFianca: newCartafianca, token: token, bearerToken: bearerToken, parametrosAnalise: paramentroAnalise});

            //REMOVIDO START 03/02/2025

            // const analise = await helpers_api_serasa.controller({cartaFianca: newCartafianca, token: token, bearerToken: bearerToken, valoresCartaFianca: valoresCartaFianca});
            const analise = await apiAnalisando.controller({cartaFianca: newCartafianca, token: token, bearerToken: bearerToken, valoresCartaFianca: valoresCartaFianca});

            //REMOVDO PARA UTILIZAR A API DO SERASA
            //const analise = await apiCebracoFinanceira.controller({ cartaFianca: newCartafianca, token: token, bearerToken: bearerToken, valoresCartaFianca: valoresCartaFianca });
            const {consulta, target} = analise;

            await servicesAnaliseRegras.verificarSeAnaliseFinanceiroFoiFeitaEnviarParaAnaliseManual({consulta: consulta, cartaFianca: newCartafianca});

            //FIXME: RETIRAR ESSA FUNÇÃO PARA UM OBJETO VOLTADO PARA ANALISE, SERVIÇO DE COMPARAÇÃO REGRA
            const aplicarRegraAnalise = async ({target, consulta, cartafianca, valorAluguel}) => {
                const floatDivida = Number(consulta?.negativeData?.pefin?.summary?.balance || 0) + Number(consulta?.negativeData?.refin?.summary?.balance || 0);

                const onda_config_limite_de_divida_por_plano = Reflect.get(cartafianca, "planosCalculados", Array());

                const planosLiberados = [];
                let virificar_se_planos_estao_cadastrados_no_banco_dados = false;
                let verificar_se_divida_pasou_em_algum_plano = false;

                for (const plano of onda_config_limite_de_divida_por_plano) {
                    virificar_se_planos_estao_cadastrados_no_banco_dados = true;
                    const targetDivida = floatDivida;
                    let planoAprovado = true;

                    const {range_divida, range_aluguel} = plano;

                    if (range_divida.ativo) {
                        const {max, min} = range_divida;
                        planoAprovado = Number(max) - Number(targetDivida) >= 0 && Number(targetDivida) - Number(min) >= 0;
                    }

                    if (range_aluguel.ativo) {
                        const {max, min} = range_aluguel;
                        planoAprovado = Number(max) - Number(valorAluguel) >= 0 && Number(valorAluguel) - Number(min) >= 0 && planoAprovado;
                    }

                    if (planoAprovado) {
                        verificar_se_divida_pasou_em_algum_plano = true;
                        planosLiberados.push(plano);
                    }
                }

                paramentroAnalise.onda_config_planos = planosLiberados;
                await onda_parametros_carta_fianca.criar_configuracao_carta_fianca({
                    onda_config_valores_adicionais: valores_adicionais,
                    contrato: newCartafianca?.contrato,
                    onda_parametros_carta_fianca: paramentroAnalise,
                });
                if (virificar_se_planos_estao_cadastrados_no_banco_dados === false || consulta?.error === true || !consulta) {
                    await onda_followup.postFollowup({
                        cod: target?.contrato,
                        event: `🤖 *Sem planos liberados na análise financeira, não foi possivel a imobiliária prosseguir na análise ${floatDivida} ⚠️`,
                    });
                    await onda_followup.postFollowup({
                        cod: `TLI-${target?.contrato}`,
                        event: `🤖 *Sem planos liberados na análise financeira, não foi possível a imobiliária prosseguir na análise ⚠️`,
                    });

                    verificar_se_divida_pasou_em_algum_plano = false;
                }
                if (verificar_se_divida_pasou_em_algum_plano === true) {
                    const resultado = {
                        messageFront: "🤖 Locatário aprovado na análise!",
                        messageTLI: "🤖 *Locatário aprovado na análise 🆗",
                        message: "🤖 *Locatário aprovado na análise financeira 🆗",
                        status: 117, // 117	Aguardando seleção do plano no portal
                        aprovado: true,
                        planosLiberados: planosLiberados,
                    };
                    return resultado;
                } else if ((consulta?.error === true && verificar_se_divida_pasou_em_algum_plano === false) || (!consulta && verificar_se_divida_pasou_em_algum_plano === false)) {
                    await onda_followup.postFollowup({
                        cod: target?.contrato,
                        event: `🤖 *Sem planos liberados na análise financeira, não foi possivel a imobiliária prosseguir na análise ⚠️`,
                    });
                    await onda_followup.postFollowup({
                        cod: `TLI-${target?.contrato}`,
                        event: `🤖 *Sem planos liberados na análise financeira, não foi possível a imobiliária prosseguir na análise ⚠️`,
                    });

                    const resultado = {
                        messageFront: "🤖 Análise cancelada falha na consulta. Tente novamente mais tarde.",
                        messageTLI: "🤖 *Locatário não aprovado, cancelada por falha na análise financeira! ❌",
                        message: `🤖 *Locatário não aprovado, cancelada por falha na análise financeira! ❌`,
                        status: 116, // 116	cancelado pela onda
                        aprovado: false,
                        planosLiberados: planosLiberados,
                    };
                    return resultado;
                } else {
                    await onda_followup.postFollowup({
                        cod: target?.contrato,
                        event: `🤖 *Sem planos liberados na análise financeira, não foi possivel a imobiliária prosseguir na análise ⚠️`,
                    });
                    await onda_followup.postFollowup({
                        cod: `TLI-${target?.contrato}`,
                        event: `🤖 *Sem planos liberados na análise financeira, não foi possível a imobiliária prosseguir na análise ⚠️`,
                    });

                    const resultado = {
                        messageFront: "🤖 Locatário reprovado na análise!",
                        messageTLI: "🤖 *Locatário reprovado na análise ❌",
                        message: `🤖 *Locatário reprovado na análise financeira ⚠️`,
                        status: 109, // 109	reprovada
                        aprovado: false,
                        planosLiberados: planosLiberados,
                    };
                    return resultado;
                }
            };

            const finalClassificationAnalise = await aplicarRegraAnalise({
                cartafianca: valoresCartaFianca,
                consulta,
                target,
                valorAluguel: valoresCartaFianca?.cartafiancaValorAluguelTaxas,
            });

            await apiCebracoFinanceira.atualizarStatusCartaFiancaGerarFollow({pesquisado: target, resultado: finalClassificationAnalise});

            // REMOVIDO END 03/02/2025
            const cfAtualizada = await onda_cartafianca.getOneNotResView(newCartafianca.contrato);
            const cfProcessada = await servicesAnaliseQuery.atualizarStatusAnaliseSeRenovacao({infoAnalise: infoAnalise, cfAtualizada: cfAtualizada, token: token});
            await VW_CARTAFIANCA_GERAL.post(cfProcessada);
            await apiLocatario.registerLocatarioSystem({cod: locatario?.locatarioCnpjcpf});
            //REMOVIDO START 03/02/2025
            //const results = {contrato: newCartafianca?.contrato, planosLiberados: paramentroAnalise?.onda_config_planos};
            //REMOVIDO END 03/02/2025

            const results = {contrato: newCartafianca?.contrato, planosLiberados: finalClassificationAnalise?.planosLiberados};

            return setResponse.SUCCESS({message: "Planos da análise gerados com sucesso!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    /**
     * @deprecated
     */
    static async concluirEnvioDaAnaliseV2(req, res) {
        const cod = req?.params?.cod ?? null;
        try {
            const {infoAnalise, token} = req?.body;

            const tokenCode = await getToken(req, res);
            //O VALIDATE DO SEQUELIZE É BOM MAS É IMPORTANTE TER A YUP EM CADASTROS COM REGRAS IMPORTANTES

            await servicesAnaliseValidate.validarSchemaConcluirEnvioAnalise(infoAnalise, cod);

            const verifyCartaFiancaExists = await onda_cartafianca.getOneNotResView(cod);

            if (!verifyCartaFiancaExists) return setResponse.WARNING({message: "Carta fiança não encontrada!"});

            if (verifyCartaFiancaExists?.statusAnaliseCod != 117) return setResponse.WARNING({message: "Carta não está na estapa de aguardando seleção do plano!"});

            const taxas = await servicesAnaliseQuery.buscarTaxaPeloId_query(verifyCartaFiancaExists?.configTaxaId);

            const newInfoAnalise = await servicesAnaliseRegras.verificarOqueEstaSendoAtualizadoEscolhaPlano(verifyCartaFiancaExists, infoAnalise);

            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra(newInfoAnalise, taxas);

            await servicesAnaliseQuery.updateCartaFianca_query(newInfoAnalise, valoresCartaFianca, verifyCartaFiancaExists);

            await onda_cartafianca.atualizarStatus(111, cod);

            const cfCompleta = await onda_cartafianca.getOneNotResView(cod);

            setResponse.SUCCESS({message: "Análise enviada com sucesso!", res: res, results: cfCompleta});

            await VW_CARTAFIANCA_GERAL.post(cfCompleta);

            await servicesAnaliseRegras.gerarSimulacaoAnexo1(tokenCode, cfCompleta.contrato, true, cfCompleta);

            await apiPagarme.gerarLinkCadastroAnalise({cartaFianca: cfCompleta, token: token});
        } catch (error) {
            await onda_followup.postFollowup({cod: cod, event: "🤖 *Erro interno no servidor 🛑🛑🛑"});
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async concluirEnvioDaAnaliseModeloDinamicoVersao2025(req, res) {
        const {cod} = req?.params;
        try {
            const ws = new webSocketClient();
            const tokenCode = await getToken(req, res);
            const {infoAnalise, token} = req?.body;

            // ETAPA PARA DUPLA VALIDAÇÃO necessária
            await servicesAnaliseValidate.validarSchemaConcluirEnvioAnalise(infoAnalise, cod);

            const verifyCartaFiancaExists = await onda_cartafianca.getOneNotResView(cod);

            //ETAPA DE VERIFICAÇÃO DE STATUS E EXISTENCIA
            if (!verifyCartaFiancaExists) return setResponse.WARNING({message: "Carta fiança não encontrada!"});
            // if (verifyCartaFiancaExists?.statusAnaliseCod != 117) return setResponse.WARNING({message: "Carta não está na estapa de aguardando seleção do plano!"});

            // ETAPA DE RECUPERAÇÃO DOS DADOS JÁ CADASTRADOS
            const ultimaTaxaCadastrada = await onda_config_taxas.buscarUltimaTaxaCadastrada();

            const paramentroAnalise = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: verifyCartaFiancaExists.contrato});

            // ETAPAS PARA JUNTAR NOVOS DADOS COM O DADOS CADASTRADOS
            const newInfoAnalise = await servicesAnaliseRegras.verificarOqueEstaSendoAtualizadoEscolhaPlano(verifyCartaFiancaExists, infoAnalise);
            newInfoAnalise.taxas = paramentroAnalise.onda_config_valores_adicionais;

            // ETAPA PARA APLICAR REGRAS E ATT.s
            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra_new(newInfoAnalise, paramentroAnalise, ultimaTaxaCadastrada);

            await servicesAnaliseQuery.updateCartaFianca_query(newInfoAnalise, valoresCartaFianca, verifyCartaFiancaExists);
            //ADICIONAR VERIFICACAO AQUI

            const cfCompleta = await onda_cartafianca.getOneNotResView(cod);

            const [verificarSeECNPJ, verificaSeAcimaDeDezMil] = await Promise.all([
                servicesAnaliseRegras.verificarSeECnpjEnviarParaAnaliseManual(cfCompleta, token),
                servicesAnaliseRegras.verificarValorCartaFiancaParaEvitarConsultaCpfApi(cfCompleta, token),
            ]);

            const statusConclusaoAnalise = verificarSeECNPJ || verificaSeAcimaDeDezMil ? 112 : 111;

            await onda_cartafianca.atualizarStatus(statusConclusaoAnalise, cod);

            const cfCompletaFinal = await onda_cartafianca.getOneNotResView(cod);

            setResponse.SUCCESS({message: "Análise enviada com sucesso!", res: res, results: cfCompletaFinal});

            await VW_CARTAFIANCA_GERAL.post(cfCompletaFinal);

            await servicesAnaliseRegras.gerarSimulacaoAnexo1(tokenCode, cfCompletaFinal.contrato, true, cfCompletaFinal);

            await apiPagarme.gerarLinkCadastroAnalise({cartaFianca: cfCompletaFinal, token: token});

            ws.enviarParaEspecificos({ws: {setor: "comercial", follow: {on: false, message: "Nova cartafiança cadastrada!"}, event: "new", item: cfCompletaFinal}});
        } catch (error) {
            await onda_errors.postNotRes({
                classe: "controllerAnalise",
                statico: "concluirEnvioDaAnaliseModeloDinamicoVersao2025",
                message: JSON.stringify(error)?.slice(0, 4900),
            });
            await onda_followup.postFollowup({cod: cod, event: "🤖 *Erro interno no servidor 🛑🛑🛑"});
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    /**
     * @deprecated -- Foi refatorado para o COD da conta virar unico para todas as parcelas
     */
    static async atualizarAnalise(req, res) {
        try {
            const {cod} = req?.params;
            const {infoAnalise} = req?.body;

            await onda_imob.verificarSeAImobiliariaEstaNaBlackList(infoAnalise?.cartafiancaImobiliaria);

            //O VALIDATE DO SEQUELIZE É BOM MAS É IMPORTANTE TER A YUP EM CADASTROS COM REGRAS IMPORTANTES

            const verifyCartaFiancaExists = await onda_cartafianca.getOneNotResView(cod);

            if (!verifyCartaFiancaExists) {
                return setResponse.WARNING({message: "Carta fiança não encontrada!"});
            }
            const taxas = await servicesAnaliseQuery.buscarTaxaPeloId_query(verifyCartaFiancaExists?.configTaxaId);

            const newInfoAnalise = await servicesAnaliseRegras.verificarOqueEstaSendoAtualizado(verifyCartaFiancaExists, infoAnalise);

            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra(newInfoAnalise, taxas);

            const setNewInfoAnalise = await servicesAnaliseValidate.validarSeValorMinimoParcelasEstaNaFaixaPermitida(valoresCartaFianca, taxas);

            const updateCartafianca = await servicesAnaliseQuery.updateCartaFianca_query(newInfoAnalise, setNewInfoAnalise, verifyCartaFiancaExists);

            const cfCompleta = await onda_cartafianca.getOneNotResView(cod);

            await VW_CARTAFIANCA_GERAL.post(cfCompleta);

            if (updateCartafianca === 0) {
                return setResponse.WARNING({
                    message: "Sem atualizações para salvar!",
                    results: cfCompleta,
                });
            }

            return setResponse.SUCCESS({
                message: "Carta fiança atualizada com sucesso!",
                res: res,
                results: cfCompleta,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarAnaliseVersao2025(req, res) {
        try {
            const {cod} = req?.params;
            let {infoAnalise} = req?.body;

            await onda_imob.verificarSeAImobiliariaEstaNaBlackList(infoAnalise?.cartafiancaImobiliaria);

            await servicesAnaliseValidate.validarDadosPatchComercial(infoAnalise);

            //O VALIDATE DO SEQUELIZE É BOM MAS É IMPORTANTE TER A YUP EM CADASTROS COM REGRAS IMPORTANTES

            const cf = await onda_cartafianca.getOneNotResView(cod);

            const newParcelas = new servicesAnaliseRegras().travarQuanditadeDeParcelas({infoAnalise: infoAnalise, cartaFianca: cf});
            infoAnalise = newParcelas;

            new servicesAnaliseRegras({infoAnalise: infoAnalise, infoAnalise, cartaFianca: cf}).verificarSePagamentoCartaoDeCreditoTemMaisQueUmaParcela();

            if (!cf) {
                return setResponse.WARNING({message: "Carta fiança não encontrada!"});
            }

            const paramentroAnalise = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cf?.contrato});

            paramentroAnalise.onda_config_valores_adicionais = infoAnalise?.ondaConfigValoresAdicionais;

            const [_, ultimaTaxaCadastrada, taxas, newInfoAnalise] = await Promise.all([
                await onda_parametros_carta_fianca.atualizar_configuracao_carta_fianca({data: paramentroAnalise, contrato: cf?.contrato}),
                onda_config_taxas.buscarUltimaTaxaCadastrada(),
                servicesAnaliseQuery.buscarTaxaPeloId_query(cf?.configTaxaId),
                servicesAnaliseRegras.verificarOqueEstaSendoAtualizado(cf, infoAnalise),
            ]);
            newInfoAnalise.taxas = infoAnalise?.ondaConfigValoresAdicionais;

            const infoParaCalcular = {
                valoresCartaFiancaStart: {newInfoAnalise, paramentroAnalise, ultimaTaxaCadastrada},
                valoresCartaFianca: {newInfoAnalise, taxas},
            };

            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFiancaComBaseNoParametroId(infoParaCalcular, cf);

            const setNewInfoAnalise = await servicesAnaliseValidate.validarSeValorMinimoParcelasEstaNaFaixaPermitida(valoresCartaFianca, taxas);

            await servicesAnaliseQuery.updateCartaFianca_query(newInfoAnalise, setNewInfoAnalise, cf);

            const cfCompleta = await onda_cartafianca.getOneNotResView(cod);

            await VW_CARTAFIANCA_GERAL.post(cfCompleta);

            return setResponse.SUCCESS({message: "Carta fiança atualizada com sucesso!", res: res, results: cfCompleta});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async taxas(req, res) {
        try {
            const results = await onda_config_taxas.buscarUltimaTaxaCadastrada();

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async formasPagamento(req, res) {
        try {
            const results = await executarQuery(`
                SELECT * FROM onda_tipopagamento
                WHERE onda_tipopagamento_id NOT IN (1,5,3, 7)
                ORDER BY onda_tipopagamento_id DESC
            `).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao bucar formas de pagamento!"});
            });

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async estornoCartaFianca(req, res) {
        try {
            const {cod} = req?.params;
            const {token} = req?.body;

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            // VERIFICAR SE JÁ FOI ESTORNADO PARA NÃO ESTORNAR NOVAMENTO E VERIFICAR SE JÁ FOI PAGO A COMISSÃO PARA NÃO PODER ESTORNAR!
            await executarQuery(`
                UPDATE onda_contas 
                SET 
                    onda_conta_status = 1402,
                    onda_conta_extorno = 1
                WHERE onda_conta_matrix = '${cod}'
                AND onda_conta_recebedor = 200
                AND onda_conta_categoria = 152
            `).catch(() => {
                return setResponse.DATABASE_ERROR({
                    message: "Erro ao atualizar estorno da conta!",
                });
            });
            // await onda_contas.recalcularComissaoImobiliariaEstornoCf({
            //     cartaFianca: cartaFianca,
            // });

            const newCartaFianca = await onda_cartafianca.getOneNotResView(cod);

            await VW_CARTAFIANCA_GERAL.post(newCartaFianca);

            return setResponse.SUCCESS({
                message: "Sucesso ao estornar carta fiança!",
                res: res,
                results: newCartaFianca,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async gerarAnexo1(req, res) {
        try {
            const {cod, tipo, email} = await servicesAnaliseValidate.gerarAnexo1_validate(req?.params);

            const token = await getToken(req, res);

            // GERAR A SIMULAÇÃO NO ANEXO 1
            if (tipo == "simulacao") {
                await servicesAnaliseRegras.gerarSimulacaoAnexo1(token, cod);
            } else {
                // GERAR O ANEXO 1
                const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

                await servicesAnaliseRegras.verificarSeContratofoiPago(cartaFianca);

                const [anexo1, simulacao] = await servicesAnaliseQuery.buscarAnexo1_query(cod);

                // const payments = await onda_pay.getAllPagamentosCartaFianca(cartaFianca.contrato);
                const payments = await onda_pay.getAllPagamentosCartaFiancaNoGroup(cartaFianca.contrato);

                if (!payments.length === 0) {
                    return setResponse.WARNING({
                        message: "Ainda falta cadastrar os pagamentos!",
                    });
                }

                const anexo1Html = await pdfContratoLocacao.contratoLocacao(cartaFianca, payments);

                const [formData, pdfBuffer] = await pdfContratoLocacao.gerarPdf(anexo1Html, tipo, 19);

                await httpRequestProvider.salvarDocBucket(token, formData, cod);

                await httpRequestProvider.deletarDocBucket(token, anexo1);

                await onda_cartafianca
                    .metodo()
                    .update(
                        {
                            cartafiancaStatusFinanceiro: 999,
                            cartafiancaStatusComercial: 999,
                        },
                        {where: {cartafiancaId: cartaFianca.id}}
                    )
                    .catch(() => {
                        return setResponse.WARNING({
                            message: "Erro ao alterar status financeiro e comercial!",
                        });
                    });

                // await onda_contas.gerarComissaoImobiliaria({
                //     cod: cod,
                //     cartaFianca: cartaFianca,
                // });

                // await onda_contas.gerarComissaoImobiliariaRegra2025({
                //     cod: cod,
                //     cartaFianca: cartaFianca,
                // });

                await servicesAnaliseEmail.enviarAnexo1Email(cartaFianca, pdfBuffer, email);
            }

            const cartaFiancaAtualizada = await onda_cartafianca.getOneNotResView(cod);

            await VW_CARTAFIANCA_GERAL.post(cartaFiancaAtualizada);

            return setResponse.SUCCESS({
                message: `Sucesso ao gerar ${tipo}!`,
                res: res,
                results: cartaFiancaAtualizada,
            });
        } catch (error) {
            await onda_errors.postNotRes({
                classe: "controllerAnalise",
                statico: "gerarAnexo1",
                message: JSON.stringify(error)?.slice(0, 4900),
            });
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async gerarAnexoAutomacaoPagarmeUtilizadaNoWebsocket(cod, dadosBody) {
        try {
            const token =
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21lIjoiT25kYUFwcCIsImVtYWlsIjoib25kYWFwcEBvbmRhc2VndXJhLmNvbS5iciIsImlkIjo4NSwib25kYV91c2VyX2lkIjo4NSwiY29kaWdvIjoiVVNFUi01NTY1MjAzODA5Ny0yMDIzIiwidHlwZV91c2VyIjoiT05EQV9VU0VSIiwiaWF0IjoxNzI5NjQ0MDAxfQ.RaqrZRbGW2MkjVelvP1TJbbqDJKJfc_JKelWnVZwTrc";

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            // GERAR O ANEXO 1

            await servicesAnaliseRegras.verificarSeContratofoiPago(cartaFianca);

            const [anexo1, simulacao] = await servicesAnaliseQuery.buscarAnexo1_query(cod);

            const payments = await onda_pay.getAllPagamentosCartaFiancaNoGroup(cartaFianca.contrato);

            if (!payments.length === 0) {
                return setResponse.WARNING({message: "Ainda falta cadastrar os pagamentos!"});
            }

            const anexo1Html = await pdfContratoLocacao.contratoLocacao(cartaFianca, payments);

            const [formData, pdfBuffer] = await pdfContratoLocacao.gerarPdf(anexo1Html, "anexo1", 19);

            await httpRequestProvider.salvarDocBucket(token, formData, cod);

            await httpRequestProvider.deletarDocBucket(token, anexo1);

            await onda_cartafianca
                .metodo()
                .update({cartafiancaStatusFinanceiro: 999, cartafiancaStatusComercial: 999}, {where: {cartafiancaId: cartaFianca.id}})
                .then(async () => {
                    await onda_followup.postFollowup({
                        cod: cartaFianca?.contrato,
                        event: "*Sucesso ao atualizar status da carta fiança!",
                    });
                    await onda_followup.postFollowup({
                        cod: `TLI-${cartaFianca?.contrato}`,
                        event: "🤖 *Status da carta fiança atualizado ℹ️",
                    });
                })
                .catch(async (err) => {
                    await onda_followup.postFollowup({cod: cartaFianca?.contrato, event: "*Erro ao atualizar status da carta fiança!"});
                    return setResponse.WARNING({message: "Erro ao alterar status financeiro e comercial!"});
                });

            const cartaFianca_atualizada = await onda_cartafianca.getOneNotResView(cod);

            // RETIRAR EM 2026
            // await onda_contas
            //     .gerarComissaoImobiliariaRegra2025({cod: cod, cartaFianca: cartaFianca_atualizada})
            //     .then(async () => {
            //         await onda_followup.postFollowup({
            //             cod: cartaFianca?.contrato,
            //             event: "*Sucesso ao gerar comissão imobiliária!",
            //         });
            //     })
            //     .catch(async (err) => {
            //         await onda_followup.postFollowup({
            //             cod: cartaFianca?.contrato,
            //             event: "*Erro ao gerar comissão imobiliária!",
            //         });
            //     });

            await servicesAnaliseEmail
                .enviarAnexo1Email(cartaFianca_atualizada, pdfBuffer, "false")
                .then(async () => {
                    await onda_followup.postFollowup({cod: cartaFianca_atualizada?.contrato, event: "*Sucesso ao enviar e-mail para a imobiliária!"});
                })
                .catch(async () => {
                    await onda_followup.postFollowup({cod: cartaFianca_atualizada?.contrato, event: "*Erro ao enviar e-mail para a imobiliária!"});
                });

            await onda_followup.postFollowup({cod: cartaFianca_atualizada?.contrato, event: "*Sucesso ao gerar anexo1!"});
            await onda_followup.postFollowup({cod: `TLI-${cartaFianca_atualizada?.contrato}`, event: "🤖 *Anexo 1 gerado 🆗"});

            await VW_CARTAFIANCA_GERAL.post(cartaFianca_atualizada);

            return;
        } catch (error) {
            await onda_errors.postNotRes({
                classe: "controllerAnalise",
                statico: "gerarAnexoAutomacaoPagarmeUtilizadaNoWebsocket",
                message: JSON.stringify(error)?.slice(0, 4900),
            });
        }
    }

    static async motivoReprovacao(req, res) {
        try {
            const token = req?.body?.token;

            const dadosValidados = await servicesAnaliseValidate.motivoReprovacao_validate(req?.body);

            await servicesAnaliseQuery.motivoReprovacao_query(dadosValidados, token);

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarOndaPay(req, res) {
        try {
            const {token, pay} = req?.body;

            await onda_cartafianca.verifyExists(pay?.payContrato);

            await onda_pay.postNotRes(pay, token);

            const allPayments = await onda_pay.getAllByContrato(pay?.payContrato, pay?.payHelpersTipoPagamentoId);

            return setResponse.SUCCESS({
                message: "Sucesso ao cadastrar pagamento!",
                results: allPayments,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarPagamentos(req, res) {
        try {
            const {token} = req?.body;
            const {cod, tipo} = req?.params;

            const payment = await onda_pay.getAllByContrato(cod, tipo);

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar pagamentos!",
                results: payment,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarPagamentosPelaCobranca(req, res) {
        try {
            const {cod} = req?.params;

            const payment = await onda_pay.getAllByCobranca(cod);

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar pagamentos!",
                results: payment,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async deletarPagamento(req, res) {
        try {
            const {token, pay, password} = req?.body;
            const {id} = req?.params;

            if (process.env.PASSWORD_ADMIN !== password) {
                return setResponse.WARNING({message: "Acesso negado!"});
            }

            const payment = await onda_pay.verifyExists(id);

            await servicesAnaliseRegras.verificarSeAPlataformaEAsaasEBloquearDelecao(id, res);

            // await onda_pay.deletarPagamento(id, payment);
            await onda_pay.softDeletePagamento(id);

            const payments = await onda_pay.getAllByContrato(payment?.payContrato, pay?.payHelpersTipoPagamentoId);

            // const cartaFianca = await onda_cartafianca.getOneNotResView(payment?.payContrato);

            // await onda_contas.recalcularComissaoImobiliariaEstornoCf({cartaFianca: cartaFianca});

            return setResponse.SUCCESS({message: "Sucesso ao excluir pagamento!", results: payments, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    /**
     * @deprecated -- Foi refatorado para o COD da conta virar unico para todas as parcelas
     */
    static async atualizarOndaPay(req, res) {
        try {
            const {token, pay} = req?.body;
            const {cod} = req?.params;

            const payment = await onda_pay.verifyExists(cod);

            await onda_pay.patchNotRes(pay, cod, token);

            const payments = await onda_pay.getAllByContrato(payment?.payContrato, pay?.payHelpersTipoPagamentoId);

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar pagamento!",
                results: payments,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    //PARAMETROS DA ANALISE

    static async cadastrarTaxasDaCartaFianca(req, res) {
        try {
            const {data, token} = req?.body;

            if ("#ondasegura@2024" != data?.senha) {
                return setResponse.WARNING({message: "Senha inválida!"});
            }

            const ultimaTaxaCadastrada = await onda_config_taxas.buscarUltimaTaxaCadastrada();

            const consulta = await onda_config_taxas.cadastrarNovasTaxasCartaFianca({
                data: data,
            });

            const atualizacoes = onda_config_taxas.compararObjetosFormatado(ultimaTaxaCadastrada, data);

            await onda_followup.postFollowup({
                cod: "onda_config_taxas",
                event: atualizacoes,
                token: token,
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar taxas da análise!",
                results: consulta,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarParametroAnalise(req, res) {
        try {
            const {data} = req?.body;
            const parametroAlterado = data.onda_config_parametro_alterado;

            if ("#Onda2024TiMaster@@#" !== data?.onda_config_password) {
                return setResponse.WARNING({message: "Acesso negado!"});
            }

            delete data.onda_config_password;
            delete data.onda_config_parametro_alterado;

            const consulta = await onda_parametros_carta_fianca.post({data: data});

            await onda_followup.postFollowup({
                cod: "CONFIG-ANALISE",
                event: `Parâmetro ${parametroAlterado} da Análise Alterado.`,
            });
            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar paramentros análise!",
                results: consulta,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarParametroAnalise(req, res) {
        try {
            const consulta = await onda_parametros_carta_fianca.getOneIdFixed();

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar paramentros análise!",
                results: consulta,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarParametroAnaliseCartaFianca(req, res) {
        try {
            const {cod} = req?.params;

            const [cartaFianca, consulta, onda_parametros_carta_fianca_fixo, get_config_by_id] = await Promise.all([
                onda_cartafianca.getOneNotResView(cod),
                onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cod}),
                onda_parametros_carta_fianca.getOneIdFixed(),
                onda_parametros_carta_fianca.getOneById({id: "67a554b7800372924a573795"}),
            ]);

            if (consulta) {
                return setResponse.SUCCESS({message: "Sucesso ao buscar paramentros análise!", results: consulta, res: res});
            }

            const onda_config_valores_adicionais = [
                {
                    label: "Pintura",
                    ativo: false,
                    valor: 2700,
                },
                {
                    label: "Limpeza externa",
                    ativo: false,
                    valor: 300,
                },
                {
                    label: "Vistoria",
                    ativo: false,
                    valor: 0,
                },
            ];

            if (!consulta && cartaFianca?.parametrosAnaliseId == null) {
                const onda_config_planos_map = {
                    1: [
                        {
                            desconto: 100,
                            taxa_a_prazo: 9.51,
                            taxa_a_vista: 7.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            nome: "Basic",
                            descricao: "Plano Basic",
                            ativo: true,
                        },
                        {
                            desconto: 100,
                            taxa_a_prazo: 10.51,
                            taxa_a_vista: 9.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Standard",
                            descricao: "Plano Standard",
                            ativo: true,
                        },
                        {
                            desconto: 100,
                            taxa_a_prazo: 13.51,
                            taxa_a_vista: 11.0,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Premium",
                            descricao: "Plano Premium",
                            ativo: true,
                        },
                    ],
                    5: [
                        {
                            desconto: 0,
                            taxa_a_prazo: 9.51,
                            taxa_a_vista: 7.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            nome: "Basic",
                            descricao: "Plano Basic",
                            ativo: true,
                        },
                        {
                            desconto: 10,
                            taxa_a_prazo: 10.51,
                            taxa_a_vista: 9.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Standard",
                            descricao: "Plano Standard",
                            ativo: true,
                        },
                        {
                            desconto: 10,
                            taxa_a_prazo: 13.51,
                            taxa_a_vista: 11.0,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Premium",
                            descricao: "Plano Premium",
                            ativo: true,
                        },
                    ],
                    6: [
                        {
                            desconto: 0,
                            taxa_a_prazo: 9.51,
                            taxa_a_vista: 7.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            nome: "Basic",
                            descricao: "Plano Basic",
                            ativo: true,
                        },
                        {
                            desconto: 13,
                            taxa_a_prazo: 10.51,
                            taxa_a_vista: 9.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Standard",
                            descricao: "Plano Standard",
                            ativo: true,
                        },
                        {
                            desconto: 15,
                            taxa_a_prazo: 13.51,
                            taxa_a_vista: 11.0,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Premium",
                            descricao: "Plano Premium",
                            ativo: true,
                        },
                    ],
                    7: [
                        {
                            desconto: 0,
                            taxa_a_prazo: 9.51,
                            taxa_a_vista: 7.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            nome: "Basic",
                            descricao: "Plano Basic",
                            ativo: true,
                        },
                        {
                            desconto: 13,
                            taxa_a_prazo: 10.51,
                            taxa_a_vista: 9.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Standard",
                            descricao: "Plano Standard",
                            ativo: true,
                        },
                        {
                            desconto: 30,
                            taxa_a_prazo: 13.51,
                            taxa_a_vista: 11.0,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Premium",
                            descricao: "Plano Premium",
                            ativo: true,
                        },
                    ],
                    8: [
                        {
                            desconto: 0,
                            taxa_a_prazo: 9.51,
                            taxa_a_vista: 7.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            nome: "Basic",
                            descricao: "Plano Basic",
                            ativo: true,
                        },
                        {
                            desconto: 13,
                            taxa_a_prazo: 10.51,
                            taxa_a_vista: 9.5,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Standard",
                            descricao: "Plano Standard",
                            ativo: true,
                        },
                        {
                            desconto: 30,
                            taxa_a_prazo: 13.51,
                            taxa_a_vista: 11.0,
                            range_divida: {
                                max: 0,
                                min: 0,
                                ativo: true,
                            },
                            range_aluguel: {
                                max: 0,
                                min: 0,
                                ativo: false,
                            },
                            nome: "Premium",
                            descricao: "Plano Premium",
                            ativo: true,
                        },
                    ],
                };

                function gerar_campo_valores_adicionais_mongoose() {
                    return onda_config_valores_adicionais.map((item) => {
                        switch (item.label) {
                            case "Pintura":
                                return {...item, ativo: cartaFianca?.pintura_ == 1};
                            case "Limpeza externa":
                                return {...item, ativo: cartaFianca?.limpeza_ == 1};
                            case "Vistoria":
                                return {...item, ativo: cartaFianca?.vistoria_ == 1};
                            default:
                                return item;
                        }
                    });
                }

                //CADASTRAR NO MONGOOSE ESSES PLANOS
                const planos_para_cadastrar_mongoose = onda_config_planos_map?.[cartaFianca?.configTaxaId] || onda_config_planos_map?.[8];

                const new_dados_para_cadastrar_mongoose = {
                    ...onda_parametros_carta_fianca_fixo,
                    onda_config_planos: planos_para_cadastrar_mongoose,
                    onda_config_valores_adicionais: gerar_campo_valores_adicionais_mongoose(),
                };

                delete new_dados_para_cadastrar_mongoose._id;

                await onda_parametros_carta_fianca.criar_configuracao_carta_fianca({
                    contrato: cartaFianca?.contrato,
                    onda_parametros_carta_fianca: new_dados_para_cadastrar_mongoose,
                });

                const buscar_config = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cartaFianca?.contrato});

                return setResponse.SUCCESS({message: "Sucesso ao gerar parametros!", results: buscar_config, res: res});
            } else {
                if (cartaFianca?.pintura_ == 1) {
                    get_config_by_id.onda_config_valores_adicionais.push({...onda_config_valores_adicionais?.[0], ativo: true});
                }

                if (cartaFianca?.limpeza_ == 1) {
                    get_config_by_id.onda_config_valores_adicionais.push({...onda_config_valores_adicionais?.[1], ativo: true});
                }

                if (cartaFianca?.vistoria_ == 1) {
                    get_config_by_id.onda_config_valores_adicionais.push({...onda_config_valores_adicionais?.[2], ativo: true});
                }

                await onda_parametros_carta_fianca.criar_configuracao_carta_fianca({
                    contrato: cartaFianca?.contrato,
                    onda_parametros_carta_fianca: get_config_by_id,
                });

                const buscar_config = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cartaFianca?.contrato});

                return setResponse.SUCCESS({message: "Sucesso ao gerar parametros fixos!", results: buscar_config, res: res});
            }
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarParametroDeAnaliseContrato(req, res) {
        try {
            const {cod} = req?.params;
            const {token} = req?.body;

            const bearerToken = await getToken(req, res);

            const cartaFianca = await onda_cartafianca.getOneNotResView(cod);

            const parametrosAnalise = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cartaFianca?.contrato});

            const newInfoAnalise = await servicesAnaliseRegras.verificarOqueEstaSendoAtualizadoEscolhaPlano(cartaFianca, parametrosAnalise);

            const valoresCartaFianca = await servicesAnaliseRegras.calcularCartaFianca_regra_new(newInfoAnalise, parametrosAnalise);

            // const onda_config_limite_de_divida_por_plano = Reflect.get(valoresCartaFianca, "planosCalculados", Array());
            // const planosLiberados = resultadoAnaliseFinanceira?.planosLiberados.filter((item) => item?.ativo == true);
            // const analise = await helpers_api_serasa.controller({cartaFianca: cartaFianca, token: token, bearerToken: bearerToken, valoresCartaFianca: valoresCartaFianca});
            const analise = await apiAnalisando.controller({cartaFianca: cartaFianca, token: token, bearerToken: bearerToken, valoresCartaFianca: valoresCartaFianca});

            const {consulta, target} = analise;

            const aplicarRegraAnalise = async ({target, consulta, cartafianca, valorAluguel}) => {
                // 2) Dívida calculada
                const floatDivida = Number(consulta?.negativeData?.pefin?.summary?.balance || 0) + Number(consulta?.negativeData?.refin?.summary?.balance || 0);

                // 3) Planos recebidos
                const onda_config_limite_de_divida_por_plano = Reflect.get(cartafianca, "planosCalculados", Array());

                const planosLiberados = [];
                let virificar_se_planos_estao_cadastrados_no_banco_dados = false;
                let verificar_se_divida_pasou_em_algum_plano = false;

                for (const plano of onda_config_limite_de_divida_por_plano) {
                    virificar_se_planos_estao_cadastrados_no_banco_dados = true;
                    const targetDivida = floatDivida;
                    let planoAprovado = true;

                    const {range_divida, range_aluguel} = plano;

                    // Regra dívida
                    if (range_divida?.ativo) {
                        const {max, min} = range_divida;
                        const passouDivida = Number(max) - Number(targetDivida) >= 0 && Number(targetDivida) - Number(min) >= 0;

                        planoAprovado = passouDivida;
                    }

                    // Regra aluguel
                    if (range_aluguel?.ativo) {
                        const {max, min} = range_aluguel;
                        const passouAluguel = Number(max) - Number(valorAluguel) >= 0 && Number(valorAluguel) - Number(min) >= 0;
                        planoAprovado = planoAprovado && passouAluguel;
                    }

                    if (planoAprovado) {
                        verificar_se_divida_pasou_em_algum_plano = true;
                        planosLiberados.push(plano);
                    }
                }

                // 5) Resumo final
                return planosLiberados;
            };

            const finalClassificationAnalise = await aplicarRegraAnalise({
                cartafianca: valoresCartaFianca,
                consulta,
                target,
                valorAluguel: valoresCartaFianca?.cartafiancaValorAluguelTaxas,
            });
            // return setResponse.SUCCESS({message: "Sucesso ao buscar parametros da análise pelo contrato!", results: onda_config_limite_de_divida_por_plano, res: res});
            return setResponse.SUCCESS({message: "Sucesso ao buscar parametros da análise pelo contrato!", results: finalClassificationAnalise, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarHistoricoAnalisesProcobNoBanco(req, res) {
        try {
            const consulta = await onda_procob.getAll();

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar consultas!",
                results: consulta,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    //CONSULTAS NA API PROCOB COM O SALVAMENTO NO BANCO MONGODB
    // CPF E CNPJ COM DIVIDAS CEFIN PEFIN E NACIONAL:
    // 65609093953
    // 06237375589
    // RETIRAR APÓS A DATA 01/05/2025
    static async buscarPlanosComBaseNasRegrasDaAnalise(req, res) {
        try {
            const {cpfCnpj} = req?.params;

            const consulta = await apiProcobFinanceira.start(cpfCnpj);

            return setResponse.SUCCESS({
                message: "Sucesso ao consultar histórico financeiro na api procob!",
                results: consulta,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarFamiliaresProcob(req, res) {
        try {
            const {cpfCnpj} = req?.params;

            const consultaFinanceira = await apiProcobFinanceira.consultaFamiliaresPeloCpf(cpfCnpj);

            return setResponse.SUCCESS({
                message: "Sucesso ao consultar histórico familiar, api procob!",
                results: consultaFinanceira,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    // static async buscarJuridicaPeloCpfProcob(req, res) {
    //     try {
    //         const {cpfCnpj} = req?.params;
    //         const tokenCode = await getToken(req, res);

    //         const [consulta, familiares, financeiro] = await Promise.all([
    //             apiProcob.consultaJuridicaPeloCpf(cpfCnpj, tokenCode),
    //             apiProcobFinanceira.consultaFamiliaresPeloCpf(cpfCnpj),
    //             apiCebracoFinanceira.CpfconsultaApi({cpf: cpfCnpj}),
    //         ]);

    //         const results = {consulta, familiares, financeiro};

    //         return setResponse.SUCCESS({
    //             message: "Sucesso ao consultar na API!",
    //             results: results,
    //             res: res,
    //         });
    //     } catch (error) {
    //         return setResponse.SERVER_ERROR(res, error);
    //     }
    // }

    static async buscarJuridicaPeloCpfProcob(req, res) {
        try {
            const {cpfCnpj} = req?.params;
            const tokenCode = await getToken(req, res);

            const consulta = await apiProcob.consultaJuridicaPeloCpf(cpfCnpj, tokenCode);

            return setResponse.SUCCESS({message: "Sucesso ao consultar na API!", results: consulta, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarDadosCebraco(req, res) {
        try {
            const {cpf} = req?.params;
            const info = await apiCebracoFinanceira.CpfconsultaApi({cpf: cpf});

            return setResponse.SUCCESS({message: "Sucesso ao buscar dados!", results: info, res: res});
        } catch (error) {
            setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarLocatario(req, res) {
        try {
            const {cod} = req?.params;
            const {locatario, token} = req?.body;

            const verifyExists = await onda_locatario.getOneNotRes(cod);

            if (!verifyExists) {
                return setResponse.WARNING({message: "O locatário não existe!"});
            }

            // const contactVerification = await onda_locatario.buscarLocatarioPeloContato({locatarioCelular: locatario?.locatarioCelular});
            // const emailVerification = await onda_locatario.buscarLocatarioPeloEmail({locatarioEmail: locatario?.locatarioEmail});

            // if (contactVerification.length > 1) {
            //     return setResponse.WARNING({message: "Este telefone já esta sendo utilizado por outro locatário!"});
            // }
            // if (emailVerification.length > 1) {
            //     return setResponse.WARNING({message: "Este Email já esta sendo utilizado por outro locatário!"});
            // }

            await servicesAnaliseRegras.verificarSeTelefoneLocatarioJaEstaVinculadoEmOutroCpf({locatario: locatario});

            await servicesAnaliseRegras.verificarSeEmailLocatarioJaEstaVinculadoEmOutroCpf({locatario: locatario});

            const results = await onda_locatario.patchNotRes(locatario, token, cod);

            const newLocatario = await onda_locatario.getOneNotRes(cod);

            if (results === 0) {
                return setResponse.WARNING({
                    message: "Sem atualizações para salvar!",
                    results: newLocatario,
                });
            }

            const atributosModificados = [];

            Object.entries(locatario).forEach(([key, value]) => {
                const dbValue = verifyExists?.dataValues[key === "locatarioCpf" ? "locatarioCnpjcpf" : key];

                if (value !== dbValue) {
                    atributosModificados.push(key);
                }
            });

            const atributosFormatados = atributosModificados.map((attr) => attr.replace(/^locatario/, ""));

            const atributosAlterados = atributosFormatados.join(", ");

            await onda_followup.postFollowup({
                token: token,
                cod: cod,
                event: `Dados do locatário atualizados 🔄 (Campos alterados: ${atributosAlterados})`,
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar locatário!",
                results: newLocatario,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async executarEncerramentoContrato(req, res) {
        try {
            const {token} = req?.body;

            const validateData = await servicesAnaliseValidate.validateExecucaoEncerramentoContrato(req?.body);
            const contrato = await servicesAnaliseQuery.buscarContratoPelaMatrix({cod: validateData?.matrixContrato});
            const locatario = await onda_locatario.getOneByCPF(contrato?.onda_cartafianca_locatario);
            const imobiliaria = await onda_imob.getOneById(contrato?.onda_cartafianca_imobiliaria);
            servicesAnaliseValidate.validaDadosParaEncerramentodeContrato({contrato, imobiliaria, locatario});
            const estornoPermitido = servicesAnaliseRegras.verificarDataLimiteParaEstorno({dateContrato: contrato.onda_cartafianca_data_pagamento});
            const {refund, sinistros} = await servicesAnaliseRegras.verificaExistenciaSinistrosParaEncerramentoContrato({cod: validateData?.matrixContrato});
            await servicesAnaliseRegras.verificarPermissaoEncerramentoContrato({contrato, dados: validateData, sinistros});
            const regraDeEncerramentoContrato = servicesAnaliseRegras.verificaRegraValidaParaEncerramento({distrato: validateData?.distrato, estornoPermitido});

            const saldoTotal = await regraDeEncerramentoContrato(validateData);

            const cod = contrato?.onda_cartafianca_contrato;

            if (refund) {
                await servicesAnaliseRegras.executaEncerramentoContratoComOnus({contrato, data: validateData, token, valor: saldoTotal});
            } else {
                await servicesAnaliseRegras.executaEncerramentoContratoSemOnus({contrato});
            }
            // if (validateData.distrato) {
            //     for (const i in sinistros) {
            //         const sinistro = sinistros[i];
            //         await servicesJuridicoQuery.atualizarStatusCanceladoSinistroWave({dadosBody: sinistro, codStatusCancelado: "614"});
            //     }
            // }

            await servicesAnaliseQuery.atualizarStatusEncerramentoContratual({data: validateData, refund, cod});
            const registroEncerramento = await servicesAnaliseQuery.gerarRegistroEncerramentoContrato({
                data: validateData,
                codContrato: cod,
                codLocatario: locatario?.locatarioCodigo,
                codImobiliaria: imobiliaria?.imobCodigo,
                total: refund ? saldoTotal : 0,
            });
            const [formData, pdfBuffer] = await servicesAnaliseRegras.gerarFormularioEncerramentoContratoPeloRegistro({
                registroId: registroEncerramento.id,
            });
            // res.setHeader("Content-Type", "application/pdf");
            // res.setHeader("Content-Disposition", "inline");
            // res.send(pdfBuffer);
            const tokenAcess = await getToken(req, res);
            await httpRequestProvider.salvarDocBucket(tokenAcess, formData, cod);
            await onda_followup.postFollowup({
                cod: cod,
                event: `Encerramento contratual executada com sucesso, referente ao Contrato ${cod}, mediante solicitação do(a) usuário ${token?.onda_imob_nome} da imobiliária ${
                    token?.onda_imob_razaosocial
                } e código  ${token?.onda_imob_codigo} . O processo foi classificado como ${validateData.distrato ? "DISTRATO" : "ESTORNO"}.`,
            });
            await onda_followup.postFollowup({
                cod: `TLI-${cod}`,
                event: `🤖 *Encerramento contratual executado. O processo foi classificado como ${validateData.distrato ? "DISTRATO" : "ESTORNO"} 🆗`,
            });
            return setResponse.SUCCESS({
                message: "Sucesso ao executar encerramento de contrato!",
                results: {},
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async gerarPDFformulario(req, res) {
        try {
            const validateData = await servicesAnaliseValidate.validateExecucaoEncerramentoContrato(req?.body);
            const contrato = await servicesAnaliseQuery.buscarContratoPelaMatrix({cod: validateData?.matrixContrato});
            const locatario = await onda_locatario.getOneByCPF(contrato?.onda_cartafianca_locatario);
            const imobiliaria = await onda_imob.getOneById(contrato?.onda_cartafianca_imobiliaria);

            const estornoPermitido = servicesAnaliseRegras.verificarDataLimiteParaEstorno({dateContrato: contrato.onda_cartafianca_data_pagamento});

            const {refund, sinistros} = await servicesAnaliseRegras.verificaExistenciaSinistrosParaEncerramentoContrato({cod: validateData?.matrixContrato});
            const cod = contrato?.onda_cartafianca_contrato;

            const regraDeEncerramentoContrato = servicesAnaliseRegras.verificaRegraValidaParaEncerramento({distrato: validateData?.distrato, estornoPermitido});
            const saldoTotal = await regraDeEncerramentoContrato(validateData);
            const [formData, pdfBuffer] = await servicesAnaliseRegras.gerarFormularioEncerramentoContrato({
                locatario,
                imobiliaria,
                codContrato: cod,
                datas: validateData,
                sign: false,
                valor: refund ? saldoTotal : 0,
            });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "inline");
            res.send(pdfBuffer);
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async verificaEncerramentoContrato(req, res) {
        try {
            const {cod} = req?.params;
            if (!cod) {
                return setResponse.WARNING({message: "Código do contrato não fornecido"});
            }
            const contrato = await servicesAnaliseQuery.buscarContratoPelaMatrix({cod: cod});

            const dentroLimite30dias = await servicesAnaliseRegras.verificarDataLimiteParaEstorno({dateContrato: contrato.onda_cartafianca_data_pagamento});
            const {refund, sinistros} = await servicesAnaliseRegras.verificaExistenciaSinistrosParaEncerramentoContrato({cod});
            const estornoPermitido = refund;

            return setResponse.SUCCESS({
                message: "Sucesso ao verificar encerramento de contrato.",
                results: {dentroLimite30dias, estornoPermitido},
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async testeInadimplente(req, res) {
        try {
            const {inadimplentes, adimplentes} = await servicesAnaliseRegras.verificarInadimplencia();
            return setResponse.SUCCESS({
                message: "Sucesso ao verificar encerramento de contrato.",
                results: {inadimplentes, adimplentes},
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async dados_consultados_serasa(req, res) {
        try {
            const cpfcnpj = req?.params?.cpfcnpj;

            if (!cpfcnpj) {
                return setResponse.WARNING({message: "cpfcnpj não enviado!"});
            }

            const response = await helpers_api_serasa.api_relatorio_avancado_pf(cpfcnpj, "RELATORIO_AVANCADO_TOP_SCORE_PJ");

            const data = await response.json();

            if (!response?.ok) return setResponse.WARNING({message: "Erro ao consultar.", results: data, res: res});

            return setResponse.SUCCESS({message: "Sucesso ao consultar.", results: data?.reports?.[0], res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async executarExoneracaoCartafianca(req, res) {
        try {
            const {token} = req?.body;
            const {cod} = await servicesAnaliseValidate.validaExecucaoExoneracaoCartafianca(req?.body);
            await servicesAnaliseValidate.validaContratoExonerar({cod});
            await servicesAnaliseRegras.executaExoneracaoContrato({cod, token});
            await onda_followup.postFollowup({
                cod,
                token,
                event: `Contrato exonerado de maneira manual, ação executada pelo usuário ${token?.nome}, do id ${token?.id} e código ${token?.codigo}.`,
            });

            await onda_followup.postFollowup({
                cod: `TLI-${cod}`,
                token,
                event: `🤖 *Contrato exonerado pelo departamento jurídico após análise das regras internas ❌`,
            });
            return setResponse.SUCCESS({message: "Sucesso executar exoneração da carta fiança.", results: {}, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async executarVerificacaoExoneracao(req, res) {
        try {
            const contratos = await servicesAnaliseRegras.servicoVerificacaoExoneracaoAutomatica();
            return setResponse.SUCCESS({message: "Sucesso executar verificação de regras de exoneração.", results: {exonerados: [...contratos]}, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async buscarExoneracoes(req, res) {
        try {
            const filtros = {
                dataInicial: req?.query?.dataInicial || null,
                dataFinal: req?.query?.dataFinal || null,
            };

            const results = await onda_cartafianca_exoneracao.getViewAll(filtros);
            return setResponse.SUCCESS({message: "Sucesso ao buscar exonerações.", results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atulizarResponsavelExoneracao(req, res) {
        try {
            const {token} = req?.body;
            const {userId, cod} = await servicesAnaliseValidate.validaAtualizacaoResponsavelExoneracao(req?.body);
            const user = await onda_user.getOneByIdNotRes(userId);
            const results = await onda_cartafianca_exoneracao.update(
                {
                    responsavel: user?.userNomeCompleto || null,
                    responsavelId: user?.id || null,
                },
                cod
            );

            await onda_followup.postFollowup({
                cod,
                event: `Responsável da exoneração atualizado, atualização efetuada pelo usuário ${token.nome}, com código ${token.codigo}`,
                token,
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar exonerações.", results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async mudarEtapaExoneracao(req, res) {
        try {
            const {token} = req?.body;
            const {cod, operacao} = await servicesAnaliseValidate.validaMudancaEtpaExoneracao(req?.body);
            const exoneracao = await onda_cartafianca_exoneracao.getOneByCodigo(cod);
            const {novoStatus, legenda} = servicesAnaliseRegras.servicoVerificaNovoStatusExoneacao({exoneracao, operacao});
            const results = await onda_cartafianca_exoneracao.update({status: novoStatus}, cod);
            await onda_followup.postFollowup({
                cod,
                event: `Status da exoneração atualizado de "${legenda[exoneracao?.status]}" para "${legenda[novoStatus]}", atualização efetuada pelo usuário ${
                    token.nome
                }, com código ${token.codigo}`,
                token,
            });
            return setResponse.SUCCESS({message: "Sucesso ao atualizar exoneração.", results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async executarConfirmacaoExoneracao(req, res) {
        try {
            const { token } = req?.body
            const { cod } = await servicesAnaliseValidate.validaConfirmacaoExoneracao(req?.body);
            const exoneracao = await onda_cartafianca_exoneracao.getOneByCodigo(cod);
            await servicesAnaliseRegras.validaConfirmacaoExoneracaoEmAnalise({ exoneracao })
            await servicesAnaliseRegras.executaConfirmacaoExoneracao({ exoneracao, token })
            await onda_followup.postFollowup({
                cod,
                token,
                event: `Exoneração confirmada, emails de aviso enviados para imobiliária e locatário, ação executada pelo usuário ${token.nome}, do código ${token.codigo}.`
            })
            const results = await onda_cartafianca_exoneracao.getOneByCodigo(exoneracao?.codigo)
            return setResponse.SUCCESS({ message: "Sucesso ao executar confirmação de exoneração.", results, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarContratoPeloCodigo(req, res) {
        try {
            const {cod} = req?.params;
            if (!cod) {
                return setResponse.WARNING({
                    message: "Código do contrato não fornecido para busca.",
                });
            }
            const contrato = await onda_cartafianca.getOneNotResView(cod);
            return setResponse.SUCCESS({message: "Sucesso ao buscar o contrato.", results: contrato, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async verificarExoneracao(req, res) {
        try {
            await servicesAnaliseRegras.servicoVerificacaoExoneracaoAutomatica();
            return setResponse.SUCCESS({message: "Sucesso ao buscar o contrato.", results: {}, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async executarDesoneracaoContrato(req, res) {
        try {
            const {token} = req?.body;
            const {cod} = await servicesAnaliseValidate.validaRequisicaoDesoneracaoContrato(req?.body);
            const exoneracao = await onda_cartafianca_exoneracao.getOneByCodigo(cod);
            await servicesAnaliseRegras.servicoValidadeDesoneracao({exoneracao});
            await servicesAnaliseRegras.executarDesoneracaoContrato({exoneracao});
            const novaexoneracao = await onda_cartafianca_exoneracao.getOneByCodigo(cod);
            await onda_followup.postFollowup({
                cod: novaexoneracao.referencia,
                token,
                event: `Contrato desonerado, exoneração encerrada e contrato retornado para o status anterior, alteração executado pelo usuário ${token.nome}, do código ${token.codigo}`,
            });
            await onda_followup.postFollowup({
                cod: novaexoneracao.codigo,
                token,
                event: `Contrato desonerado, exoneração encerrada e contrato retornado para o status anterior, alteração executado pelo usuário ${token.nome}, do código ${token.codigo}`,
            });
            return setResponse.SUCCESS({message: "Sucesso ao executar desoneraçao do contrato.", results: novaexoneracao, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }


};

export default controllerAnalise;
