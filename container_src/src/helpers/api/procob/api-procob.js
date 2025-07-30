//BIBLIOTECAS
import dotenv from "dotenv";
dotenv.config();
//HELPERS
import onda_followup from "../../../mvc/models/public/onda_followup.js";
import getDataHorarioAtual from "../../../mvc/utils/datas/get-data-horario-atual.js";
import httpRequestProvider from "../../response/http-request-provider.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";
import setResponse from "../../response/setResponse.js";
//BANCO DE DADOS
import onda_procob from "../../../mvc/models/mongoose/onda_procob.js";
//SERVICES

//.ENV
const BASE_URL_WAVE = process.env.BASE_URL_WAVE;

const apiProcob = class apiProcob {
    static async start(cpfCnpj, token, pesquisado) {
        const capivara = await httpRequestProvider.consultarApiIaServidorWave(cpfCnpj, token, pesquisado);

        const processos = await this.separarProcessosParaSalvar(capivara, pesquisado);

        return processos;
    }

    static async consultaJuridicaPeloCpf(cpfCnpj, token) {
        const newCpfCnpj = removerCaracteresEspeciaisEEspacos(cpfCnpj);

        const retornarHistoricoBanco = await onda_procob.getOne({documento: newCpfCnpj});

        if (retornarHistoricoBanco) return retornarHistoricoBanco;

        const params = {
            documento: newCpfCnpj,
            tipo: (newCpfCnpj.length > 12 && "PJ") || "PF",
        };

        const data = await fetch(`https://api.procob.com/consultas/v1/A0008`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic aGFuYS5nYWJyaWVsYUBvbmRhc2VnLmNvbS5icjoyTlBSOUY=",
            },
            body: JSON.stringify(params),
        });

        function removerCaracteresEspeciaisEEspacos(str) {
            return str.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s/g, "");
        }

        const resultProcob = await data.json();

        if (resultProcob?.code == "000") {
            await onda_procob.post({data: resultProcob, cpfCnpj: newCpfCnpj});
        } else {
            await onda_errors.postNotRes({classe: "apiProcob", statico: "consultaJuridicaPeloCpf", message: resultProcob});
        }

        return resultProcob;
    }

    static async consultarApiIaServidorWave(cpfCnpj, token, pesquisado) {
        const data = await fetch(`${BASE_URL_WAVE}/analise/consulta/ia/${cpfCnpj}}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).catch(async (err) => {
            await onda_followup.postFollowup({token: token, cod: pesquisado?.contrato, event: `*Erro ao consultar API WAVE 1`});
            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "*Erro ao consultar API WAVE"});
        });

        const getData = await data?.json();

        if (getData?.type != "success") {
            await onda_followup.postFollowup({token: token, cod: pesquisado?.contrato, event: `*Erro ao consultar API WAVE 2`});
            await onda_errors.postNotRes({classe: "httpRequestProvider", statico: "consultarApiIaServidorWave", message: JSON.stringify(getData)?.slice(0, 4900)});
            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "*Erro ao consultar API WAVE"});
        }

        return getData?.results;
    }

    static async separarProcessosParaSalvar(capivara, pesquisado) {
        try {
            const verificacao = await this.gerarStatusAprovado(capivara, pesquisado);

            let resultadoFormatado = "";
            let aprovado = verificacao?.aprovado || 3;
            let status = verificacao?.status;
            let resultadoMessage = verificacao?.message || "*Erro ao gerar status aprovado";

            const documentoReu = capivara.content?.busca_judicial?.documento;

            //lista todos os processos, caso não tenha devolve true como aprovado
            if (!capivara.content?.busca_judicial?.processos) return results();

            //Verifica se é menor de idade
            if (status == 116) return results();

            for (const processo of capivara.content?.busca_judicial?.processos) {
                const {
                    numeroProcesso, // "50003284620218240006",
                    valorCausa, // 7068.96,
                    tipoProcesso, // "EXECUCAO DE TITULO EXTRAJUDICIAL",
                    assuntoProcesso, // "02190507 | INADIMPLEMENTO (DIREITO CIVIL), INADIMPLEMENTO, OBRIGACOES, DIREITO CIVIL",
                    nomeTribunal, // "TJSC",
                    nivelTribunal, // "1",
                    tipoTribunal, // "CIVEL",
                    distritoTribunal, // "BARRA VELHA",
                    varaDoTribunal, // "JUIZO DA 1 VARA DA COMARCA DE BARRA VELHA",
                    juiz, // "GUY ESTEVAO BERKENBROCK",
                    estado, // "SC",
                    statusProcesso, // "ARQUIVADO",
                    processosRelacionados, // [],
                    outrosAssuntos, //  ["0219032307","DESPEJO POR INADIMPLEMENTO, LOCACAO DE IMOVEL, ESPECIES DE CONTRATOS, OBRIGACOES, DIREITO CIVIL"],
                    teste,
                    partes = Array,
                } = processo;

                const [crimes, statusSetatoPelosCrimes, aprovacao, message] = this.verificarCrimeParaGerarStatus(assuntoProcesso);

                //Veridica se é reu em alguma parte
                for (const parte of partes) {
                    const {
                        documento, // "06908503950",
                        parteAtiva, // true,
                        nome, // "AMANDA CAROLINA CUSTODIO",
                        polaridade, // "PASSIVE",
                        tipo, // "DEFENDANT",
                        detalhes: {
                            tipoEspecifico, // "REU"  "REQUERENTE" "EXECUTADO" "AUTOR" "EXEQUENTE"
                        },
                        ultimaCaptura, // "2024-06-12T02:59:13"} = partes
                    } = parte;

                    // SE O CPF CONSULTADO FOR REU DO PROCESSO SALVAR O PROCESSO COMO STRING

                    if (documento == documentoReu && (tipoEspecifico?.toLowerCase() == "acusado" || "reu")) {
                        aprovado = aprovacao;
                        resultadoMessage = message;
                        status = statusSetatoPelosCrimes;
                        resultadoFormatado += `
                        Nome: ${nome}\n  
                        Crimes: ${crimes}\n
                        Número do Processo: ${numeroProcesso}\n
                        Valor da Causa: R$ ${valorCausa}\n
                        Tipo de Processo: ${tipoProcesso}\n
                        Assunto do Processo: ${assuntoProcesso}\n
                        Tribunal: ${nomeTribunal} (${nivelTribunal}, ${tipoTribunal})\n
                        Distrito: ${distritoTribunal}\n
                        Vara: ${varaDoTribunal}\n
                        Juiz: ${juiz}\n
                        Estado: ${estado}\n
                        Status do Processo: ${statusProcesso}\n
                        Outros Assuntos: ${outrosAssuntos.join(", ")}\n
                        ---------------------------\n
    
                    `;
                    }
                }
            }

            function results() {
                return {
                    status: status || 112,
                    processos: resultadoFormatado,
                    aprovado: aprovado,
                    message: resultadoMessage || "*Erro interno message!",
                    codeApi: capivara.code,
                    messageApi: capivara.message,
                };
            }
            return results(); //FIM
        } catch (error) {
            await onda_errors.postNotRes({classe: "apiProcob", statico: "separarProcessosParaSalvar", message: JSON.stringify(error)?.slice(0, 4900)});
            return {
                status: 109,
                processos: "",
                aprovado: 0,
                message: "* Erro na consulta (procob)",
                codeApi: error?.code,
                messageApi: error?.message,
            }; //FIM
        }
    }

    static async limitadorConsultaDiario() {}

    static verificarCrimeParaGerarStatus(assuntoProcesso) {
        const assuntoProcessoLowerCase = assuntoProcesso?.toLowerCase();

        const crimesParaEvitar = ["despejo", "aluguéis", "roubo", "furto", "drogas", "trafico", "tráfico", "homicídio", "assassinato"];

        let crimesEncontrados = "";
        for (const crime of crimesParaEvitar) {
            const crimeProcurado = crime;
            if (assuntoProcessoLowerCase.includes(crimeProcurado)) crimesEncontrados = crimesEncontrados + " " + crimeProcurado;
        }

        if (String(crimesEncontrados).length > 0) {
            //Reprovado
            return [crimesEncontrados, 109, 0, "*Reprovado pela análise automática (procob)!"];
        } else {
            //Aprovado
            return [crimesEncontrados, 111, 1, "*Aprovado pela análise automática (procob)!"];
        }
    }

    static async gerarStatusAprovado(capivara, pesquisado) {
        if (!capivara.content?.dados_gerais?.documento) return {aprovado: 3, status: 112, message: "*Aguardando análise porque não retornou dados na consulta!"};

        if (getDataHorarioAtual.VERIFICAR_MAIOR_IDADE(capivara.content?.dados_gerais?.nascimento) == false)
            return {aprovado: 3, status: 116, message: `*Cancelado porque o ${pesquisado?.tipo} é menor de idade!`};

        if (!capivara.content?.busca_judicial?.processos) return {aprovado: 1, status: 111, message: "*Aprovado automaticamente (procob)!"};
    }
};

export default apiProcob;
// # onda_status_id	onda_status_descricao	onda_status_setor
// 109	reprovada	analise
// 110	reprovado para renovação	analise
// 111	aprovado	analise
// 112	aguardando análise	analise
// 113	aguardando análise de renovação	analise
// 114	aprovado para renovação	analise
// 115	analisar documento enviado	analise
// 116	Cancelado pela Onda Segura	analise
