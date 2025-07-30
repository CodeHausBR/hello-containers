//BIBLIOTECAS

//HELPERS
import httpRequestProvider from "../../../../helpers/response/http-request-provider.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import pdfGenerate from "../../../../helpers/pdf/pdf-generate.js";
import onda_followup from "../../../models/public/onda_followup.js";
import onda_pay from "../../../models/analise/onda_pay.js";
import onda_parametros_carta_fianca from "../../../models/mongoose/onda_parametros_carta_fianca.js";

//SERVICES
import servicesAnaliseQuery from "../query/servicesAnaliseQuery.js";
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
import servicesFinanceiroQuery from "../../financeiro/query/servicesFinanceiroQuery.js";
//UTILS
import calcularCartaFianca from "../../../utils/analise/calcular-carta-fianca.js";
import onda_sinistro from "../../../models/juridico/onda_sinistro.js";
import onda_contas from "../../../models/financeiro/onda_contas.js";
import onda_cartafianca_encerramento from "../../../models/analise/onda_cartafianca_encerramento.js";
import encerramentoContratoDistratoModal from "../../../../helpers/pdf/analise/contrato-distrato-para-assinatura-modal.js";
import encerramentoContratoEstornoModal from "../../../../helpers/pdf/analise/contrato-estorno-para-assinatura-modal.js";
import onda_locatario from "../../../models/analise/onda_locatario.js";
import onda_imob from "../../../models/users/onda_imob.js";
import servicesAnaliseEmail from "../email/servicesAnaliseEmail.js";
import servicesAnaliseValidate from "../validate/servicesAnaliseValidate.js";
import onda_cartafianca_exoneracao from "../../../models/analise/onda_cartafianca_exoneracao.js";
import gerarCondigoSetores from "../../../../helpers/geral/gerar-condigo-setores.js";

