//BIBLIOTECAS

//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import onda_followup from "../../../models/public/onda_followup.js";
//BANCO DE DADOS
import apiAtosCobranca from "../../../../helpers/api/atosCobranca/api-atos-cobranca.js";
import onda_sinistro_cobranca from "../../../models/juridico/onda_sinistro_cobranca.js";
//SERVICES
import servicesJuridicoQuery from "../query/servicesJuridicoQuery.js";
//UTILS
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
import onda_juridico from "../../../models/juridico/onda_juridico.js";
import onda_contas from "../../../models/financeiro/onda_contas.js";
import onda_pay from "../../../models/analise/onda_pay.js";
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
import onda_cartafianca_exoneracao from '../../../models/analise/onda_cartafianca_exoneracao.js'
//WEBSOCKET
// import webSocketClient from "../../../helpers/response/web-socket-client.js";

const servicesJuridicoRegras = class servicesJuridicoRegras {
    static validarSeFoiPassadoOsItensDoSinistro({ itensSinistro }) {
        if (itensSinistro?.length <= 0) {
            return setResponse.WARNING({ message: `Para abrir o sinistro é obrigatório o preenchimento dos itens relacionados ao sinistro!` });
        }
        return;
    }

    static async validarSeTemLimiteDisponivelNosGrupos({ gruposSinistro, itensSinistro }) {
        try {
            if (itensSinistro?.length > 1) {
                return setResponse.WARNING({ message: "Enviar somente 1 item para validação!" });
            }

            const limiteAbertura = {
                1: Number(gruposSinistro?.totalDisponivelGrupo1),
                2: Number(gruposSinistro?.totalDisponivelGrupo2),
            };

            const valorItem = Number(itensSinistro?.[0]?.sinistroItemValorAprovado);
            const verificarQualOGrupoDoItem = itensSinistro?.[0]?.sinistroItemGrupo1e2;

            let saldoLimite = limiteAbertura[verificarQualOGrupoDoItem] - valorItem;

            if (saldoLimite <= 0) {
                const newItemAtualizado = [
                    {
                        ...itensSinistro?.[0],
                        sinistroItemStatusId: verificarStatusParaAtualizar(),
                    },
                ];
                return newItemAtualizado;
            }

            function verificarStatusParaAtualizar() {
                if (itensSinistro?.[0]?.sinistroItemStatusId == 1501) return 1501;
                if (itensSinistro?.[0]?.sinistroItemStatusId == 1502) return 1502;
                if (itensSinistro?.[0]?.sinistroItemStatusId == 1503) return 1503;
            }

            return itensSinistro;
        } catch (error) {
            return setResponse.WARNING({ message: "Erro ao validar limite disponível nos grupos!" });
        }
    }

    static validarSeExisteContaBancariaParaAbrirSinistro(props) {
        const { contaBancaria } = props;

        if (!contaBancaria) {
            return setResponse.WARNING({ message: "Conta bancaria da imobiliaria não cadastrada!" });
        }

        return;
    }

    static validarSeNaoTemItensComStatusAguardando(props) {
        const { itensSinistro } = props;

        if (itensSinistro?.length <= 0) {
            return setResponse.WARNING({ message: `Sem itens no sinistro` });
        }

        itensSinistro?.map((item, i) => {
            if (item?.sinistroItemStatusId == 1500 || String(item?.onda_status_descricao).toLowerCase() == "aguardando") {
                return setResponse.WARNING({ message: "Não é possivel finalizar o sinistro com itens em status de aguardando!" });
            } else if (item?.sinistroItemStatusId == 1503) {
                return setResponse.WARNING({ message: "Não é possivel finalizar o sinistro com itens em status de limite excedido!" });
            }
        });

        return;
    }

    static valirdarSeOSinistroJaFoiAbertoParaAnalise({ sinistro }) {
        if (sinistro?.sinistroStatusSinistro == 601) {
            return setResponse.WARNING({ message: "Abra o sinistro antes de enviar para assinatura." });
        }

        return;
    }
    //Alterar chave de verificação e status
    static verificarSeSinistroFoiEnviadoParaAceite({ sinistro }) {
        if (sinistro?.sinistroStatusAssinado !== 1600) {
            return setResponse.WARNING({ message: `Sinistro já foi enviado para assinatura!` });
        }

        return;
    }

    static verificarSeSinistroJaFoiAssinadoNoPortal({ sinistro }) {
        if (sinistro?.sinistroStatusSinistro !== 611) {
            return setResponse.WARNING({ message: `O sinistro não está na etapa de aguardando assinatura!` });
        }

        return;
    }

    static verificarSeSinistroJaFoiCancelado({ sinistro }) {
        if (sinistro?.sinistroStatusAssinado == 608) {
            return setResponse.WARNING({ message: `Sinistro já foi cancelado` });
        }

        return;
    }

    static verificarSeExistemArquivosPendentesSolicitadosEParaAnalise({ arquivosPendentes }) {
        if (arquivosPendentes?.docsPendentes > 0) {
            return setResponse.WARNING({ message: `Analise todos os arquivos antes de abrir o sinistro!` });
        }

        return;
    }

    static verificaSeOStatusJaEstaComoAnaliseSinistro7Dias({ oldSinistro }) {
        if (![601, 609]?.includes(oldSinistro.sinistroStatusSinistro)) {
            return setResponse.WARNING({ message: `O sinistro já está aberto` });
        }

        return;
    }

    static async verificaSeFoiAceitoComOnusGeraPagamentoFinanceiro({ dadosValidados, sinistro, valoresAprovados, token, res }) {
        if (!dadosValidados?.sinistro?.aceitar || valoresAprovados?.grupos?.totalAprovado == 0) return;

        // COMENTADO POIS A COBRANÇA VOLTOU A SER ABERTA NO MOMENTO DA ABERTURA DO SINISTRO
        const verificarSeCobrancaExiste = await onda_sinistro_cobranca.getOneCobrancaAgrupadaPelaMatrixNotResView({ codSinistro: dadosValidados?.codSinistro });

        if (!verificarSeCobrancaExiste) await onda_sinistro_cobranca.post({ codSinistro: sinistro?.sinistroCodigo, idContrato: sinistro?.sinistroIdContrato, sinistro: sinistro });
        await servicesJuridicoQuery.cadastrarPagamentoSinistroAposImobiliariaAceitarNoPortal({
            token: token,
            sinistro: sinistro,
            valoresSinistro: valoresAprovados,
        });

        const newCobranca = { sinistroCobrancaMatrix: dadosValidados?.codSinistro, sinistroCobrancaStatusApiCobranca: "aberto", sinistroCobrancaStatusId: 1105 };

        await onda_sinistro_cobranca
            .put({ dadosBody: newCobranca })
            .then(async (value) => {
                await Promise.all([
                    onda_followup.postFollowup({ token: token, cod: value?.sinistroCobrancaMatrix, event: "*Cobrança atualizada no wave. Sinistro encerrado com ônus." }),
                    onda_followup.postFollowup({ token: token, cod: value?.sinistroCobrancaCod, event: "*Cobrança atualizada no wave. Sinistro encerrado com ônus." }),
                ]);
            })
            .catch(() => {
                return setResponse.DATABASE_ERROR({ message: "Erro ao atualizar status de cobrança" });
            });

        await onda_followup.postFollowup({ token: token, cod: dadosValidados?.codSinistro, event: "*Sinistro encerrado com ônus!" });
        await onda_followup.postFollowup({ token: token, cod: `TLI-${dadosValidados?.codSinistro}`, event: "🤖 *Sinistro encerrado com ônus 🆗" });

        //Não pode ir return porque precisa seguinr o proximo fluxo da função para executar outros passos
        setResponse.SUCCESS({ message: "Assinatura efetuada com sucesso!", results: [], res: res });
    }
    c;
    static async verificaSeFoiAceitoSemOnusCancelaCobranca({ dadosValidados, token, valoresAprovados, res }) {
        if (!dadosValidados?.sinistro?.aceitar || valoresAprovados?.grupos?.totalAprovado !== 0) return;

        const newCobranca = { sinistroCobrancaMatrix: dadosValidados?.codSinistro, sinistroCobrancaStatusApiCobranca: "cancelada", sinistroCobrancaStatusId: 1102 };

        const codCobranca = await onda_sinistro_cobranca
            .put({ dadosBody: newCobranca })
            .then(async (value) => {
                await Promise.all([
                    onda_followup.postFollowup({ token: token, cod: value?.sinistroCobrancaMatrix, event: "*Cobrança cancelada no wave. Sinistro encerrado sem ônus." }),
                    onda_followup.postFollowup({ token: token, cod: value?.sinistroCobrancaCod, event: "*Cobrança cancelada no wave. Sinistro encerrado sem ônus." }),
                ]);
                return value;
            })
            .catch(() => {
                return setResponse.DATABASE_ERROR({ message: "Erro ao atualizar status de cobrança" });
            });

        await onda_followup.postFollowup({ token: token, cod: `TLI-${dadosValidados?.codSinistro}`, event: "🤖 *Sinistro encerrado sem ônus ⚠️" });

        // const listaCobranca = await apiAtosCobranca.getCobrancas();

        // const cobranca = listaCobranca?.value?.query?.filter((cobrancaAtos) => cobrancaAtos?.numero_titulo === codCobranca?.sinistroCobrancaCod )

        // const baixarCobranca = {
        //     codigo_externo_devedor: cobranca?.[0]?.devedor?.codigo_externo,
        //     data_baixa: String(getDataHorarioAtual.YYYY_MM_DD),
        //     documento_devedor: cobranca?.[0]?.devedor?.documento,
        //     especie: cobranca?.[0]?.especie,
        //     motivo_baixa: "Sinistro encerrado sem ônus",
        //     numero: cobranca?.[0]?.numero_titulo,
        //     parcela: cobranca?.[0]?.parcela,
        //     validar_valor: true,
        //     valor: cobranca?.[0]?.valor,
        //     valor_pago: 0,
        //     vencimento: cobranca?.[0]?.vencimento
        //   }

        // apiAtosCobranca.baixarTitulosAtosPeloCodigo({tituloAtos: baixarCobranca, token: token, codCobranca: codCobranca?.sinistroCobrancaCod, codSinistro:codCobranca?.sinistroCobrancaMatrix})

        setResponse.SUCCESS({ message: "Assinatura efetuada com sucesso!", results: [], res: res });
    }

    static async verificaSeFoiRecusado({ token, dadosValidados, res }) {
        if (dadosValidados?.sinistro?.aceitar) return;

        await onda_followup.postFollowup({ token: token, cod: dadosValidados?.codSinistro, event: "*Sinistro recusado no portal" });
        await onda_followup.postFollowup({ token: token, cod: `TLI-${dadosValidados?.codSinistro}`, event: "🤖 *Sinistro recusado pela imobiliária ❌" });

        setResponse.SUCCESS({ message: "Sinistro enviado para contestação.", results: [], res: res });
    }

    static async verificarSeFoiEncerradoComOnusEValorPagamentoMaiorQueZero({ sinistro, valoresAprovados }) {
        if (valoresAprovados?.grupos?.totalAprovado == 0) {
            return setResponse.WARNING({ message: "Valor aprovado é igual a R$ 0,00!" });
        }

        if (Number(sinistro?.sinistroStatusSinistro) !== 606) {
            return setResponse.WARNING({ message: "O sinistro não foi encerrado com ônus!" });
        }
    }

    static async verificarOsStatusDeContaAPagarECobrancaParaDefinirStatus({ contasAPagar, cobranca }) {
        if (cobranca?.onda_sinistro_cobranca_status == 1101 || cobranca?.onda_sinistro_cobranca_status == 1104) {
            return setResponse.WARNING({ message: "Cobrança concluída, não é possível cancelar o sinistro!" });
        }

        if (contasAPagar?.onda_conta_status == 1401) {
            return setResponse.WARNING({ message: "Pagamento efetuado, não é possível cancelar o sinistro!" });
        }

        return true;
    }
    static async verificarValidadeSinistro({ contrato }) {
        /* if (contrato.statusInadimplente == 1) {
            return setResponse.WARNING({
                message:
                    "Cadastro de Sinistro não efetuado. Este contrato encontra-se inadimplente devido ao atraso no pagamento das parcelas, conforme previsto na Cláusula 12 do Contrato de Carta Fiança, que condiciona a cobertura à regularidade das obrigações financeiras.",
            });
        } */
        if ([334, 333, 331, 332].includes(contrato.statusComercialCod)) {
            return setResponse.WARNING({
                message: "Cadastro de Sinistro não efetuado. Este contrato já foi encerrado, não sendo permitido o cadastro de novos sinistros.",
            });
        }
    }

    static async calculandoValorPagodeAcordo({ data }) {
        if (!data) {
            return setResponse.WARNING({
                message: "Dados não fornecidos.",
            });
        }

        const valorPago = data.divida - data.saldo;
        const percentual = (valorPago / data.divida) * 100;
        return {
            ...data,
            taxapaga: parseFloat(percentual).toFixed(1),
        };
    }

    static async verificaFinalizacaoAcordoExtrajudicial({ cod, token, apply = true }) {
        const messages = [];
        let isValid = true;
        const typeInstallmentPay = 244;
        const paymentStatusCompleted = 506;
        const statusAcordoExtrajudicial = {
            completed: 810,
        };

        const installments = await onda_pay.getAllByContrato(cod, typeInstallmentPay);

        if (!installments || installments.length === 0) {
            messages.push("Não há parcelas cadastradas para esse acordo.");
            return { isValid: false, messages };
        }

        const expectedTotal = parseFloat(installments[0].payValorTotal.replace(",", ".")); // Garante que é um número
        let sumOfInstallmentValues = 0;
        let allStatusAre506 = true;

        for (const installment of installments) {
            if (installment.payStatus !== paymentStatusCompleted) {
                allStatusAre506 = false;
                messages.push(`A Parcela nº ${installment.payNumeroParcela} não foi finalizada -  ID ${installment.id}.`);
            }
            const installmentValue = parseFloat(installment.payValorparcelas.replace(",", "."));
            if (isNaN(installmentValue)) {
                messages.push(`A Parcela nº ${installment.payNumeroParcela} não possui um valor cadastrado -  ID ${installment.id}.`);
                isValid = false;
            } else {
                sumOfInstallmentValues += installmentValue;
            }
        }

        if (!allStatusAre506) {
            isValid = false;
        }

        const tolerance = 0.0;
        const roundedSum = Number(sumOfInstallmentValues.toFixed(2));
        const roundedExpected = Number(expectedTotal.toFixed(2));
        if (Math.abs(roundedSum - roundedExpected) > tolerance) {
            messages.push(`A soma dos valores das parcelas (${sumOfInstallmentValues.toFixed(2)}) não é igual ao valor total esperado (${expectedTotal}).`);
            isValid = false;
        }

        if (isValid && apply) {
            await onda_juridico.updateAcordos({ cod, data: { statusAcordo: statusAcordoExtrajudicial.completed }, token });
            await this.concluirContasAcopladasAoAcordoExtrajucial({ codAcordo: cod, token });
        }
        return { isValid, messages };
    }

    static async retornarContasAcopladasAoAcordoExtrajudicial({ codAcordo, token }) {
        const contas = await servicesJuridicoQuery.buscarContasAcopladasaoAcordo({ codAcordo });
        for (const conta of contas) {
            const cod = conta.onda_conta_cod;
            await servicesJuridicoQuery.updateStatusContaAcordoextrajudicial({ cod, acordo: "", status: 1400 });
            await onda_followup.postFollowup({
                token,
                cod,
                event: `Conta reativada devido ao cancelamento do acordo extrajudicial efetuado pelo usuário ${token?.nome}, com o código ${token?.codigo}, do departamento ${token?.departamento}.`,
            });
        }
    }

    static async concluirContasAcopladasAoAcordoExtrajucial({ codAcordo, token }) {
        const contas = await servicesJuridicoQuery.buscarContasAcopladasaoAcordo({ codAcordo });
        for (const conta of contas) {
            const cod = conta.onda_conta_cod;
            await servicesJuridicoQuery.updateStatusContaAcordoextrajudicial({ cod, acordo: codAcordo, status: 1408 });
            await onda_followup.postFollowup({
                token,
                cod,
                event: `Conta concluida devido ao pagamento do total do acordo extrajudicial registrado pelo usuário ${token?.nome}, com o código ${token?.codigo}, do departamento ${token?.departamento}.`,
            });
        }
    }

    static async verificaAtualizacaoAcordoExtrajudicial({ acordo }) {
        if (!acordo) {
            return setResponse.WARNING({
                message: "Acordo Extrajudicial não encontrado.",
            });
        }

        const blockingStatusMessages = {
            809: "Acordo Extrajudicial já está cancelado. Nenhuma alteração adicional é permitida.",
            810: "Acordo Extrajudicial já foi finalizado. Nenhuma alteração adicional é permitida.",
        };
        const currentAcordoStatus = acordo.statusAcordo;
        if (blockingStatusMessages[currentAcordoStatus]) {
            return setResponse.WARNING({
                message: blockingStatusMessages[currentAcordoStatus],
            });
        }
    }

    static processandoDadosDaTabela({ data }) {
        return {
            ...data,
            valorparcela: parseFloat(data?.valorparcela / 100) || null,
            divida: parseFloat(data?.divida / 100) || null,
            saldo: parseFloat(data?.saldo / 100) || null,
            totalPago: parseFloat(data?.totalPago / 100) || null,
        };
    }

    static async verificarProximaParcela({ cod, token = {} }) {
        const typeInstallmentPay = 244;
        const installments = await onda_pay.getAllByContrato(cod, typeInstallmentPay);
        let mostRecentDataPayment = null;
        const filterInstallments = installments?.filter((installment) => [504].includes(installment.payStatus));

        if (filterInstallments.length <= 0 || !filterInstallments) {
            return;
        }

        for (const installment of installments) {
            const currentVenciment = installment?.payVencimento;
            if (!mostRecentDataPayment || currentVenciment < mostRecentDataPayment) {
                mostRecentDataPayment = currentVenciment;
            }
        }

        if (!mostRecentDataPayment) {
            return;
        }
        await onda_juridico.updateAcordos({
            data: { proximaParcela: mostRecentDataPayment },
            cod,
            token
        });
        return mostRecentDataPayment;
    }

    static async validaContasRegistroAcordo({ contas = [] }) {
        let recebedor = null
        for (const conta of contas) {
            const data = await onda_contas.getOneNotRes({ cod: conta?.contaCod })
            if (!data) {
                return setResponse.WARNING({
                    message: ` A conta ${conta?.contaCod} não foi localizada nos registros.`
                })
            }
            if (!recebedor) {
                recebedor = data?.contaRecebedorMatrix
            }

            if (recebedor !== data?.contaRecebedorMatrix) {
                return setResponse.WARNING({
                    message: ` A conta ${conta?.contaCod} não pertence a mesma imobiliária.`
                })
            }
        }
        return recebedor
    }

    static async verificaContratoEncerrado({ contrato = {}, tipoSinistro }) {
        if (!tipoSinistro) {
            return setResponse.WARNING({
                message: "Tipo de sinistro não fornecido."
            })
        }
        if (contrato.statusComercialCod != 335) {
            return
        }
        const quantoTempoPassou = (target, times = 0) => {
            const dataInicial = new Date(target);
            const dataAtual = new Date();
            const diffTempo = dataAtual - dataInicial;
            const diasPassados = diffTempo / (1000 * 60 * 60 * 24);
            return diasPassados > times;
        }

        const calculateVencimentoData = (date = null) => {
            const newDate = new Date(date)
            newDate.setDate(newDate.getDate() + 365);
            return newDate.toISOString()
        }

        const dataVencimentoContrato = contrato?.contratoVenci ? contrato?.contratoVenci : calculateVencimentoData(contrato?.dataPagamento)

        if ([4].includes(tipoSinistro)) {
            const periodo60Dias = quantoTempoPassou(dataVencimentoContrato, 60);
            if (periodo60Dias) {
                return setResponse.WARNING({
                    message: "Já se passaram mais de 60 dias desde o encerramento do contrato. O prazo para abertura deste tipo de sinistro expirou. Em caso de dúvida, entre em contato com o SAC."
                });
            }
        }

        if ([1, 2, 3].includes(tipoSinistro)) {
            const periodo30Dias = quantoTempoPassou(dataVencimentoContrato, 30);
            if (periodo30Dias) {
                return setResponse.WARNING({
                    message: "Já se passaram mais de 30 dias desde o encerramento do contrato. O prazo para abertura deste tipo de sinistro expirou. Em caso de dúvida, entre em contato com o SAC."
                });
            }
        }
        return

    }

    static async verificaContratoExonerados({ contrato = {}, tipoSinistro }) {
        if (!tipoSinistro) {
            return setResponse.WARNING({
                message: "Tipo de sinistro não fornecido."
            })
        }
        if (contrato.statusComercialCod != 336) {
            return
        }

        const exoneracao = await onda_cartafianca_exoneracao.getViewOneByReference(contrato.contrato)
        const periodoDiasPermitido = 120
        const dataCriacaoExoneracao = exoneracao.dataCriacao
        const dataVencimentoContrato = contrato.contratoVenci

        return

    }
};

export default servicesJuridicoRegras;
