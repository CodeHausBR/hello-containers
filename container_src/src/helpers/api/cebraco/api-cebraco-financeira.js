//BIBLIOTECAS
import dotenv from "dotenv";
dotenv.config();
//HELPERS
import setResponse from "../../response/setResponse.js";
import utilsFormatar from "../../../mvc/utils/formatar/formatar.js";
//BANCO DE DADOS
import onda_cartafianca from "../../../mvc/models/analise/onda_cartafianca.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";
import onda_followup from "../../../mvc/models/public/onda_followup.js";
import onda_cebraco_financeiro_113 from "../../../mvc/models/mongoose/onda_cebraco_financeiro_113.js";
//SERVICES

const apiCebracoFinanceira = class apiCebracoFinanceira {
    static async controller({cartaFianca, token, bearerToken, valoresCartaFianca}) {
        const locatario = new Object({
            idCartafianca: cartaFianca?.id,
            cpf: utilsFormatar.removerCaracteresEspeciaisEEspacos(cartaFianca?.cpf),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.locatario,
            contrato: cartaFianca?.contrato,
            tipo: "Locatário",
            bearerToken: bearerToken,
            token: token,
        });

        const coparticipante1 = {
            idCartafianca: cartaFianca?.id,
            cpf: utilsFormatar.removerCaracteresEspeciaisEEspacos(cartaFianca?.cpfcoparticipante1),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.coparticipante1,
            contrato: cartaFianca?.contrato,
            tipo: "Coparticipante 1",
            bearerToken: bearerToken,
            token: token,
        };

        const coparticipante2 = {
            idCartafianca: cartaFianca?.id,
            cpf: utilsFormatar.removerCaracteresEspeciaisEEspacos(cartaFianca?.locatarioCopart2cpf),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.locatarioCopart2,
            contrato: cartaFianca?.contrato,
            tipo: "Coparticipante 2",
            bearerToken: bearerToken,
            token: token,
        };

        //PASSA POR ESSA FUNÇÃO FAZ A ANÁLISE JURIDICA E REPROVA OU MANDA PARA A PROXIMA CONSULTA
        if (locatario?.cpf) {
            return await apiCebracoFinanceira.start({pesquisado: locatario, valoresCartaFianca: valoresCartaFianca});
        }
    }

    static async start({pesquisado, valoresCartaFianca}) {
        const consulta = await apiCebracoFinanceira.consultaFinanceiraPeloCpf({pesquisado: pesquisado});
        return {consulta, target: pesquisado};

        // DESACOPLADO DA API PROCOB
        // FUNÇÃO PARA SEPARAR AS DIVIDAS E RETORNAR UM OBJETO COM A RESPOSTA DE REPROVADO OU APROVADO
        // const resultado = await apiCebracoFinanceira.separarDividasParaAprovarOuReprovarRetornarPlanos({
        //     pesquisado: pesquisado,
        //     consulta: consulta,
        //     valoresCartaFianca: valoresCartaFianca,
        // });
        // // FUNÇÃO PARA ATUALIZAR O STATUS NA CARTAFIANÇA E GERAR FOLLOW NESSE CONTRATO
        // await apiCebracoFinanceira.atualizarStatusCartaFiancaGerarFollow({pesquisado: pesquisado, resultado: resultado});

        // return resultado;
    }

    /**
     *
     * @deprecated
     */
    static async recalcularPlanos({pesquisado, valoresCartaFianca, valorAluguel}) {
        // const consulta = await apiCebracoFinanceira.consultaFinanceiraPeloCpf({pesquisado: pesquisado});

        // const floatDivida = parseFloat(String(consulta?.pefin.resultado?.valor_total).replace(".", "").replace(",", "."));
        // const planosLiberados = [];
        const onda_config_limite_de_divida_por_plano = Reflect.get(valoresCartaFianca, "planosCalculados", Array());

        // let virificar_se_planos_estao_cadastrados_no_banco_dados = false;
        // let verificar_se_divida_pasou_em_algum_plano = false;

        // for (const plano of onda_config_limite_de_divida_por_plano) {
        //     virificar_se_planos_estao_cadastrados_no_banco_dados = true;
        //     const targetDivida = floatDivida;
        //     let planoAprovado = true;

        //     const {range_divida, range_aluguel} = plano;

        //     if (range_divida.ativo) {
        //         const {max, min} = range_divida;
        //         planoAprovado = Number(max) - Number(targetDivida) >= 0 && Number(targetDivida) - Number(min) >= 0;
        //     }

        //     if (range_aluguel.ativo) {
        //         const {max, min} = range_aluguel;
        //         planoAprovado = Number(max) - Number(valorAluguel) >= 0 && Number(valorAluguel) - Number(min) >= 0 && planoAprovado;
        //     }

        //     if (planoAprovado) {
        //         verificar_se_divida_pasou_em_algum_plano = true;
        //         planosLiberados.push(plano);
        //     }
        // }

        return onda_config_limite_de_divida_por_plano;
    }

    static async consultaFinanceiraPeloCpf({pesquisado}) {
        const dadosValidados = await utilsFormatar.validarCpfCnpj(pesquisado?.cpf);

        const newCpfCnpj = dadosValidados?.cpfCnpj;

        const retornarHistoricoBanco = await onda_cebraco_financeiro_113.getOne({documento: newCpfCnpj});

        if (retornarHistoricoBanco) {
            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Consulta financeira feita no banco de dados interno, economia de R$ 6,00 💸`});

            return retornarHistoricoBanco;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            //cod: 113,
            cod: 121,
            //cod: 120,
            //cod: 27,
            documento: String(newCpfCnpj),
            //uf: "SC",
            credencial: process.env.SECRET_CEBRACO_CREDENCIAL,
            login: process.env.SECRET_CEBRACO_LOGIN,
            senha: process.env.SECRET_CEBRACO_SENHA,
        });

        const data = await fetch("https://cebraco.com.br/WebService/Consulta", {
            method: "POST",
            headers: myHeaders,
            body: raw,
        });

        const jsonData = await data.json();

        const resultCebraco = converterParaMinusculo(jsonData);

        function converterParaMinusculo(obj) {
            if (typeof obj !== "object" || obj === null) {
                return typeof obj === "string" ? obj.toLowerCase() : obj;
            }

            if (Array.isArray(obj)) {
                return obj.map((item) => converterParaMinusculo(item));
            }

            return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.toLowerCase(), converterParaMinusculo(value)]));
        }

        if (resultCebraco?.identifica?.dados?.doc?.length > 0) {
            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Consulta financeira feita na API CEBRACO R$ - 6,00 🥹`});
            await onda_cebraco_financeiro_113.post({data: resultCebraco, cpfCnpj: newCpfCnpj});
        } else {
            await onda_errors.postNotRes({
                classe: "apiCebracoFinanceira",
                statico: "consultaFinanceiraPeloCpf",
                message: JSON.stringify({...resultCebraco, documento: String(newCpfCnpj), consulta: 113})?.slice(0, 4900),
            });

            return {};
        }

        return await onda_cebraco_financeiro_113.getOne({documento: newCpfCnpj});
    }

    static async CpfconsultaApi({cpf}) {
        const dadosValidados = await utilsFormatar.validarCpfCnpj(cpf);

        const newCpfCnpj = dadosValidados?.cpfCnpj;

        const retornarHistoricoBanco = await onda_cebraco_financeiro_113.getOne({documento: newCpfCnpj});

        if (retornarHistoricoBanco) {
            return retornarHistoricoBanco;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            cod: 27,
            documento: String(newCpfCnpj),
            uf: "SC",
            credencial: "7c8967bdf7b30b8faf9bb7bb81612409",
            login: "5003955.1",
            senha: "Ond@1a2b3cTCFVU#",
        });

        const data = await fetch("https://cebraco.com.br/WebService/Consulta", {
            method: "POST",
            headers: myHeaders,
            body: raw,
        });

        const jsonData = await data.json();

        const resultCebraco = converterParaMinusculo(jsonData);

        function converterParaMinusculo(obj) {
            if (typeof obj !== "object" || obj === null) {
                return typeof obj === "string" ? obj.toLowerCase() : obj;
            }

            if (Array.isArray(obj)) {
                return obj.map((item) => converterParaMinusculo(item));
            }

            return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.toLowerCase(), converterParaMinusculo(value)]));
        }

        if (String(resultCebraco?.identifica?.dados?.doc)?.length > 0) {
            await onda_cebraco_financeiro_113.post({data: resultCebraco, cpfCnpj: newCpfCnpj});
        }

        return await onda_cebraco_financeiro_113.getOne({documento: newCpfCnpj});
    }

    // static async separarDividasParaAprovarOuReprovarRetornarPlanos({pesquisado, consulta, valoresCartaFianca}) {
    //     const floatDivida = parseFloat(
    //         String(consulta?.pefin?.resultado?.valor_total || 0)
    //             .replace(".", "")
    //             .replace(",", ".")
    //     );

    //     const onda_config_limite_de_divida_por_plano = Reflect.get(valoresCartaFianca, "planosCalculados", Array());

    //     const planosLiberados = [];
    //     let virificar_se_planos_estao_cadastrados_no_banco_dados = false;
    //     let verificar_se_divida_pasou_em_algum_plano = false;

    //     for (const plano of onda_config_limite_de_divida_por_plano) {
    //         const targetDivida = floatDivida;

    //         virificar_se_planos_estao_cadastrados_no_banco_dados = true;
    //         const verificarLimiteDividaMaxima = Number(plano?.divida_max) - Number(targetDivida) >= 0 && Number(targetDivida) - Number(plano?.divida_min) >= 0;

    //         if (verificarLimiteDividaMaxima) {
    //             verificar_se_divida_pasou_em_algum_plano = true;
    //             planosLiberados.push(plano);
    //         }
    //     }

    //     if (virificar_se_planos_estao_cadastrados_no_banco_dados == false) {
    //         await onda_followup.postFollowup({
    //             cod: pesquisado?.contrato,
    //             event: `🤖 *Sem planos liberados na análise financeira, não foi possivel a imobiliária prosseguir na análise ⚠️`,
    //         });

    //         return setResponse.WARNING({message: "🤖 *Locatário não foi aprovado na análise ⚠️"});
    //     }

    //     if (verificar_se_divida_pasou_em_algum_plano == true) {
    //         const resultado = {
    //             messageFront: "🤖 Locatário aprovado na análise!",
    //             message: "🤖 *Locatário aprovado na análise financeira 🆗",
    //             status: 117, // 117	Aguardando seleção do plano no portal
    //             aprovado: true,
    //             planosLiberados: planosLiberados,
    //         };
    //         return resultado;
    //     } else {
    //         await onda_followup.postFollowup({
    //             cod: pesquisado?.contrato,
    //             event: `🤖 *Sem planos liberados na análise financeira, não foi possivel a imobiliária prosseguir na análise ⚠️`,
    //         });

    //         const resultado = {
    //             messageFront: "🤖 Locatário reprovado na análise!",
    //             message: `🤖 *Locatário reprovado na análise financeira ⚠️`,
    //             status: 109, // 109	reprovada
    //             aprovado: false,
    //             planosLiberados: planosLiberados,
    //         };
    //         return resultado;
    //     }
    // }

    static async atualizarStatusCartaFiancaGerarFollow({resultado, pesquisado}) {
        if (resultado?.aprovado == true) {
            await onda_cartafianca.atualizarStatus(resultado.status, pesquisado?.contrato);

            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: resultado?.message});
            await onda_followup.postFollowup({cod: `TLI-${pesquisado?.contrato}`, event: resultado?.messageTLI});

            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Aguardando seleção do plano no portal ⏳`});
            await onda_followup.postFollowup({cod: `TLI-${pesquisado?.contrato}`, event: `🤖 *Aguardando seleção do plano pela imobiliária ⏳`});
            return resultado;
        }
        // 109	reprovada
        if (resultado?.aprovado == false) {
            await onda_cartafianca.atualizarStatus(resultado.status, pesquisado?.contrato);

            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: resultado?.message});
            await onda_followup.postFollowup({cod: `TLI-${pesquisado?.contrato}`, event: resultado?.messageTLI});

            return setResponse.WARNING({message: resultado?.messageFront});
        }
    }
};

export default apiCebracoFinanceira;

// 06908503950 05877063928 30881540870 04263769945 06276940550 34459216876
// # onda_status_id	onda_status_descricao	onda_status_setor
// 109	reprovada
// 110	reprovado para renovação
// 111	aprovado
// 112	aguardando análise
// 113	aguardando análise de renovação
// 114	aprovado para renovação
// 115	analisar documento enviado
// 116	Cancelado pela Onda Segura
// 117	Aguardando seleção do plano no portal