const servicesAnaliseRegras = class servicesAnaliseRegras {
    constructor(props = {}) {
        this.cartaFianca = props?.cartaFianca;
        this.infoAnalise = {
            cartafiancaTipoPagamento: props?.infoAnalise?.cartafiancaTipoPagamento,
            valorRecebidoComissaoImobiliaria: props?.infoAnalise?.valorRecebidoComissaoImobiliaria,
            apiConsulta: props?.infoAnalise?.apiConsulta,
            cartafiancaImobiliaria: props?.infoAnalise?.cartafiancaImobiliaria,
            cartafiancaFonte: props?.infoAnalise?.cartafiancaFonte,
            cartafiancaValorAluguel: props?.infoAnalise?.cartafiancaValorAluguel,
            cartafiancaParcela: props?.infoAnalise?.cartafiancaParcela,
            porcentagemDesconto: props?.infoAnalise?.porcentagemDesconto,
            cartafiancaCobertura: props?.infoAnalise?.cartafiancaCobertura,
            vistoriaEntradaSaida: props?.infoAnalise?.vistoriaEntradaSaida,
            vistoria: props?.infoAnalise?.vistoria,
            pintura: props?.infoAnalise?.pintura,
            limpeza: props?.infoAnalise?.limpeza,
            cartafiancaTaxaIptu: props?.infoAnalise?.cartafiancaTaxaIptu,
            cartafiancaTaxaImovel: props?.infoAnalise?.cartafiancaTaxaImovel,
            cartafiancaTaxaAgua: props?.infoAnalise?.cartafiancaTaxaAgua,
            cartafiancaTaxaCondominio: props?.infoAnalise?.cartafiancaTaxaCondominio,
            cartafiancaTaxaLixo: props?.infoAnalise?.cartafiancaTaxaLixo,
            cartafiancaTaxaEnergia: props?.infoAnalise?.cartafiancaTaxaEnergia,
            cartafiancaTaxaSeguroIncendio: props?.infoAnalise?.cartafiancaTaxaSeguroIncendio,
            cartafiancaTaxaGas: props?.infoAnalise?.cartafiancaTaxaGas,
            ondaConfigValoresAdicionais: props?.infoAnalise?.ondaConfigValoresAdicionais,
        };
    }

    static async verificarImovelDaImobiliaria_regras(dadosValidados) {
        const query = `
            SELECT 
                IM.onda_imovel_imobiliaria,
                IM.onda_imovel_status
            FROM onda_imovel AS IM
            WHERE onda_imovel_id = ${dadosValidados?.imovelId}
        `;

        const [imovel] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imovel para verificar no cadastro da analise!"});
        });

        if (!imovel) {
            return setResponse.WARNING({message: "Imóvel não encontrado, tente novamente!"});
        }

        if (imovel?.onda_imovel_imobiliaria !== dadosValidados?.imobiliariaId) {
            return setResponse.FORBIDDEN({message: `O imóvel de id: ${dadosValidados?.imovelId}, não pertence a está imobiliária!`});
        }

        if (imovel?.onda_imovel_status === 91) {
            return setResponse.WARNING({message: "O imóvel não está disponível para alugar!"});
        }
        return;
    }

    static async verificarOqueEstaSendoAtualizado(verifyCartaFiancaExists, infoAnalise) {
        if (verifyCartaFiancaExists.plano !== infoAnalise?.cartafiancaCobertura) {
            infoAnalise.porcentagemDesconto = 0;
        }

        if (infoAnalise?.cartafiancaTipoPagamento == 4 && verifyCartaFiancaExists.parcelas == 1 && infoAnalise.cartafiancaParcela !== 1) {
            return setResponse.WARNING({message: "O máximo de parcelas para PIX é 1!", results: verifyCartaFiancaExists});
        }

        if (infoAnalise?.cartafiancaTipoPagamento == 7 && verifyCartaFiancaExists.parcelas == 1 && infoAnalise.cartafiancaParcela !== 1) {
            return setResponse.WARNING({message: "O máximo de parcelas para boleto sem entrada é 1!", results: verifyCartaFiancaExists});
        }

        if (infoAnalise?.cartafiancaTipoPagamento == 4) {
            infoAnalise.cartafiancaParcela = 1;
        }

        const newObjetoInfoAnalise = {
            ...infoAnalise,
        };

        return newObjetoInfoAnalise;
    }

    static async verificarVencimento() {
        const query = `
            SELECT onda_cartafianca_contrato
            FROM onda_cartafianca
            WHERE onda_cartafianca_data_vencimento < NOW()
            AND onda_cartafianca_data_pagamento IS NOT NULL
            AND onda_cartafianca_status_comercial IN (998, 999);
        `;

        const result = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cartas fiança!"});
        });

        if (result?.length === 0) {
            return [];
        }

        const contratos = result.map((item) => item?.onda_cartafianca_contrato);

        return contratos;
    }

    static async verificarInadimplencia() {
        const pagamentos = await servicesFinanceiroQuery.buscarParcelasDaCartafianca();

        if (pagamentos.length == 0) {
            return;
        }
        const inadimplentesSet = new Set();
        const adimplentesSet = new Set();
        const contagemStatus = {};

        pagamentos.forEach((item) => {
            const contrato = item.onda_pay_contrato;
            if (inadimplentesSet.has(contrato)) return;
            if (item.onda_pay_status === 513) {
                contagemStatus[contrato] = (contagemStatus[contrato] || 0) + 1;
                if (contagemStatus[contrato] >= 1) {
                    inadimplentesSet.add(contrato);
                    adimplentesSet.delete(contrato);
                }
            } else {
                if (!contagemStatus[contrato]) {
                    adimplentesSet.add(contrato);
                }
            }
        });
        return {
            inadimplentes: [...inadimplentesSet],
            adimplentes: [...adimplentesSet],
        };
    }

    static async verificarOqueEstaSendoAtualizadoEscolhaPlano(verifyCartaFiancaExists, infoAnalise) {
        const newObjetoInfoAnalise = {
            //campos que são enviados no front:
            cartafiancaImovelId: infoAnalise?.cartafiancaImovelId || verifyCartaFiancaExists?.imovelId,
            cartafiancaCobertura: infoAnalise?.cartafiancaCobertura || verifyCartaFiancaExists?.plano,
            //Campos que não são enviados no front:
            cartafiancaImobiliaria: verifyCartaFiancaExists?.imobiliariaCod,
            cartafiancaFonte: verifyCartaFiancaExists?.cfFonte,
            cartafiancaValorAluguel: verifyCartaFiancaExists?.valoraluguel,
            cartafiancaParcela: verifyCartaFiancaExists?.parcelas,
            porcentagemDesconto: verifyCartaFiancaExists?.desconto,
            vistoria: verifyCartaFiancaExists?.vistoria_,
            pintura: verifyCartaFiancaExists?.pintura_,
            limpeza: verifyCartaFiancaExists?.limpeza_,

            //Estão corretos:
            cartafiancaTaxaIptu: verifyCartaFiancaExists?.iptu,
            cartafiancaTaxaImovel: verifyCartaFiancaExists?.taxasImovel,
            cartafiancaTaxaAgua: verifyCartaFiancaExists?.agua,
            cartafiancaTaxaCondominio: verifyCartaFiancaExists?.condominio,
            cartafiancaTaxaLixo: verifyCartaFiancaExists?.lixo,
            cartafiancaTaxaEnergia: verifyCartaFiancaExists?.energia,
            cartafiancaTaxaSeguroIncendio: verifyCartaFiancaExists?.seguroIncendio,
            cartafiancaTaxaGas: verifyCartaFiancaExists?.gas,
        };

        return newObjetoInfoAnalise;
    }

    static async calcularCartaFianca_regra(dadosQuery, taxas) {
        const {
            cartafiancaCobertura,
            porcentagemDesconto,
            cartafiancaValorAluguel,
            cartafiancaTaxaIptu,
            cartafiancaTaxaImovel,
            cartafiancaTaxaAgua,
            cartafiancaTaxaCondominio,
            cartafiancaTaxaLixo,
            cartafiancaTaxaEnergia,
            cartafiancaTaxaSeguroIncendio,
            cartafiancaTaxaGas,
            vistoria,
            limpeza,
            pintura,
        } = dadosQuery;

        const cartafiancaValorAluguelTaxasLixoIptu =
            Number(cartafiancaValorAluguel || 0) +
            Number(cartafiancaTaxaIptu || 0) +
            Number(cartafiancaTaxaImovel || 0) +
            Number(cartafiancaTaxaAgua || 0) +
            Number(cartafiancaTaxaCondominio || 0) +
            Number(cartafiancaTaxaLixo || 0) +
            Number(cartafiancaTaxaGas || 0) +
            Number(cartafiancaTaxaSeguroIncendio || 0) +
            Number(cartafiancaTaxaEnergia || 0);

        if (cartafiancaCobertura == "Basic" && porcentagemDesconto > Number(taxas?.onda_config_TaxaBasicDesconto)) {
            return setResponse.WARNING({message: `Máximo descontro Basic ${taxas?.onda_config_TaxaBasicDesconto}%`});
        }
        if (cartafiancaCobertura == "Standard" && porcentagemDesconto > Number(taxas?.onda_config_TaxaStandardDesconto)) {
            return setResponse.WARNING({message: `Máximo desconto Standard: ${taxas?.onda_config_TaxaStandardDesconto}%`});
        }
        if (cartafiancaCobertura == "Premium" && porcentagemDesconto > Number(taxas?.onda_config_TaxaPremiumDesconto)) {
            return setResponse.WARNING({message: `Máximo desconto Premium: ${taxas?.onda_config_TaxaPremiumDesconto}%`});
        }

        function calcularTaxa(value) {
            try {
                if (cartafiancaCobertura === "Premium") {
                    const taxa = (taxas?.["onda_config_TaxaPremium" + value] / 100) * 12;

                    return parseFloat(cartafiancaValorAluguelTaxasLixoIptu * taxa);
                }
                if (cartafiancaCobertura === "Standard") {
                    const taxa = (taxas?.["onda_config_TaxaStandard" + value] / 100) * 12;

                    return parseFloat(cartafiancaValorAluguelTaxasLixoIptu * taxa);
                }
                if (cartafiancaCobertura === "Basic") {
                    const taxa = (taxas?.["onda_config_TaxaBasic" + value] / 100) * 12;

                    return parseFloat(cartafiancaValorAluguelTaxasLixoIptu * taxa);
                }
                return setResponse.WARNING({message: "Erro ao calcular taxas da CF"});
            } catch (e) {
                return setResponse.WARNING({message: "Erro ao calcular taxa da cartafiança!"});
            }
        }

        function setTaxaVistoria() {
            if (cartafiancaCobertura == "Premium") {
                return 0;
            }
            if (vistoria == 0) {
                return 0;
            }
            return Number(taxas?.onda_config_TaxaVistoria);
        }

        function getValorAdesao() {
            if (cartafiancaValorAluguelTaxasLixoIptu >= 3000) {
                return Number(taxas?.onda_config_AdesaoMaxima);
            } else {
                return Number(taxas?.onda_config_AdesaoMinima);
            }
        }

        function setTaxaLimpeza() {
            if (limpeza == 0) {
                return 0;
            }
            return Number(taxas?.onda_config_TaxaLimpezaExterna);
        }

        function setTaxaPintura() {
            if (pintura == 0) {
                return 0;
            }
            return Number(taxas?.onda_config_TaxaPintura);
        }

        const setValorTaxa = {
            onda_config_TaxaPintura: setTaxaPintura(),
            onda_config_TaxaLimpezaExterna: setTaxaLimpeza(),
            onda_config_TaxaVistoria: 0,
        };

        const cartafiancaDesconto = porcentagemDesconto / 100;

        const descontoAvista = calcularTaxa("Vista") * cartafiancaDesconto;
        const descontoPrazo = calcularTaxa("Prazo") * cartafiancaDesconto;

        const calcularAdicionais = Object.values(setValorTaxa).reduce((total, valor) => total + valor);

        const valorAvista = calcularTaxa("Vista") - descontoAvista + calcularAdicionais;
        const valorAprazo = calcularTaxa("Prazo") - descontoPrazo + calcularAdicionais;
        const valorParcela = valorAprazo / dadosQuery?.cartafiancaParcela;

        function getDesconto() {
            if (dadosQuery?.cartafiancaParcela >= 0) {
                return Math.floor(valorAprazo * cartafiancaDesconto * 100) / 100;
            } else {
                return Math.floor(valorAvista * cartafiancaDesconto * 100) / 100;
            }
        }

        return {
            cartafiancaValorParcela: Math.floor(valorParcela * 100) / 100,
            cartafiancaValorAdesao: getValorAdesao(),
            cartafiancaValorAVista: Math.floor(valorAvista * 100) / 100,
            cartafiancaValorAPrazo: Math.floor(valorAprazo * 100) / 100,
            cartafiancaValorDesconto: getDesconto(),
            cartafiancaParcela: dadosQuery?.cartafiancaParcela,
            cartafiancaConfigTaxaId: taxas.onda_config_id,
        };
    }

    static async calcularCartaFianca_regra_new(dadosQuery, paramentroAnalise, ultimaTaxaCadastrada) {
        const {
            cartafiancaCobertura,
            porcentagemDesconto,
            cartafiancaValorAluguel,
            cartafiancaTaxaIptu,
            cartafiancaTaxaImovel,
            cartafiancaTaxaAgua,
            cartafiancaTaxaCondominio,
            cartafiancaTaxaLixo,
            cartafiancaTaxaEnergia,
            cartafiancaTaxaSeguroIncendio,
            cartafiancaTaxaGas,
            cartafiancaParcela,
            // limpeza,
            // pintura,
            // vistoria,
            taxas,
        } = dadosQuery;

        // const {onda_config_valores_adicionais} = paramentroAnalise;

        // SOLUÇÃO PARA CONSULTAR VALORES ATUALIZADOS NO MONGO
        // const searchValueService = (tag) => {
        //     return onda_config_valores_adicionais?.filter((item) => tag.toLocaleLowerCase().includes(item.label.toLocaleLowerCase().split(" ")[0]))[0].valor;
        // };
        // Feito assim, pois a dinamicidade não esta completa
        // const taxaLimpeza = limpeza == 1 ? searchValueService("Limpeza") : 0;
        // const taxaPintura = pintura == 1 ? searchValueService("Pintura") : 0;
        // const taxaVistoria = vistoria == 1 ? searchValueService("Vistoria") : 0;
        // const taxasCalculadas = calcularCartaFianca.onda_config_valores_adicionais(taxas || []);

        const taxasCalculadas = onda_parametros_carta_fianca.calcularValoresAdicionais({onda_config_valores_adicionais: taxas});

        const cartafiancaValorAluguelTaxas =
            Number(cartafiancaValorAluguel || 0) +
            Number(cartafiancaTaxaIptu || 0) +
            Number(cartafiancaTaxaImovel || 0) +
            Number(cartafiancaTaxaAgua || 0) +
            Number(cartafiancaTaxaCondominio || 0) +
            Number(cartafiancaTaxaLixo || 0) +
            Number(cartafiancaTaxaGas || 0) +
            Number(cartafiancaTaxaSeguroIncendio || 0) +
            Number(cartafiancaTaxaEnergia || 0);

        const cartafiancaDesconto = (100 - porcentagemDesconto) / 100;

        const onda_config_valor_adesao = [
            {
                valor: 150,
                valor_maximo_ate: 2999,
                ativo: true,
            },
        ];

        // OBS P/ FUTURAS ALTERAÇÕES -> porcentagemDesconto esta sendo enviado estátitco no corpo, não esta sendo puxado de lugar algum
        //#OK VERIFICAR DESCONTO SE ESTÁ NA FAIXA ESPERADA
        for (const plano of paramentroAnalise?.onda_config_planos) {
            if (
                Number(porcentagemDesconto) > Number(plano?.desconto) &&
                String(cartafiancaCobertura).toLocaleLowerCase().trim() === String(plano?.nome).toLocaleLowerCase().trim()
            ) {
                return setResponse.WARNING({message: `Desconto máximo ${plano?.nome}: ${Number(plano?.desconto)}%`});
            }
        }

        const planosCalculados = [];

        if (paramentroAnalise?.onda_config_planos?.length == 0) return setResponse.WARNING({message: "Sem planos cadastrados!"});

        // Função para calcular valor à vista
        function calcularValorAVista(taxaAVista) {
            const taxa = (Number(taxaAVista) / 100) * 12;

            return parseFloat(cartafiancaValorAluguelTaxas * taxa) || 0;
        }

        // Função para calcular valor a prazo
        function calcularValorAPrazo(taxaAPrazo) {
            const taxa = (Number(taxaAPrazo) / 100) * 12;

            return parseFloat(cartafiancaValorAluguelTaxas * taxa) || 0;
        }

        for (const plano of paramentroAnalise?.onda_config_planos) {
            const valorAdesao = gerarValorAdesao(cartafiancaValorAluguelTaxas);

            const valorAVista = calcularValorAVista(plano.taxa_a_vista);

            const valorAPrazo = calcularValorAPrazo(plano.taxa_a_prazo);

            const valorParcela = (Number(valorAPrazo) + Number(taxasCalculadas || 0)) / Number(cartafiancaParcela);

            const objetoCalculado = {
                ...plano,
                cartafiancaValorAdesao: valorAdesao,
                valorAVista: Math.floor((valorAVista + Number(taxasCalculadas || 0)) * cartafiancaDesconto * 100) / 100,
                valorAPrazo: Math.floor((valorAPrazo + Number(taxasCalculadas || 0)) * cartafiancaDesconto * 100) / 100,
                valorParcela: Math.floor(valorParcela * cartafiancaDesconto * 100) / 100,
                valorDescondo: Math.floor((valorAPrazo + Number(taxasCalculadas || 0)) * cartafiancaDesconto * 100) / 100,
            };

            planosCalculados.push(objetoCalculado);
        }

        function gerarValorAdesao(valorAluguel) {
            // Ordena as configurações por valor_maximo_ate para garantir a ordem correta
            const configsAtivas = onda_config_valor_adesao.filter((config) => config.ativo).sort((a, b) => a.valor_maximo_ate - b.valor_maximo_ate);

            // Procura a faixa de preço adequada
            for (const config of configsAtivas) {
                if (valorAluguel <= config.valor_maximo_ate) {
                    return config.valor;
                }
            }

            // Se o valor do aluguel for maior que todas as faixas, retorna o valor da última faixa
            return configsAtivas[configsAtivas.length - 1]?.valor || 0;
        }

        const [planoEscolhido] = planosCalculados.filter((planos) => planos.nome == cartafiancaCobertura);

        return {
            //Novos itens
            planosCalculados: planosCalculados, // Foi al
            planoEscolhido: planoEscolhido,
            cartafiancaValorAluguelTaxas: cartafiancaValorAluguelTaxas,
            //Itens antigos
            cartafiancaValorParcela: Number(planoEscolhido?.valorParcela),
            cartafiancaValorAdesao: Number(planoEscolhido?.cartafiancaValorAdesao),
            cartafiancaValorAVista: Number(planoEscolhido?.valorAVista),
            cartafiancaValorAPrazo: Number(planoEscolhido?.valorAPrazo),
            cartafiancaValorDesconto: Number(planoEscolhido?.valorDescondo),
            cartafiancaParcela: cartafiancaParcela,
            cartafiancaConfigTaxaId: ultimaTaxaCadastrada?.onda_config_id,
        };
    }

    static async verificarContratoExists(contrato) {
        const query = `
            SELECT * FROM VW_CARTAFIANCA_GERAL 
            WHERE contrato = '${contrato}'
        `;
        const [results] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contrato!"});
        });

        if (!results) {
            return setResponse.WARNING({message: "Contrato não encontrado!"});
        }
    }

    static async verificarSeContratofoiPago(cartaFianca) {
        const query = `
            SELECT 
	            SUM(CASE WHEN onda_pay_helpers_tipo_conta_id = 241 THEN onda_pay_valorparcelas else 0 END) + SUM(CASE WHEN onda_pay_helpers_tipo_conta_id = 243 THEN onda_pay_valorparcelas else 0 END) AS TOTAL
            FROM onda_pay
            WHERE onda_pay_contrato = '${cartaFianca?.contrato}'
            GROUP BY onda_pay_contrato
        `;

        const [contarValorRecebido] = await executarQuery(query).catch(() => {
            return setResponse.WARNING({message: "Erro ao cadastrar pagamento"});
        });

        const verificarCartaFiancaRenovacao = cartaFianca?.statusAnaliseCod == 114 ? 0 : Number(cartaFianca?.valoradesao);

        const totalPagar = Number(cartaFianca?.valorCartaFianca) + Number(verificarCartaFiancaRenovacao);

        const totalPagoPay = Number(contarValorRecebido?.TOTAL);

        const totalDevido = totalPagar - totalPagoPay;

        if (typeof totalDevido !== "number") return setResponse.WARNING({message: "Tipo de dado inválido ao calcular total pago na cf!"});
        //Retirar esse comentário após colocar o input que pode receber várias casas numéricas

        if (totalDevido > 1) {
            return setResponse.WARNING({message: `Restam R$ ${Math.abs(totalDevido).toFixed(2)} para pagar!`});
        }
    }

    static async statusAnalise(cfDesatualizada = Object(), status = Number()) {
        if (Number(status) === 111 && !cfDesatualizada?.locatarioEmail) {
            return setResponse.WARNING({message: "Precisa cadastrar e-mail do locatário para aprovar a análise!"});
        }
    }

    static async gerarSimulacaoAnexo1(token, cod, bloquear, cartaFianca) {
        let setCartaFianca = cartaFianca || (await onda_cartafianca.getOneNotResView(cod));

        if (bloquear) {
            if (setCartaFianca?.statusAnaliseCod == 109) return setCartaFianca;
            if (setCartaFianca?.statusAnaliseCod == 110) return setCartaFianca;
            if (setCartaFianca?.statusAnaliseCod == 116) return setCartaFianca;
            if (setCartaFianca?.statusAnaliseCod == 112) return setCartaFianca;
            if (setCartaFianca?.statusAnaliseCod == 113) return setCartaFianca;
        }

        const [anexo1, simulacao] = await servicesAnaliseQuery.buscarAnexo1_query(cod);
        // const simuHtml = await pdfGenerate.novaSimulacao(setCartaFianca);
        const simuHtml = await pdfGenerate.simulacaoAnexo1(setCartaFianca);

        const [formData, pdfBuffer] = await pdfGenerate.gerarPdf(simuHtml, "simulacao", 23);

        await httpRequestProvider.salvarDocBucket(token, formData, cod);

        await httpRequestProvider.deletarDocBucket(token, simulacao);

        await onda_followup.postFollowup({token: token, cod: cod, event: "🤖 *Simulação gerada com sucesso! 🆗"});
        await onda_followup.postFollowup({token: token, cod: `TLI-${cod}`, event: "🤖 *Simulação gerada 🆗"});

        return setCartaFianca;
    }

    static async verificarSeEmailLocatarioJaEstaVinculadoEmOutroCpf({locatario}) {
        const locatarioCnpjcpf = locatario.locatarioCnpjcpf ?? locatario.locatarioCpf;
        const {locatarioEmail} = locatario;

        const query = `
            SELECT 
                onda_locatario_cnpjcpf,
                onda_locatario_email
            FROM onda_locatario
            WHERE onda_locatario_email = '${locatarioEmail}'
        `;

        const buscarEmailCpf = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar locatário para verificar e-maail!"});
        });

        for (let i = 0; i <= buscarEmailCpf?.length; i++) {
            if (locatarioEmail == buscarEmailCpf[i]?.onda_locatario_email && buscarEmailCpf[i]?.onda_locatario_cnpjcpf != locatarioCnpjcpf) {
                return setResponse.WARNING({message: "Este e-mail está sendo utilizado por outro locatário!"});
            }
        }
    }

    static async verificarSeTelefoneLocatarioJaEstaVinculadoEmOutroCpf({locatario}) {
        const locatarioCnpjcpf = locatario.locatarioCnpjcpf ?? locatario.locatarioCpf;
        const {locatarioCelular} = locatario;

        const query = `
            SELECT 
                onda_locatario_cnpjcpf,
                onda_locatario_celular
            FROM onda_locatario
            WHERE onda_locatario_celular = '${locatarioCelular}'
        `;

        const buscarCelularCpf = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar locatário para verificar telefone!"});
        });

        for (let i = 0; i <= buscarCelularCpf?.length; i++) {
            if (locatarioCelular == buscarCelularCpf[i]?.onda_locatario_celular && buscarCelularCpf[i]?.onda_locatario_cnpjcpf == locatarioCnpjcpf) {
                return;
            }
        }
        for (let i = 0; i <= buscarCelularCpf?.length; i++) {
            if (locatarioCelular == buscarCelularCpf[i]?.onda_locatario_celular && buscarCelularCpf[i]?.onda_locatario_cnpjcpf != locatarioCnpjcpf) {
                return setResponse.WARNING({message: "Este telefone está sendo utilizado por outro locatário!"});
            }
        }
    }

    static async gerarValorMinimoParcelasBoleto(valoresCartaFiancaStart, ultimaTaxaCadastrada) {
        const {onda_config_valor_minimo_parcelas_boleto} = ultimaTaxaCadastrada;

        const {
            cartafiancaValorParcela,
            cartafiancaValorAdesao,
            cartafiancaValorAVista,
            cartafiancaValorAPrazo,
            cartafiancaValorDesconto,
            cartafiancaParcela,
            cartafiancaConfigTaxaId,
        } = valoresCartaFiancaStart;

        const valorParcela11Vezes = Number(cartafiancaValorParcela) / 11;
        const valorMinParcela = Number(onda_config_valor_minimo_parcelas_boleto) || 10;

        // REGRA PARCELA VALOR MÍNIMO => PARCELAS DEVEM SER NO MÍN. R$100
        // 11x É Nº PADRÃO ADOTADO => REGRA DE NEGÓCIO
        // RETORNADO VALOR DE MÍN. PARCELAS DINAMICAS
        if (Number(valorParcela11Vezes) <= valorMinParcela) {
            const parcelaMaxima = Number(cartafiancaValorAPrazo) / valorMinParcela;
            const parcelaArredondada = Math.floor(parcelaMaxima);
            return Number(parcelaArredondada);
        } else {
            return 11;
        }
    }

    static async verificarSeECnpjCpfEnviarParaAnaliseManual(cartaFianca, token, paramentroAnalise) {
        function removerCaracteresEspeciaisEEspacos(str) {
            return str
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .replace(/\s/g, "")
                .trim();
        }
        const origin = String(cartaFianca?.cfFonte).toLocaleLowerCase();
        const isCNPJ = String(removerCaracteresEspeciaisEEspacos(cartaFianca.cpf || "")).length > 11;
        const eventAnalise = {
            cnpj: {
                portal: {
                    followUp: "*Análises de CNPJ pelo Portal deve ser feita manualmente! ⚠️",
                    followUpTLI: "🤖 *A análise de CNPJ será feita manualmente ⚠️",
                    message: "Análise do CNPJ será feita manualmente!",
                },
                wave: {
                    followUp: "*Análises de CNPJ pelo Wave deve ser feita manualmente! ⚠️",
                    followUpTLI: "🤖 *A análise de CNPJ será feita manualmente ⚠️",
                    message: "Análise do CNPJ será feita manualmente!",
                },
            },
            cpf: {
                portal: {
                    followUp: "*Análises de CPF pelo Portal deve ser feita manualmente! ⚠️",
                    followUpTLI: "🤖 *A análise de CPF será feita manualmente ⚠️",
                    message: "Análise do CPF será feita manualmente!",
                },
                wave: {
                    followUp: "*Análises de CPF pelo Wave deve ser feita manualmente! ⚠️",
                    followUpTLI: "🤖 *A análise de CPF será feita manualmente ⚠️",
                    message: "Análise do CPF será feita manualmente!",
                },
            },
        };
        const event = isCNPJ ? eventAnalise.cnpj[origin] : eventAnalise.cpf[origin];
        if (!event) {
            return;
        }
        if (isCNPJ) {
            const {cnpj_portal, cnpj_wave} = paramentroAnalise?.onda_config_analise_manual_aplicativos;
            if ((cnpj_portal && origin == "portal") || (cnpj_wave && origin == "wave")) {
                await onda_followup.postFollowup({token: token, cod: cartaFianca?.contrato, event: event?.followUp});
                await onda_followup.postFollowup({token: token, cod: `TLI-${cartaFianca?.contrato}`, event: event?.followUpTLI});
                await onda_cartafianca.atualizarStatus(112, cartaFianca?.contrato);
                return setResponse.WARNING({message: event?.message});
            }
        } else {
            const {cpf_portal, cpf_wave} = paramentroAnalise?.onda_config_analise_manual_aplicativos;
            if ((cpf_portal && origin == "portal") || (cpf_wave && origin == "wave")) {
                await onda_followup.postFollowup({token: token, cod: cartaFianca?.contrato, event: event?.followUp});
                await onda_followup.postFollowup({token: token, cod: `TLI-${cartaFianca?.contrato}`, event: event?.followUpTLI});
                await onda_cartafianca.atualizarStatus(112, cartaFianca?.contrato);
                return setResponse.WARNING({message: event?.message});
            }
        }
        return false;
    }

    static async calcularCartaFiancaComBaseNoParametroId(infoParaCalcular, verifyCartaFiancaExists) {
        return await this.calcularCartaFianca_regra_new(
            infoParaCalcular?.valoresCartaFiancaStart?.newInfoAnalise,
            infoParaCalcular?.valoresCartaFiancaStart?.paramentroAnalise,
            infoParaCalcular?.valoresCartaFiancaStart?.ultimaTaxaCadastrada
        );
        if (verifyCartaFiancaExists?.parametrosAnaliseId !== null) {
            return await this.calcularCartaFianca_regra_new(
                infoParaCalcular?.valoresCartaFiancaStart?.newInfoAnalise,
                infoParaCalcular?.valoresCartaFiancaStart?.paramentroAnalise,
                infoParaCalcular?.valoresCartaFiancaStart?.ultimaTaxaCadastrada
            );
        } else {
            return await this.calcularCartaFianca_regra(infoParaCalcular?.valoresCartaFianca?.newInfoAnalise, infoParaCalcular?.valoresCartaFianca?.taxas);
        }
    }

    static async verificarSeECnpjEnviarParaAnaliseManual(newCartafianca, token) {
        function removerCaracteresEspeciaisEEspacos(str = String()) {
            if (typeof str !== "string") return "";

            return str.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s/g, "");
        }

        if (String(removerCaracteresEspeciaisEEspacos(newCartafianca.cpf || "")).length > 12) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ deve ser feita manualmente (locatário)!"});
            await onda_followup.postFollowup({token: token, cod: `TLI-${newCartafianca?.contrato}`, event: "🤖 *Análise de CNPJ será feita manualmente (locatário) ⚠️"});
            return true;
        } else if (String(removerCaracteresEspeciaisEEspacos(newCartafianca.cpfcoparticipante1 || "")).length > 12) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ devem ser feitas manualmente (Copart1)!"});
            await onda_followup.postFollowup({token: token, cod: `TLI-${newCartafianca?.contrato}`, event: "🤖 *Análise de CNPJ será feitas manualmente (Coparticipante 1) ⚠️"});
            return true;
        } else if (String(removerCaracteresEspeciaisEEspacos(newCartafianca.cpfcoparticipante2 || "")).length > 12) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ devem ser feitas manualmente (Copart2)!"});
            await onda_followup.postFollowup({token: token, cod: `TLI-${newCartafianca?.contrato}`, event: "🤖 *Análise de CNPJ será feitas manualmente (Coparticipante 2) ⚠️"});
            return true;
        } else {
            return false;
        }
    }

    static async verificarValorCartaFiancaParaEvitarConsultaCpfApi(newCartafianca, token) {
        if (Number(newCartafianca.valorvista) >= 10000) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análise acima de 10k precisa ser feita manualmente!"});
            await onda_followup.postFollowup({token: token, cod: `TLI-${newCartafianca?.contrato}`, event: "🤖 *Análise acima de R$ 10.000,00 será feita manualmente ⚠️"});
            return true;
        } else {
            return false;
        }
    }

    static verificar_se_renovacao_para_adicionar_taxas_fixas({infoAnalise, paramentroAnalise}) {
        if (infoAnalise?.tipoAnalise == "renovacao") {
            return paramentroAnalise.onda_config_valores_adicionais.map((item) => ({
                ...item,
                ativo: false,
            }));
        } else {
            return infoAnalise?.taxas;
        }
    }

    verificarSePagamentoCartaoDeCreditoTemMaisQueUmaParcela() {
        // if (this.infoAnalise.cartafiancaTipoPagamento == 2) {
        //     // Verifica se o novo valor é maior que o antigo (bloqueia aumento)
        //     if (this.infoAnalise.cartafiancaParcela > this.cartaFianca.parcelas) {
        //         return setResponse.WARNING({message: "Não é permitido aumentar o número de parcelas no cartão de crédito!"});
        //     }
        //     // Verifica se o novo valor excede 1, mas só bloqueia se não for uma diminuição
        //     if (this.infoAnalise.cartafiancaParcela > 1 && this.infoAnalise.cartafiancaParcela >= this.cartaFianca.parcelas) {
        //         return setResponse.WARNING({message: "A quantidade de parcelas permitidas para o cartão de crédito é 1x!"});
        //     }
        //     // Se chegou aqui, o valor é válido (diminuiu ou é <= 1)
        // }
        // 1	boleto
        // 2	cartão de crédito
        // 3	Não informado
        // 4	pix
        // 5	recorrente
        // 6	de entrada +  parcelas sem juros no boleto
        // 7	de entrada +  parcelas sem juros no cartão de crédito
    }

    travarQuanditadeDeParcelas({infoAnalise, cf}) {
        if (infoAnalise.cartafiancaParcela == 0 || infoAnalise.cartafiancaParcela == null || !infoAnalise.cartafiancaParcela)
            return setResponse.WARNING({message: "A quantidade minima é de 1 parcela"});
        switch (infoAnalise?.cartafiancaTipoPagamento) {
            case 6:
                if (infoAnalise?.cartafiancaTipoPagamento != cf?.tipopagamentoID && infoAnalise?.cartafiancaParcela > 6) {
                    infoAnalise.cartafiancaParcela = 6;
                    return infoAnalise;
                } else if (infoAnalise?.cartafiancaTipoPagamento == cf?.tipopagamentoID && infoAnalise?.cartafiancaParcela > 6) {
                    return setResponse.WARNING({message: "O limite para essa opção de pagamento é de apenas 6x"});
                }
                return infoAnalise;

            case 8:
                if (infoAnalise?.cartafiancaTipoPagamento != cf?.tipopagamentoID && infoAnalise?.cartafiancaParcela > 11) {
                    infoAnalise.cartafiancaParcela = 11;
                    return infoAnalise;
                } else if (infoAnalise?.cartafiancaTipoPagamento == cf?.tipopagamentoID && infoAnalise?.cartafiancaParcela > 11) {
                    return setResponse.WARNING({message: "O limite para essa opção de pagamento é de apenas 11x"});
                }
                return infoAnalise;

            case 2:
            case 4:
                if (infoAnalise?.cartafiancaTipoPagamento != cf?.tipopagamentoID && infoAnalise?.cartafiancaParcela > 1) {
                    infoAnalise.cartafiancaParcela = 1;
                    return infoAnalise;
                } else if (infoAnalise?.cartafiancaTipoPagamento == cf?.tipopagamentoID && infoAnalise?.cartafiancaParcela > 1) {
                    return setResponse.WARNING({message: "O limite para essa opção de pagamento é de apenas 1x"});
                }

            default:
                return infoAnalise;
        }
    }

    static async verificarSeAPlataformaEAsaasEBloquearAtualizacao(id, res) {
        const pay = await servicesFinanceiroQuery.getOneNotResView({id: id});

        if (!pay || pay?.payPlatform == 15) {
            return setResponse.WARNING({message: "Somente é possivel excluir pagamentos registrados no Asaas dentro da plataforma Asaas."});
        }

        return;
    }

    static async verificarSeAPlataformaEAsaasEBloquearDelecao(id, res) {
        const pay = await servicesFinanceiroQuery.getOneNotResView({id: id});
        //	512	pagamento cancelado	financeiro
        if (pay?.payStatus == 512) return;

        if (!pay || pay?.payPlatform == 15) {
            return setResponse.WARNING({message: "Somente é possivel excluir pagamentos registrados no Asaas dentro da plataforma Asaas."});
        }

        return;
    }

    static async verificarExistenciaCobrancasemAberto(cod) {
        if (!cod) {
            return setResponse.WARNING({message: "Código da Carta Fiança não fornecido"});
        }
        const query = `
         SELECT *
         FROM VW_SINISTRO_COBRANCA
         WHERE contrato = '${cod}'
         AND sinistroCobrancaStatusId IN (1108, 1107, 1106,1100);
        `;
        const contas = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobrancas!"});
        });

        return contas || [];
    }

    static async verificarExistenciaSinistrosemAberto(cod) {
        if (!cod) {
            return setResponse.WARNING({message: "Código da Carta Fiança não fornecido"});
        }
        const query = `
         SELECT *
            FROM VW_SINISTRO_GERAL
            WHERE sinistroContrato = '${cod}'
         AND sinistroStatusSinistro NOT IN (605, 606, 608, 614);
        `;
        const contas = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar sinistros!"});
        });

        return contas || [];
    }

    static async verificarExistenciaParcelasCartaFiancaVencidas(cod) {
        if (!cod) {
            return setResponse.WARNING({message: "Código da Carta Fiança não fornecido"});
        }

        const query = `
        SELECT *
        FROM VW_PAY
        WHERE payContrato = '${cod}'
        AND payTipoContaId = 241
        AND payStatus = 513;
    `;

        const parcelas = await executarQuery(query).catch((err) => {
            console.log(err);
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar parcelas!"});
        });

        return parcelas || [];
    }

    static async verificarCobrancasEParcelasCartaFianca({cobrancas, parcelasVencidas, codCartaFiancaAnterior, codCartafiancaNova}) {
        if (cobrancas?.length > 0 || parcelasVencidas?.length > 0) {
            await onda_cartafianca.atualizarStatus(110, codCartafiancaNova);
            await onda_followup.postFollowup({
                cod: codCartaFiancaAnterior,
                event: `Renovação solicitada reprovada devido à existência de pendências de cobranças ❌.`,
            });
            await onda_followup.postFollowup({
                cod: codCartafiancaNova,
                event: `Renovação solicitada reprovada devido à existência de pendências de cobranças ❌.`,
            });
            await onda_followup.postFollowup({
                cod: `TLI-${codCartaFiancaAnterior}`,
                event: `🤖 *Renovação reprovada devido à existência de pendências de cobranças ❌`,
            });
            await onda_followup.postFollowup({
                cod: `TLI-${codCartafiancaNova}`,
                event: `🤖 *Renovação reprovada devido à existência de pendências de cobranças ❌`,
            });

            return setResponse.WARNING({message: "Análise reprovada, devido a pendências financeiras no contrato atual. ❌"});
        }
    }

    static async verificarSeAnaliseFinanceiroFoiFeitaEnviarParaAnaliseManual({consulta, cartaFianca}) {
        if (consulta && Object.keys(consulta).length == 0) {
            await onda_cartafianca.atualizarStatus(116, cartaFianca?.contrato);

            await onda_followup.postFollowup({cod: cartaFianca?.contrato, event: "❌Servidor da cebraco na análise financeira está respondendo com erros!"});

            return setResponse.WARNING({message: "Serviços de cartórios e consultas de dados fora do ar, por gentileza tente mais tarde!"});
        }
    }

    static async verificaExistenciaSinistrosParaEncerramentoContrato({cod}) {
        if (!cod) {
            return setResponse.WARNING({
                message: "Código do contrato não informado para verificação de sinistro do contrato a ser encerrado.",
            });
        }
        const sinistros = await onda_sinistro.buscarSinistroPeloContrato({codContrato: cod});
        const unavailableSinistros = sinistros.length > 0;
        return {refund: !unavailableSinistros, sinistros};
    }

    static async verificaRegrasdeDistrato(dados) {
        const cod = dados.matrixContrato;
        const contrato = await servicesAnaliseQuery.buscarContratoViewPelaMatrix({cod});
        const parcelas = await servicesFinanceiroQuery.buscarParcelasDaCartafiancaPorContrato({cod});
        let totalPago = 0;
        let totalRestante = 0;
        parcelas.map((item) => {
            if (item.onda_pay_status == 506) {
                totalPago += Number(item.onda_pay_valorparcelas);
            } else {
                totalRestante += Number(item.onda_pay_valorparcelas);
            }
        });

        if (parcelas.length == 0) {
            return 0;
        }
        // const valorTotal = parcelas[0].onda_pay_tipopagamento == 1 ? contrato?.onda_cartafianca_valoraprazo : contrato?.onda_cartafianca_valoravista;
        const valorTotal = contrato?.valorCartaFianca;

        const calculaMesesUsados = () => {
            const dataInicioContrato = contrato?.dataPagamento;
            const dataAtual = new Date();
            const anos = dataAtual.getFullYear() - dataInicioContrato.getFullYear();
            const meses = dataAtual.getMonth() - dataInicioContrato.getMonth();
            const totalMeses = anos * 12 + meses;
            return totalMeses <= 0 ? 1 : totalMeses + 1;
        };
        const totalMeses = calculaMesesUsados();
        const valorReferenciaMes = valorTotal / 12;
        const valorRequisitadoPelosMesesUsados = valorReferenciaMes * totalMeses;
        const multa = (valorTotal - valorReferenciaMes * totalMeses) * 0.2;
        const totalADevolver = (totalPago - valorRequisitadoPelosMesesUsados - multa).toFixed(2);

        // console.log("SALDO", valorTotal - valorReferenciaMes * totalMeses)
        // console.log("totalMeses", totalMeses)
        // console.log("valorRequisitadoPelosMesesUsados", valorRequisitadoPelosMesesUsados)
        // console.log("multa", multa)

        // console.log("valorTotal", valorTotal)
        // console.log("totalADevolver", totalADevolver)
        // console.log("totalPago", totalPago)
        // console.log("totalRestante", totalRestante)
        return totalADevolver;
    }
    static async verificaRegrasdeEstorno(dados) {
        const cod = dados.matrixContrato;
        const parcelas = await servicesFinanceiroQuery.buscarParcelasDaCartafiancaPorContrato({cod});
        const contrato = await servicesAnaliseQuery.buscarContratoPelaMatrix({cod});

        let totalPago = 0;

        parcelas.map((item) => {
            if (item.onda_pay_status == 506) {
                totalPago += Number(item.onda_pay_valorparcelas);
            }
        });
        const adesao = contrato?.onda_cartafianca_valoradesao;
        return totalPago - adesao;
    }

    static async gerarCobrancaEncerramentoContrato({distrato, valor, conta, contrato, matrix, token}) {
        const gerarDataVencimento = () => {
            const hoje = new Date();
            const diasParaSomar = distrato ? 30 : 7;
            const novaData = new Date(hoje);
            novaData.setDate(hoje.getDate() + diasParaSomar);
            return novaData;
        };
        const chavesEstrangeiras = {
            onda_conta_contrato_id: contrato.onda_cartafianca_id,
        };

        const observação = `Valor referente ao encerramento contratual, conforme acordo entre as partes, destinado à quitação das obrigações previstas no encerramento do Contrato ${
            contrato.onda_cartafianca_contrato
        }, caracterizado como ${distrato ? "DISTRTO" : "ESTORNO"}, conforme o caso.`;

        const newConta = {
            contaGestor: 60,
            contaCategoria: distrato ? 176 : 177,
            contaCentroCusto: 106,
            contaVencimento: gerarDataVencimento(),
            contaValor: Number(valor),
            contaAcrescimos: 0,
            contaParcela: 1,
            contaStatus: 1400,
            contaFormaPagamento: 173,
            contaRecebedor: 203,
            contaObservacoes: observação,
            contaRecorrenteBoleano: 0,
            contaContaRecebedor: conta,
        };

        await onda_contas.postConta({token, matrix: contrato.onda_cartafianca_contrato, chavesEstrangeiras, conta: newConta});
    }

    static async gerarFormularioEncerramentoContrato({locatario, imobiliaria, codContrato, datas, sign = true, valor = null}) {
        const contrato = await servicesAnaliseQuery.buscarContratoViewPelaMatrix({cod: codContrato});
        const dataContrato = {
            chaveTransferencia: datas?.chaveTransferencia,
            contrato,
            locatario,
            imobiliaria,
        };
        const htmlGenerator = datas?.distrato ? encerramentoContratoDistratoModal : encerramentoContratoEstornoModal;
        const html = await htmlGenerator.gerarContrato({
            ...dataContrato,
            dados: {
                dataEntradaImovel: datas.dataEntrada,
                dataEntreChaves: datas.dataDistrato,
                dataCancelamento: datas.dataCancelamentoFianca,
                motivoDistrato: datas.motivoDistrato,
                valor: valor,
            },
            assinado: sign,
        });
        const nomeContrato = datas?.distrato ? "formularioDistrato" : "formularioEstorno";

        const [formData, pdfBuffer] = await htmlGenerator.gerarPdf(html, nomeContrato, datas.distrato ? 1201 : 1202);

        return [formData, pdfBuffer];
    }

    static async gerarFormularioEncerramentoContratoPeloRegistro({registroId, sign = true}) {
        const registroEncerramento = await onda_cartafianca_encerramento.getOneById({id: registroId});
        if (!registroEncerramento) {
            return;
        }
        const {valorTotal, chaveTransferencia, motivo, dataCancelamentoFianca, tipoEncerramento, dataEntregaChaves, dataEntradaImovel} = registroEncerramento;
        const contrato = await servicesAnaliseQuery.buscarContratoViewPelaMatrix({cod: registroEncerramento?.contrato});
        const locatario = await onda_locatario.getOneNotRes(registroEncerramento?.locatario);
        const imobiliaria = await onda_imob.getOneNotRes(registroEncerramento?.imobiliaria);

        const dataContrato = {
            chaveTransferencia,
            contrato,
            locatario: locatario.dataValues,
            imobiliaria: imobiliaria.dataValues,
        };
        const tipoDistrato = 701;
        const eDistrato = tipoEncerramento == tipoDistrato;
        const htmlGenerator = eDistrato ? encerramentoContratoDistratoModal : encerramentoContratoEstornoModal;
        const tipoFormulario = eDistrato ? 1201 : 1202;
        const nomeContrato = eDistrato ? "formularioDistrato" : "formularioEstorno";
        const dados = {
            dataEntradaImovel,
            dataEntreChaves: dataEntregaChaves,
            dataCancelamento: dataCancelamentoFianca,
            motivoDistrato: motivo,
            valor: parseFloat(valorTotal) > 0 ? parseFloat(valorTotal) : 0,
        };
        const html = await htmlGenerator.gerarContrato({
            ...dataContrato,
            dados,
            assinado: sign,
        });
        const [formData, pdfBuffer] = await htmlGenerator.gerarPdf(html, nomeContrato, tipoFormulario);
        return [formData, pdfBuffer];
    }

    static async verificarPermissaoEncerramentoContrato({contrato, sinistros = [], dados}) {
        if ([334, 333, 331, 332].includes(contrato.onda_cartafianca_status_comercial)) {
            return setResponse.WARNING({
                message: "Contrato já encerrado, não é possível realizar a operação novamento.",
            });
        }

        if (sinistros.some((item) => [601, 602, 603, 604].includes(item.sinistroStatusSinistro)) && dados.distrato == false) {
            return setResponse.WARNING({
                message: "Solicitação não autorizada, devido a existencia de cobranças em aberto.",
            });
        }
    }

    static async verificarPermissaoRenovacao({contrato}) {
        if ([334, 333, 331, 332].includes(contrato.onda_cartafianca_status_comercial)) {
            return setResponse.WARNING({
                message: "Contrato já encerrado, não é possível realizar a operação.",
            });
        }
    }

    static async verificarDataLimiteParaEstorno({dateContrato}) {
        if (dateContrato == null) {
            return true;
        }
        const duracaoLimiteParaEstorno = 30;
        const dataBase = new Date(dateContrato);
        const dataHoje = new Date();
        const dataLimite = new Date(dataBase);
        dataLimite.setDate(dataBase.getDate() + duracaoLimiteParaEstorno);
        return dataHoje <= dataLimite;
    }

    static verificaRegraValidaParaEncerramento({distrato, estornoPermitido}) {
        const regradeEncerramento = distrato ? this.verificaRegrasdeDistrato : estornoPermitido ? this.verificaRegrasdeEstorno : this.verificaRegrasdeDistrato;
        return regradeEncerramento;
    }

    static async executaEncerramentoContratoComOnus({contrato, data, token, valor}) {
        const cod = contrato?.onda_cartafianca_contrato;
        try {
            if (valor <= 0) {
                return await onda_followup.postFollowup({
                    cod: cod,
                    event: `Conforme acordo firmado entre as partes e não havendo registros de sinistros vinculados ao Contrato ${cod}, o presente encerramento contratual é passível de devolução de valores. Contudo, não há valores a serem estornados.`,
                });
            }

            await this.gerarCobrancaEncerramentoContrato({
                distrato: data?.distrato,
                contrato: contrato,
                valor,
                token,
                conta: data?.contaBancaria,
                matrix: data?.matrixLocatario,
            });
            await onda_followup.postFollowup({
                cod: cod,
                event: `Conforme acordo firmado entre as partes e não havendo registros de sinistros vinculados ao Contrato ${cod}, o presente encerramento contratual é passível de devolução de valores, sendo realizada a restituição proporcional conforme previsto nas cláusulas contratuais.`,
            });
        } catch (error) {
            setResponse.WARNING({
                message: `Erro ao tentar gerar cobrança de encerramento de contrato ou registrar follow-up para o contrato ${cod}.`,
            });
        }
    }
    static async executaEncerramentoContratoSemOnus({contrato}) {
        const cod = contrato?.onda_cartafianca_contrato;
        try {
            await onda_followup.postFollowup({
                cod: cod,
                event: `Conforme acordo firmado entre as partes, nenhum valor será devolvido referente Contrato ${cod}, ficando o encerramento contratual condicionada à quitação das obrigações pendentes sem restituição de valores.`,
            });
        } catch (error) {
            setResponse.WARNING({
                message: `Erro ao tentar registrar follow-up de encerramento de contrato para o contrato ${cod}.`,
            });
        }
    }
    static async executaExoneracaoContrato({cod, token}) {
        try {
            if (!cod) {
                setResponse.WARNING({
                    message: "Código do contrato não informado.",
                });
            }
            const contrato = await onda_cartafianca.getOneNotResView(cod);
            // await servicesAnaliseEmail.notificarImobiliráriaExoneracaodeContrato({contrato});
            // await servicesAnaliseEmail.notificarLocatarioExoneracaodeContrato({contrato});
            // 336 => status encerrado - exonerado
            // 1700 => status inicial exoneração
            await onda_cartafianca.atualizarStatusExoneracao({status: token ? 336 : 338, cod});
            const data = {
                referencia: cod,
                codigo: gerarCondigoSetores("EXO"),
                status: token ? 1700 : 1706,
                deletado: 0,
                imobiliaria: contrato?.imobCodigo,
                locatario: contrato?.locatarioCodigo,
                imobNome: contrato?.imobiliaria,
                locatarioNome: contrato?.locatario,
                userCriacao: token?.codigo || "SISTEMA",
                userCriacaoNome: token?.nome || "SISTEMA",
                statusOrigem: contrato?.statusComercialCod,
            };
            await onda_cartafianca_exoneracao.createNotRes({data});
        } catch (error) {
            setResponse.WARNING({
                message: `Falha ao tentar executar exoneração da carta fiança ${cod}`,
            });
        }
    }

    static async executaConfirmacaoExoneracao({ exoneracao = {}, token = {} }) {
        try {
            if (!exoneracao) {
                setResponse.WARNING({
                    message: "Código de exoneração não informado.",
                });
            }
            const contrato = await onda_cartafianca.getOneNotResView(exoneracao?.referencia);
            await onda_cartafianca.atualizarStatusExoneracao({ status: 336, cod: exoneracao?.referencia });
            await servicesAnaliseEmail.notificarImobiliráriaExoneracaodeContrato({ contrato });
            await servicesAnaliseEmail.notificarLocatarioExoneracaodeContrato({ contrato });
            await onda_cartafianca_exoneracao.update({
                status: 1700,
                userCriacao: token?.codigo,
                userCriacaoNome: token?.nome,
            },
                exoneracao?.codigo
            )

        } catch (error) {
            setResponse.WARNING({
                message: `Falha ao tentar executar confirmação da exoneração da carta fiança ${cod}`,
            });
        }
    }

    static async buscarSinistrosTipoAluguelInadimplentes() {
        // Regra: cobrança de sinistro do tipo aluguel com inadimplência superior a 20 dias
        const periodoLimiteRegraSinistroInadimplente = 20;

        // 1108 => status de inadimplência de uma cobrança
        // 1400 => status de "aguardando pagamento"
        const query = `
            SELECT *
            FROM onda_sinistro_cobranca
            WHERE onda_sinistro_cobranca_status = 1108
            AND onda_sinistro_cobranca_conta_sinistro_status_pagamento = 1400  
            AND DATEDIFF(CURDATE(), onda_sinistro_cobranca_conta_sinistro_vencimento) > ${periodoLimiteRegraSinistroInadimplente};
        `;

        const cobrancas = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar sinistros com inadimplência."});
        });

        if (!Array.isArray(cobrancas) || cobrancas.length === 0) {
            return [];
        }

        const matrixSinistros = cobrancas.map((item) => item.onda_sinistro_cobranca_matrix);

        const codigos = matrixSinistros.map(() => "?").join(", ");
        const query3 = `
            SELECT
                onda_sinistro_contrato,
                onda_sinistro_codigo
            FROM onda_sinistro WHERE
            onda_sinistro_codigo in (${codigos})
        `;

        const contratosReferencia = await executarQuery(query3, matrixSinistros).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar itens do tipo aluguel dos sinistros inadimplentes."});
        });

        const hashContratos = {};

        contratosReferencia.map((item) => {
            hashContratos[item?.onda_sinistro_codigo] = item?.onda_sinistro_contrato;
        });
        // Filtra as cobranças que contêm itens do tipo aluguel

        const placeholders = matrixSinistros.map(() => "?").join(", ");

        // 230 => tipo de item "Aluguel"
        // 1501 => status "Aprovado" para o item
        const query2 = `
            SELECT *
            FROM onda_sinistro_item
            WHERE onda_sinistro_helpers_item_grupo_id = 230
            AND onda_sinistro_item_status_id = 1501
            AND onda_sinistro_item_matrix IN (${placeholders});
        `;

        const itensInadimplentes = await executarQuery(query2, matrixSinistros).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar itens do tipo aluguel dos sinistros inadimplentes."});
        });

        if (!Array.isArray(itensInadimplentes) || itensInadimplentes.length === 0) {
            return [];
        }

        const contagemPorMatrix = itensInadimplentes.reduce((acc, item) => {
            const cod = hashContratos[item.onda_sinistro_item_matrix];
            acc[cod] = (acc[cod] || 0) + 1;
            return acc;
        }, {});

        const QUANTIDADE_MINIMA = 2;
        const sinistrosCapturados = Object.entries(contagemPorMatrix)
            .filter(([_, count]) => count >= QUANTIDADE_MINIMA)
            .map(([cod]) => cod);

        if (sinistrosCapturados.length === 0) {
            return [];
        }
        return sinistrosCapturados;
        // return await this.buscarContratosPeloSinistro({sinistros: sinistrosCapturados});
    }

    static async buscarContasConsolidadasVencidas() {
        const query = `
            SELECT *
            FROM onda_sinistro_cobranca
            WHERE onda_sinistro_cobranca_pagamento_conjunto IS NOT NULL
        `;
        //  AND DATEDIFF(CURDATE(), onda_sinistro_cobranca_conta_sinistro_vencimento) >= ${periodoLimiteVencimento};

        const sinistros = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças consolidadas inadimplentes."});
        });
        if (sinistros.length == 0) {
            return [];
        }
        const sinistrosCods = sinistros.map((item) => item.onda_sinistro_cobranca_cod);

        const cods = sinistrosCods.map(() => "?").join(", ");
        const PRAZO_MAX_VENCIMENTO = 3;
        const query2 = ` 
            SELECT *
            FROM onda_pay
            WHERE DATEDIFF(CURDATE(), onda_pay_datavencimento) > ${PRAZO_MAX_VENCIMENTO}
            AND onda_pay_cod_cobranca IN (${cods});
        `;

        const parcelas = await executarQuery(query2, sinistrosCods).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar parcelas das cobranças consolidadas inadimplentes."});
        });

        if (!Array.isArray(parcelas) || parcelas.length === 0) {
            return [];
        }

        const contagemPorCobranca = parcelas.reduce((acc, parcela) => {
            const cod = parcela.onda_pay_contrato;
            acc[cod] = (acc[cod] || 0) + 1;
            return acc;
        }, {});

        const NUMERO_MINIMO_PARCELAS = 1;
        const cobrancasCapturadas = Object.entries(contagemPorCobranca)
            .filter(([_, count]) => count >= NUMERO_MINIMO_PARCELAS)
            .map(([cod]) => cod);

        if (cobrancasCapturadas.length === 0) {
            return [];
        }

        return cobrancasCapturadas;
        // return await this.buscarContratosPeloSinistro({sinistros: cobrancasCapturadas});
    }

    static async buscarParcelasCartafiancasVencidas() {
        const pagamentos = await servicesFinanceiroQuery.buscarParcelasDaCartafianca();
        if (pagamentos.length == 0) {
            return [];
        }
        const contagemStatus = {};
        const contratos = new Set();
        const QUANTIDADE_MINIMA_PARCELAS_VENCIDAS = 4;
        pagamentos.forEach((pay) => {
            const contrato = pay.onda_pay_contrato;
            if (pay.onda_pay_status === 513) {
                contagemStatus[contrato] = (contagemStatus[contrato] || 0) + 1;
            }
            if (contagemStatus[contrato] >= QUANTIDADE_MINIMA_PARCELAS_VENCIDAS) {
                contratos.add(contrato);
            }
        });

        return [...contratos];
    }

    static async buscarContratosPeloSinistro({sinistros = []}) {
        const cods2 = sinistros.map(() => "?").join(", ");
        // 606 => status sinistro encerrado com ônus
        const query3 = `
            SELECT onda_sinistro_contrato FROM
            onda_sinistro WHERE
            onda_sinistro_status_sinistro = 606
            AND onda_sinistro_codigo in (${cods2}) 
        `;
        const contratos = await executarQuery(query3, sinistros).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar código do contrato dos sinistros itens inadimplentes."});
        });

        return contratos.map((contrato) => contrato.onda_sinistro_contrato);
    }

    static async servicoVerificacaoExoneracaoAutomatica() {
        const sinistrosInadimplentes = await this.buscarSinistrosTipoAluguelInadimplentes();
        const contasVencidas = await this.buscarContasConsolidadasVencidas();
        const parcelasVencidas = await this.buscarParcelasCartafiancasVencidas();

        const hashContratos = {};
        const contratos = new Set();

        const processMessages = (array = [], message = "") => {
            const processed = {};
            array.forEach((item) => {
                hashContratos[item] = processed[item] ? hashContratos[item] : [...(hashContratos[item] || []), message];
                contratos.add(item);
                processed[item] = 1;
            });
        };
        processMessages(sinistrosInadimplentes, "Duas ou mais cobranças de sinistro do tipo aluguel com inadimplência superior a 20 dias");
        processMessages(contasVencidas, "Uma ou mais cobranças conjuntas vencidas");
        processMessages(parcelasVencidas, "Quatro ou mais parcelas da carta fiança vencidas");

        if (contratos.length == 0) {
            return [];
        }

        const CHUNK_SIZE = 10;
        const chunkArray = (array, size) => {
            const result = [];
            for (let i = 0; i < array.length; i += size) {
                result.push(array.slice(i, i + size));
            }
            return result;
        };
        const contratosFiltrados = await servicesAnaliseValidate.filtrarContratosValidosParaExoneracao([...contratos]);
        const chunkExonerados = chunkArray([...contratosFiltrados], CHUNK_SIZE);

        const gerarTextoFollowup = (codContrato) => {
            const motivos = hashContratos[codContrato] || [];
            const motivosFormatados = motivos.map((m, i) => `(${i + 1}) ${m}`).join("; ");

            return `Contrato exonerado automaticamente após análise das regras internas. Motivos identificados: ${motivosFormatados}.`;
        };

        const gerarTextoFollowupTLI = (codContrato) => {
            const motivos = hashContratos[codContrato] || [];
            const motivosFormatados = motivos.map((m, i) => `(${i + 1}) ${m}`).join("; ");

            return `🤖 *Contrato exonerado automaticamente após análise das regras internas. Motivos identificados: ${motivosFormatados} ❌`;
        };

        for (const chunk of chunkExonerados) {
            await Promise.all(chunk.map((item) => this.executaExoneracaoContrato({cod: item})));
            await Promise.all(chunk.map((item) => onda_followup.postFollowup({cod: item, event: gerarTextoFollowup(item)})));
            await Promise.all(chunk.map((item) => onda_followup.postFollowup({cod: `TLI-${item}`, event: gerarTextoFollowupTLI(item)})));
        }
        return contratosFiltrados;
    }
    static servicoVerificaNovoStatusExoneacao({exoneracao = {}, operacao}) {
        const statusAtual = exoneracao?.status;
        const statusExoneracaoContrato = {
            1700: "Exoneração iniciada",
            1701: "Contato com Locatário",
            1702: "Notificar despejo a imobiliária",
            1703: "Negociar saída com locatário",
            1704: "Ajuizamento da ação de despejo",
            1705: "Exoneração Finalizada",
        };
        const statuslist = Object.keys(statusExoneracaoContrato).map((item) => Number(item));
        const indexAtual = statuslist.indexOf(statusAtual);

        if (indexAtual === -1) {
            return setResponse.WARNING({message: "Status atual não encontrado na lista."});
        }
        const direcao = operacao === 1 ? 1 : -1;
        const novoIndex = indexAtual + direcao;
        if (novoIndex < 0 || novoIndex >= statuslist.length) {
            return setResponse.WARNING({message: "Não é possível avançar ou retroceder além dos limites."});
        }

        return {novoStatus: statuslist[novoIndex], legenda: statusExoneracaoContrato};
    }

    static servicoValidadeDesoneracao({exoneracao = {}}) {
        if (!exoneracao) {
            return setResponse.WARNING({
                message: "Exoneração não fornecida para consulta.",
            });
        }
        if (exoneracao.deletado == 1) {
            return setResponse.WARNING({
                message: "Exoneração já deletada.",
            });
        }
    }
    static async executarDesoneracaoContrato({exoneracao}) {
        if (!exoneracao) {
            return setResponse.WARNING({
                message: "Exoneração não fornecida para executar desoneração.",
            });
        }
        await onda_cartafianca_exoneracao.update(
            {
                deletado: 1,
            },
            exoneracao?.codigo
        );
        await onda_cartafianca.atualizarStatusExoneracao({status: exoneracao?.statusOrigem || 999, cod: exoneracao?.referencia});
    }

    static async validaConfirmacaoExoneracaoEmAnalise({ exoneracao = {}, }) {
        if (!exoneracao) {
            return setResponse.WARNING({
                message: "Exoneração não encontrada para confirmação.",
            });
        }
        if (![1706].includes(exoneracao?.status)) {
            return setResponse.WARNING({
                message: "Exoneração não esta em status de análise.",
            });
        }
        if (exoneracao?.deletado == 1) {
            return setResponse.WARNING({
                message: "Exoneração já cancelada, não é possivel confirmar a exoneração.",
            });
        }
    }
};

export default servicesAnaliseRegras;
