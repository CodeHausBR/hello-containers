//BIBLIOTECAS

//HELPERS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
import helpersArquivosCnab400 from "../../../helpers/bancos/arquivos/cnab-400.js";
import getToken from "../../../helpers/token/get-token.js";
import helpersBancosController from "../../../helpers/bancos/controller/helpersBancosController.js";
//BANCO DE DADOS
import VW_CARTAFIANCA_GERAL from "../../models/mongoose/VW_CARTAFIANCA_GERAL.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
import onda_contabancaria from "../../models/financeiro/onda_contabancaria.js";
import onda_fornecedor from "../../models/financeiro/onda_fornecedor.js";
import onda_contas from "../../models/financeiro/onda_contas.js";
import onda_bancos from "../../models/mongoose/onda_bancos.js";
import onda_boletos from "../../models/financeiro/onda_boletos.js";
import onda_pay from "../../models/analise/onda_pay.js";
import onda_sinistro from "../../models/juridico/onda_sinistro.js";
import onda_sinistro_item from "../../models/juridico/onda_sinistro_item.js";
import onda_imobiliaria_config from "../../models/imobiliaria/onda_imobiliaria_config.js";
//SERVICES
import servicesJuridicoRegras from "../../../mvc/services/juridico/regras/servicesJuridicoRegras.js";
import servicesFinanceiroQuery from "../../services/financeiro/query/servicesFinanceiroQuery.js";
import servicesFinanceiroValidate from "../../services/financeiro/validate/servicesFinanceiroValidate.js";
import boleto from "../../../helpers/bancos/arquivos/boleto.js";
import helpersArquivosBoleto from "../../../helpers/bancos/arquivos/boleto.js";
import servicesJuridicoQuery from "../../services/juridico/query/servicesJuridicoQuery.js";
import servicesFinanceiroRegras from "../../services/financeiro/regras/servicesFinanceiroRegras.js";
//WEBSOCKET
//UTILS
import utilsArquivosDeLote from "../../../helpers/bancos/utils/ler-arquivo-retorno.js";
import {extrairCodigosCobranca} from "../../utils/datas/extract-cod.js";
import onda_followup from "../../models/public/onda_followup.js";
import onda_juridico from "../../models/juridico/onda_juridico.js";
import onda_imob from "../../models/users/onda_imob.js";
const controllerFinanceiro = class controllerFinanceiro {
    static async status(req, res) {
        try {
            const arrayStatusFianceiro = await servicesFinanceiroQuery.buscarArrayStatusFinanceiro_query();

            const dadosValidados = await servicesFinanceiroValidate.atualizarStatusAnalise_validate(req?.params, arrayStatusFianceiro);

            await servicesFinanceiroQuery.atualizarStatusFinanceiro_query(dadosValidados);

            const cfAtualizada = await onda_cartafianca.getOneNotResView(dadosValidados?.cod);

            await VW_CARTAFIANCA_GERAL.post(cfAtualizada);

            return setResponse.SUCCESS({
                message: "Status atualizado com sucesso!",
                res: res,
                results: cfAtualizada,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    // ONDA_CONTAS

    static async postContaPagarSinistro(req, res) {
        try {
            const {codSinistro} = req?.params;
            const {token} = req?.body;

            const sinistro1 = await onda_sinistro.getOneNotResByCodView({cod: codSinistro});

            const cartaFianca = await onda_cartafianca.getOneNotResView(sinistro1?.sinistroContrato);

            const totalAprovadoNosItensSinistro = await onda_sinistro_item.buscarTotalValoresDosGruposNosItensNoSinistro({cartaFianca: cartaFianca, codSinistro: codSinistro});

            await servicesJuridicoRegras.verificarSeFoiEncerradoComOnusEValorPagamentoMaiorQueZero({valoresAprovados: totalAprovadoNosItensSinistro, sinistro: sinistro1});

            const configImobiliaria = await onda_imobiliaria_config.getOne({matrix: cartaFianca?.imobCodigo});

            const sinistro = await onda_sinistro.getOneNotResByCodView({cod: codSinistro, configImobiliaria: configImobiliaria});

            await onda_sinistro.verificarSeSinistroJaFoiCadastradoNoFinanceiro({sinistro: sinistro});

            await servicesJuridicoQuery.cadastrarPagamentoSinistroAposImobiliariaAceitarNoPortal({
                token: token,
                sinistro: sinistro,
                valoresSinistro: totalAprovadoNosItensSinistro,
            });

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar conta!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async postContaPagar(req, res) {
        try {
            const {conta, token} = req?.body;
            const {matrix} = req?.params;

            const newContaPagar = await onda_contas.postConta({
                conta,
                token,
                matrix,
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao cadastrar conta!",
                res: res,
                results: newContaPagar,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async putContaPagar(req, res) {
        try {
            const {conta, token} = req?.body;
            const {cod} = req?.params;

            const oldContaPagar = await onda_contas.getOneNotRes({cod: cod});

            if (!oldContaPagar) {
                return setResponse.WARNING({message: "Conta não encontrada!"});
            }

            const newContaPagar = await onda_contas.putConta({
                conta: conta,
                oldConta: oldContaPagar,
                cod: cod,
                token: token,
            });

            await onda_followup.postFollowup({
                cod,
                token,
                event: `Conta alterada com sucesso, alteração executado pelo usuário ${token.nome}, do código ${token.codigo}.`
            })

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar contas pagar!",
                res: res,
                results: newContaPagar,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async putStatusContaPagar(req, res) {
        try {
            const {contas, password, token} = req?.body;

            if (process.env.PASSWORD_ADMIN !== password) {
                return setResponse.WARNING({message: "Acesso negado!"});
            }

            const results = await onda_contas.putStatusConta({contas: contas, token: token});

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar contas pagar!",
                res: res,
                results: results,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async putStatusContaPagarAcordo(req, res) {
        try {
            const {contas, token} = req?.body;

            const results = await onda_contas.putStatusContaAcordo({contas: contas});

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar contas pagar!",
                res: res,
                results: results,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getAllByMatrix(req, res) {
        try {
            const {mes, ano, matrix} = req?.params;

            const conta = await onda_contas.getAllByMatrixNotRes({
                mes,
                ano,
                matrix,
            });

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar conta!",
                res: res,
                results: conta,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getAllFiltroDinamico(req, res) {
        try {
            const data = req?.query;

            const conta = await onda_contas.getAllFiltroDinamico({data: data});

            return setResponse.SUCCESS({message: "Sucesso ao buscar contas!", res: res, results: conta});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getAllContasJuntas(req, res) {
        try {
            const {data} = req?.query;

            const conta = await onda_contas.getAllContasJuntasByAnoMesNotRes({data: data});

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar conta!",
                res: res,
                results: conta,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getContasPagar(req, res) {
        try {
            const data = req?.query;

            const [totalPagoPagar, contas] = await Promise.all([onda_contas.totalPagoXDevidoByAnoMes({data: data}), onda_contas.getAllNotRes({data: data})]);

            const results = {
                contas: contas,
                totalPagoXPagar: totalPagoPagar,
            };

            return setResponse.SUCCESS({message: "Sucesso ao buscar contas!", res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getContasPagas(req, res) {
        try {
            const contas = await onda_contas.getContasPagas();

            if (!contas || contas.length === 0) {
                return setResponse.SUCCESS({
                    message: "Nenhuma conta paga encontrada.",
                    res: res,
                    results: [],
                });
            }

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar contas!",
                res: res,
                results: contas,
            });
        } catch (error) {
            console.error("Erro ao buscar contas pagas:", error);
            return setResponse.SERVER_ERROR(res, "Erro inesperado ao buscar contas pagas.");
        }
    }

    static async getAllNotResSemFiltro(req, res) {
        try {
            const contas = await onda_contas.getAllNotResSemFiltro();

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar relatório contas!",
                res: res,
                results: contas,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    // ONDA_FORNECEDOR

    static async postFornecedor(req, res) {
        try {
            const {fornecedor, token} = req?.body;

            const newFornecedor = await onda_fornecedor.postFornecedor(fornecedor, token);

            return setResponse.SUCCESS({
                message: "Sucesso ao cadastrar fornecedor!",
                res: res,
                results: newFornecedor,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async putFornecedor(req, res) {
        try {
            const {fornecedor, token} = req?.body;
            const {cod} = req?.params;

            const oldFornecedor = await onda_fornecedor.verificarSeForcedorExiste(cod);

            const newFornecedor = await onda_fornecedor.putFornecedor(fornecedor, oldFornecedor, cod, token);

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar fornecedor!",
                res: res,
                results: newFornecedor,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getFornecedores(req, res) {
        try {
            const fornecedores = await onda_fornecedor.getFornecedores();

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar fornecedores!",
                res: res,
                results: fornecedores,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getFornecedor(req, res) {
        try {
            const {cod} = req?.params;

            const fornecedor = await onda_fornecedor.getFornecedor(cod);

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar fornecedor!",
                res: res,
                results: fornecedor,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    // ONDA_CONTABANCARIA
    static async getContasBancarias(req, res) {
        try {
            const newContaBancaria = await onda_contabancaria.getContasBancarias();

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar conta bancaria!",
                res: res,
                results: newContaBancaria,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getContaBancaria(req, res) {
        try {
            const {id} = req?.params;

            const contaBancariaById = await onda_contabancaria.getContaBancariaById(id);

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar conta bancaria!",
                res: res,
                results: contaBancariaById,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async postContaBancaria(req, res) {
        try {
            const {contaBancaria, token} = req?.body;
            const {cod} = req?.params;

            const newContaBancaria = await onda_contabancaria.postContaBancaria(contaBancaria, token, cod);

            return setResponse.SUCCESS({
                message: "Sucesso ao cadastrar conta bancaria!",
                res: res,
                results: newContaBancaria,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async putContaBancaria(req, res) {
        try {
            const {contaBancaria, token} = req?.body;
            const {id} = req?.params;

            const newContaBancaria = await onda_contabancaria.putContaBancaria(contaBancaria, id, token);

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar fornecedor!",
                res: res,
                results: newContaBancaria,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async solicitarBoleto(req, res) {
        try {
            const {data, token} = req?.body;

            await onda_boletos.create({data: data, token: token});

            return setResponse.SUCCESS({
                message: "Sucesso ao solicitar boletos para o financeiro!",
                res: res,
                results: [],
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarBoletosSolicitados(req, res) {
        try {
            const results = await onda_boletos.getAll();

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar solicitações de boletos!",
                res: res,
                results: results,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async gerarLoteKnab240TrocaTitulos(req, res) {
        try {
            // Conteúdo do arquivo gerado (pode vir de uma função ou base de dados)
            // const conteudoArquivo = "Este é um arquivo de exemplo.\nConteúdo do arquivo..."
            const sk_token = await getToken(req, res);

            const {config, idsPay, token} = req?.body;

            const dadosPagamentoViewPay = await onda_pay.getAllPaymentsById({ids: idsPay});

            await servicesFinanceiroRegras.verificarSeASelecaoDeIdsDoContasAReceberPossuiArquivosCnabGeradoENaoGerado({ids: idsPay});

            await servicesFinanceiroRegras.verificarSeAOpcaoEParaGerarCnabESeAlgumJaEstaGerado({ids: idsPay, config: config});

            await servicesFinanceiroRegras.verificarSeEPagamentoPendente({dadosPagamento: dadosPagamentoViewPay});

            await servicesFinanceiroRegras.verificarSeTipoDePagamentoEBoleto({dadosPagamento: dadosPagamentoViewPay});

            // await servicesFinanceiroRegras.verificarSeASelecaoESomenteSicredi({ids: idsPay});

            const dadosPagementoAtualizadoComEnderecoDeCobranca = await servicesFinanceiroQuery.buscarEnderecosDeCobrancaNoPagarme({arrayPagamentos: dadosPagamentoViewPay});

            // //AJUSTAR PARA RECEBER DADOS DOS BANCO QUANDO O MODAL DA GERAÇÃO DE CNAB ESTIVER PRONTO

            const beneficiario = {
                banco: "748",
                cooperativaAgencia: "2606",
                posto: "21",
                conta: "33009",
                digitoConta: "5",
                convenio: "08945",
                cnpj: "47389801000154",
                carteira: "1",
                moeda: "9",
                jurosDia: 1.0,
            };

            const ultimoRegistroDeNossoNumero = await onda_pay.getMaxByNossoNumero();

            const dataBody = await helpersArquivosBoleto.sicred({
                dadosBeneficiario: beneficiario,
                dadosDevedor: dadosPagementoAtualizadoComEnderecoDeCobranca,
                ultimoNossoNumero: ultimoRegistroDeNossoNumero?.ultimoNossoNumero,
            });

            const listaDeNossosNumeros = await utilsArquivosDeLote.buscarNossosNumerosGerados(dataBody);

            const nossoNumeroJaExistente = await onda_pay.getAllNossoNumeroByNossoNumero(listaDeNossosNumeros);

            await servicesFinanceiroRegras.verificarSeExistemNossoNumeroDuplicado(nossoNumeroJaExistente);

            // await servicesFinanceiroRegras.verificarSeExistemNossoNumeroDuplicado(nossoNumeroJaExistente, res)

            await servicesFinanceiroQuery.verificaSeERemessaDeCriacaoEAtualizaPagamentosSelecionados({config: config, dataBody: dataBody, token: token});

            const {buffer, nomeArquivo} = await helpersArquivosCnab400.gerarArquivoLoteTituloSicredi({dataBody: dataBody});

            res.setHeader("Content-Disposition", `attachment; filename=${"nomedoarquivo.rem"}`);
            res.setHeader("Content-Type", "application/octet-stream");

            res.send(buffer);

            // await pdfFinanceiroBoletos.gerarPdfBoletosESalvarNoBucket({dadosPDF: dataBody, token: sk_token});

            return;
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async lerArquivoDeRetorno(req, res) {
        try {
            const {files} = req;

            const informacoesArquivos = await utilsArquivosDeLote.lerArquivoDeRetornoSicredi({files: files});

            const validarInformações = await servicesFinanceiroValidate.validarRetornoArquivoCnab({informacoesArquivos: informacoesArquivos});

            const listaNossoNumeroPendenteDeAtualizacao = await onda_pay.getAllPendenciasRetorno();

            const listaDeNossoNumerosDoArquivoDeRetorno = await servicesFinanceiroRegras.atualizarStatusRetornoCnabEStatusDoPagamento({
                informacoesArquivos: validarInformações,
                listaNossoNumeroPendenteDeAtualizacao: listaNossoNumeroPendenteDeAtualizacao,
                res: res,
            });

            await servicesFinanceiroQuery.montarObjetoParaAtualizarPagamentosComLoteDeRetorno(listaDeNossoNumerosDoArquivoDeRetorno);

            return setResponse.SUCCESS({message: "sucesso!", res: res, results: informacoesArquivos});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async controllerBancos(req, res) {
        try {
            const {acao, idsPay, banco, token} = req?.body;

            const HelpersBancosController = new helpersBancosController({acao: acao, listaIdsPagamento: idsPay, banco: banco, token: token, res: res});

            const results = await HelpersBancosController.controller();

            return setResponse.SUCCESS({message: `Sucesso ao realizar a ação: "${acao?.value}" no banco ${banco?.value}`, results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    //BANCOS ONDA SEGURA

    static async cadastrarBanco(req, res) {
        try {
            const {data} = req?.body;

            const results = await onda_bancos.create({data: data});

            return setResponse.SUCCESS({
                message: "Sucesso ao cadastrar banco!",
                res: res,
                results: results,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarBancos(req, res) {
        try {
            const results = await onda_bancos.getAll();

            return setResponse.SUCCESS({
                message: "Sucesso ao buscar bancos!",
                res: res,
                results: results,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarBancos(req, res) {
        try {
            const {data} = req?.body;

            const results = await onda_bancos.update({data: data});

            return setResponse.SUCCESS({
                message: "Sucesso ao atualizar bancos!",
                res: res,
                results: results,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async deletarBanco(req, res) {
        try {
            return setResponse.SUCCESS({
                message: "Sucesso ao buscar solicitações de boletos!",
                res: res,
                results: [],
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    // GERAR BOLETOS DE COBRANÇA
    //VERIFICAR SE ESTÁ SENDO USADO SENÃO REMOVER
    // static async gerarBoletoCobranca(req, res) {
    //     try {
    //         const {beneficiario, devedor} = req?.body;
    //         const teste = await boleto.sicred({dadosBeneficiario: beneficiario, dadosDevedor: devedor});

    //         // const sk_token = await getToken(req, res);

    //         // const dadosDevedor = await onda_cartafianca.getOneNotResViewById(dataBody?.id_devedor);

    //         // const dadosBeneficiario = await onda_bancos.getOne({_id: dataBody?.id_beneficiario});

    //         // const htmlContent = pdfFinanceiroBoletos.gerarBoleto({dadosBeneficiario: dadosBeneficiario, dadosDevedor: dadosDevedor, dataBody: dataBody});

    //         // const [formData, buffer] = await pdfFinanceiroBoletos.gerarPdfBoletos({
    //         //     htmlContent: htmlContent,
    //         //     nome: "Boleto de cobrança",
    //         //     fileId: 36,
    //         // });

    //         // await httpRequestProvider.salvarDocBucket(sk_token, formData, `OSC-${codContrato}`);

    //         return setResponse.SUCCESS({
    //             message: "Sucesso ao gerar documento de confissão de dívida!",
    //             results: [],
    //             res: res,
    //         });
    //     } catch (error) {
    //         return setResponse.SERVER_ERROR(res, error);
    //     }
    // }

    // CONTAS A RECEBER
    static async criarContaAReceber(req, res) {
        try {
            const {pay, token} = req?.body;
            const cartaFianca = await onda_cartafianca.getOneNotResView(pay?.payContrato);

            if (pay.payHelpersTipoPagamentoId == 241) {
                const {total} = await onda_pay.buscaValorPagoDaCartaFianca(cartaFianca?.id);
                await servicesFinanceiroRegras.verificarSeOValorExcedOValorDaCartafianca({pay: pay, cf: cartaFianca, token: token, total: total});
            }

            const codCobrancaCompleto = pay?.payCodCobranca;
            if (codCobrancaCompleto) {
                const codigosCobranca = extrairCodigosCobranca(codCobrancaCompleto);

                for (const cod of codigosCobranca) {
                    const statusBloqueados = {
                        1101: `A cobrança ${cod} já foi concluída ou cancelada e não é possível criar um novo pagamento.`,
                        1104: `A cobrança ${cod} já foi paga na imobiliária e não é possível criar um novo pagamento.`,
                        1005: `A cobrança ${cod} está disponível, mas não é permitido criar um pagamento neste status.`,
                        1106: `A cobrança ${cod} está em avaliação no período de 15 dias e não é possível criar um pagamento.`,
                        1107: `A cobrança ${cod} está adimplente e não requer um novo pagamento.`,
                    };

                    const [cobranca] = await executarQuery(
                        `SELECT onda_sinistro_cobranca_status, onda_sinistro_cobranca_pagamento_conjunto
                        FROM onda_sinistro_cobranca
                        WHERE onda_sinistro_cobranca_cod = ?`,
                        [cod]
                    );

                    if (!cobranca) {
                        return setResponse.WARNING({
                            message: `A cobrança ${cod} não foi encontrada.`,
                            res: res,
                        });
                    }

                    const status = cobranca.onda_sinistro_cobranca_status;
                    if (statusBloqueados[status]) {
                        return setResponse.WARNING({
                            message: statusBloqueados[status],
                            res: res,
                        });
                    }

                    if (cobranca && cobranca.onda_sinistro_cobranca_pagamento_conjunto) {
                        return setResponse.WARNING({
                            message: `A cobrança ${cod} já está em um pagamento conjunto. Não é possível criar outro pagamento.`,
                            res: res,
                        });
                    }
                }
            }
            const {boletos, newPay} = await servicesFinanceiroRegras.verificarSePlataformaEAsaasParaGerarBoleto({pay: pay, cartaFianca: cartaFianca});

            const results = await onda_pay.postContasAReceberEGerarParcelas({
                pay: Object.keys(newPay).length > 0 ? newPay : pay,
                token: token,
                cartaFianca: cartaFianca,
                boletoAsaas: boletos,
            });

            if (codCobrancaCompleto) {
                const codigosCobranca = extrairCodigosCobranca(codCobrancaCompleto);
                if (codigosCobranca.length > 1) {
                    for (const cod of codigosCobranca) {
                        await executarQuery(
                            `UPDATE onda_sinistro_cobranca
                            SET onda_sinistro_cobranca_pagamento_conjunto = ?
                            WHERE onda_sinistro_cobranca_cod = ?;`,
                            [codCobrancaCompleto, cod]
                        );
                        await onda_followup.postFollowup({token: token, cod: cod, event: "🤖 Pagamento conjunto foi gerado! 🆗"});
                    }
                } else if (codigosCobranca.length === 1) {
                    await executarQuery(
                        `UPDATE onda_sinistro_cobranca
                         SET onda_sinistro_cobranca_pagamento_conjunto = NULL
                         WHERE onda_sinistro_cobranca_cod = ?;`,
                        [codigosCobranca[0]]
                    );
                }
            }

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar pagamentos no banco de dados!", res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarContasAReceberPorQuery(req, res) {
        try {
            const paramsQuery = req?.query;

            //criar schema de validação para os parametros

            const results = await onda_pay.getContasAReceber({params: paramsQuery});

            return setResponse.SUCCESS({message: "Sucesso ao buscar contas a receber!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarContasAReceber(req, res) {
        try {
            const {pay} = req?.body;

            await servicesFinanceiroValidate.validatePathDinamico({pay: pay});

            const old_payment = await servicesFinanceiroQuery.getOneNotResTable({id: pay?.[0]?.onda_pay_id});

            await servicesFinanceiroRegras.verificarAtualizacaoPermitidaAsaas(pay, old_payment);

            const results = await onda_pay.patchContasAReceber({contasAReceber: pay});

            return await setResponse.SUCCESS({message: "Sucesso ao atualizar conta(s) selecionada(s)!", res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getAllContasComSinistroECartaFiancaFiltroDinamico(req, res) {
        try {
            const {payExecutivoId, payParceiroId, payCfConsultorId, imobiliariaId, plano, payImobCidade, payImobUf, dateRangeType, startDate, endDate, payTipoContaId} = req?.query;

            let query = `
                SELECT 
                    P.onda_pay_id AS id,
                    VWC.plano AS plano,
                    VWC.locatario AS payLocatario,
                    LOWER(VWC.Cidade) AS payImobCidade,
                    LOWER(VWC.ImobUF) AS payImobUf,
                    VWC.consultor AS payCfConsultor,
                    VWC.consultorCod AS payCfConsultorId,
                    VWC.executivoCod AS payExecutivoId,
                    VWC.executivo AS payExecutivo,
                    VWC.parceiroCod AS payParceiroId,
                    VWC.parceiro AS payParceiro,
                    VWC.imobiliaria AS imobiliaria,
                    VWC.imobiliariaCod AS imobiliariaId,
                    P.onda_pay_datacriacao AS payDatacriacao,
                    OS.onda_status_id AS payStatusId,
                    OS.onda_status_descricao AS payStatusDesc,
                    P.onda_pay_valortotal AS payValorTotal,
                    P.onda_pay_parcelas AS payParcelas,
                    P.onda_pay_numero_parcela AS payNumeroParcela,
                    P.onda_pay_valorparcelas AS payValorparcelas,
                    P.onda_pay_datavencimento AS payDataVencimento,
                    P.onda_pay_datapagamento AS payDataPagamento,
                    P.onda_pay_tipopagamento AS payTipopagamentoId,
                    TP.onda_tipopagamento_descricao AS payTipopagamentoDesc,
                    P.onda_pay_plataforma AS payPlatformId,
                    PL.onda_plataforma_desc AS payPlatformDesc,
                    P.onda_pay_helpers_tipo_conta_id AS payTipoContaId,
                    OH.onda_helpers_descricao AS payTipoContaDesc
                FROM
                    (((((onda_pay P
                    LEFT JOIN VW_CARTAFIANCA_GERAL VWC ON (P.onda_pay_contrato_id = VWC.id))
                    LEFT JOIN onda_tipopagamento TP ON (P.onda_pay_tipopagamento = TP.onda_tipopagamento_id))
                    LEFT JOIN onda_plataforma PL ON (P.onda_pay_plataforma = PL.idonda_plataforma_id))
                    LEFT JOIN onda_helpers OH ON (P.onda_pay_helpers_tipo_conta_id = OH.onda_helpers_id))
                    LEFT JOIN onda_status OS ON (P.onda_pay_status = OS.onda_status_id))
             `;

            let whereClauseAdded = false;

            // Filtro por Imobiliária (novo)
            if (imobiliariaId) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` VWC.imobiliariaCod = "${imobiliariaId}"`;
                whereClauseAdded = true;
            }

            // Filtro por Executivo
            if (payExecutivoId) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` VWC.executivoCod = "${payExecutivoId}"`;
                whereClauseAdded = true;
            }

            // Filtro por Parceiro
            if (payParceiroId) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` VWC.parceiroCod = "${payParceiroId}"`;
                whereClauseAdded = true;
            }

            // Filtro por Consultor
            if (payCfConsultorId) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` VWC.consultorCod = "${payCfConsultorId}"`;
                whereClauseAdded = true;
            }

            // Filtro por plano
            if (plano) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` VWC.plano = "${plano}"`;
                whereClauseAdded = true;
            }

            if (payImobCidade) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` VWC.Cidade = "${payImobCidade}"`;
                whereClauseAdded = true;
            }

            if (payImobUf) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` VWC.ImobUF = "${payImobUf}"`;
                whereClauseAdded = true;
            }

            if (payTipoContaId) {
                query += whereClauseAdded ? " AND" : " WHERE";
                query += ` P.onda_pay_helpers_tipo_conta_id = "${payTipoContaId}"`;
                whereClauseAdded = true;
            }

            if (dateRangeType) {
                const today = new Date();
                let dateFilterSQL = "";
                let usarDatasPredefinidas = true;

                if (startDate && endDate) {
                    const startDateTime = `${startDate} 00:00:01`;
                    const endDateTime = `${endDate} 23:59:59`;

                    dateFilterSQL = ` P.onda_pay_datavencimento BETWEEN "${startDateTime}" AND "${endDateTime}"`;
                    usarDatasPredefinidas = false;
                } else if (startDate) {
                    const startDateTime = `${startDate} 00:00:01`;
                    dateFilterSQL = ` P.onda_pay_datavencimento >= "${startDateTime}"`;
                    usarDatasPredefinidas = false;
                } else if (endDate) {
                    const endDateTime = `${endDate} 23:59:59`;
                    dateFilterSQL = ` P.onda_pay_datavencimento <= "${endDateTime}"`;
                    usarDatasPredefinidas = false;
                }

                if (usarDatasPredefinidas) {
                    switch (dateRangeType) {
                        case "daily":
                            const formattedToday = today.toISOString().split("T")[0];

                            dateFilterSQL = ` P.onda_pay_datavencimento = "${formattedToday}"`;
                            break;

                        case "weekly":
                            const startOfWeek = new Date(today);
                            startOfWeek.setDate(today.getDate() - today.getDay());

                            const endOfWeek = new Date(today);
                            endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

                            dateFilterSQL = ` P.onda_pay_datavencimento BETWEEN "${startOfWeek.toISOString().split("T")[0]}" AND "${endOfWeek.toISOString().split("T")[0]}"`;
                            break;

                        case "monthly":
                            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                            dateFilterSQL = ` P.onda_pay_datavencimento BETWEEN "${startOfMonth.toISOString().split("T")[0]}" AND "${endOfMonth.toISOString().split("T")[0]}"`;
                            break;

                        case "yearly":
                            const startOfYear = new Date(today.getFullYear(), 0, 1);
                            const endOfYear = new Date(today.getFullYear(), 11, 31);

                            dateFilterSQL = ` P.onda_pay_datavencimento BETWEEN "${startOfYear.toISOString().split("T")[0]}" AND "${endOfYear.toISOString().split("T")[0]}"`;
                            break;
                    }
                }

                if (dateFilterSQL) {
                    query += whereClauseAdded ? " AND" : " WHERE";
                    query += dateFilterSQL;
                    whereClauseAdded = true;
                }
            }

            query += ` ORDER BY P.onda_pay_id DESC`;

            const contaBancaria = await executarQuery(query).catch((err) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar array contas!"});
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar contas!", res: res, results: contaBancaria});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarContaAPagarAcordoExtrajudicial(req, res) {
        try {
            const bodyData = req?.body;
            const {token} = req?.body;
            const {installments, ...rest} = await servicesFinanceiroValidate.validaCadastrosContasAcordoExtrajudicial({bodyData});
            const acordo = await onda_juridico.getAcordoByCod({cod: rest.contaCod});
            const imob = await onda_imob.getOne(rest.titularCod);
            const results = [];
            for (const installment of installments) {
                const pay = {
                    acordoCod: acordo[0].reference,
                    acordoId: acordo[0].id,
                    titular: imob.imobNome,
                    cpf: imob.imobCpfCnpj,
                    totalParcelas: installments.length,
                    ...rest,
                    ...installment,
                };
                results.push(
                    await onda_pay.postContaAcordoExtrajudicial({
                        pay,
                        token: token,
                    })
                );
            }
            await servicesJuridicoRegras.verificaFinalizacaoAcordoExtrajudicial({cod: results[0].payContrato, token});
            await servicesJuridicoRegras.verificarProximaParcela({token, cod: results[0].payContrato});
            return setResponse.SUCCESS({message: "Sucesso ao cadastrar parcelas do acordo", res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async updateContaAPagarAcordoExtrajudicial(req, res) {
        try {
            const bodyData = req?.body;
            const {token} = req?.body;
            const {installments, ...rest} = await servicesFinanceiroValidate.validaCadastrosContasAcordoExtrajudicial({bodyData});
            const acordo = await onda_juridico.getAcordoByCod({cod: rest.contaCod});
            const imob = await onda_imob.getOne(rest.titularCod);
            const results = [];
            for (const installment of installments) {
                const pay = {
                    acordoCod: acordo[0].reference,
                    acordoId: acordo[0].id,
                    titular: imob.imobNome,
                    cpf: imob.imobCpfCnpj,
                    totalParcelas: installments.length,
                    ...rest,
                    ...installment,
                };
                results.push(
                    await onda_pay.updateContaAcordoExtrajudicial({
                        pay,
                        token: token,
                    })
                );
            }
            await servicesJuridicoRegras.verificaFinalizacaoAcordoExtrajudicial({cod: results[0].payContrato, token});
            await servicesJuridicoRegras.verificarProximaParcela({token, cod: results[0].payContrato});
            return setResponse.SUCCESS({message: "Sucesso ao atualizar parcelas do acordo", res: res, results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async deleteContaAPagarAcordoExtrajudicial(req, res) {
        try {
            const bodyData = req?.body;
            const {token} = req?.body;
            const {installments} = await servicesFinanceiroValidate.validaDeleteContasAcordoExtrajudicial({bodyData});
            const payIds = installments.map((item) => item.id);
            const results = await onda_pay.deleteContaAcordoExtrajudicial({
                ids: payIds,
                token: token,
            });
            await servicesJuridicoRegras.verificaFinalizacaoAcordoExtrajudicial({cod: results[0].payContrato, token});
            await servicesJuridicoRegras.verificarProximaParcela({token, cod: results[0].payContrato});
            return setResponse.SUCCESS({message: "Sucesso ao atualizar parcelas do acordo", res: res, results: {}});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async buscarContasAcordoExtrajudicial(req, res) {
        try {
            const bodyData = req?.body;
            const {contas} = await servicesFinanceiroValidate.validateBuscaContasAcordoExtrajudicial({bodyData});
            const response = await onda_contas.getContaByCod({cods: contas});

            return setResponse.SUCCESS({message: "Sucesso ao buscar contras do acordo", res: res, results: {contas: response}});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerFinanceiro;
