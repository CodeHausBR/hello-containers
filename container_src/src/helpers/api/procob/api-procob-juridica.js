//BIBLIOTECAS
import dotenv from "dotenv";
dotenv.config();
//HELPERS
import onda_followup from "../../../mvc/models/public/onda_followup.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";
import setResponse from "../../response/setResponse.js";
//BANCO DE DADOS
import onda_cartafianca from "../../../mvc/models/analise/onda_cartafianca.js";
import onda_procob from "../../../mvc/models/mongoose/onda_procob.js";
//SERVICES

//UTLS
import formatarBoleto from "../../../mvc/utils/formatar/formatar-boleto.js";

//UTILS
import parametrosSistema from "../../../mvc/utils/parametro/parametros-sistema.js";
//.ENV
const BASE_URL_WAVE = process.env.BASE_URL_WAVE;

const apiProcobJuridica = class apiProcobJuridica {
    static async controller({cartaFianca, token, bearerToken, statusAnalise = false, parametrosAnalise}) {
        // if (await this.verificarValorCartaFiancaParaEvitarConsultaCpfApi(cartaFianca, token)) return;

        // if (await this.verificarSeECnpjEnviarParaAnaliseManual(cartaFianca, token)) return;

        const locatario = {
            statusAnalise: statusAnalise,
            idCartafianca: cartaFianca?.id,
            cpf: removerCaracteresEspeciaisEEspacos(cartaFianca?.cpf),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.locatario,
            contrato: cartaFianca?.contrato,
            tipo: "Locatário",
            bearerToken: bearerToken,
            token: token,
            parametrosAnalise: parametrosAnalise,
        };

        const coparticipante1 = {
            idCartafianca: cartaFianca?.id,
            cpf: removerCaracteresEspeciaisEEspacos(cartaFianca?.cpfcoparticipante1),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.coparticipante1,
            contrato: cartaFianca?.contrato,
            tipo: "Coparticipante 1",
            bearerToken: bearerToken,
            token: token,
        };

        const coparticipante2 = {
            idCartafianca: cartaFianca?.id,
            cpf: removerCaracteresEspeciaisEEspacos(cartaFianca?.cpfcoparticipante2),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.coparticipante2,
            contrato: cartaFianca?.contrato,
            tipo: "Coparticipante 2",
            bearerToken: bearerToken,
            token: token,
        };

        function removerCaracteresEspeciaisEEspacos(str = String()) {
            if (typeof str !== "string") return "";

            return str.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s/g, "");
        }

        //PASSA POR ESSA FUNÇÃO FAZ A ANÁLISE JURIDICA E REPROVA OU MANDA PARA A PROXIMA CONSULTA
        if (locatario?.cpf) await apiProcobJuridica.start({pesquisado: locatario});
        if (coparticipante1?.cpf) await apiProcobJuridica.start({pesquisado: coparticipante1});
        if (coparticipante2?.cpf) await apiProcobJuridica.start({pesquisado: coparticipante2});
    }

    static async start({pesquisado}) {
        await apiProcobJuridica.consultarNoHistoricoDaCartaFianca(pesquisado);

        const capivara = await apiProcobJuridica.consultarApiIaServidorWave({pesquisado: pesquisado});

        const resultado = await this.separarPartesParaIdentificarSeCpfCnpjEstaEnvolvolvidoComoReuNoProcesso({pesquisado: pesquisado, capivara: capivara});

        return await this.verificarAnaliseJuridicaParaAtualizarCartaFianca({resultado: resultado, pesquisado: pesquisado});
    }

    static async consultaJuridicaPeloCpf(cpfCnpj, token) {
        const newCpfCnpj = removerCaracteresEspeciaisEEspacos(cpfCnpj);

        const retornarHistoricoBanco = await onda_procob.getOne({documento: newCpfCnpj});

        if (retornarHistoricoBanco) {
            return retornarHistoricoBanco;
        }

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
        await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Consulta financeira feita na API PROCOB R$ - 1,20 🥹`});

        if (resultProcob?.code == "000") {
            await onda_procob.post({data: resultProcob, cpfCnpj: newCpfCnpj});
        }

        return resultProcob;
    }

    static async consultarApiIaServidorWave({pesquisado}) {
        const retornarHistoricoBanco = await onda_procob.getOne({documento: pesquisado.cpf});
        if (retornarHistoricoBanco) {
            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Consulta juridica feita no banco de dados interno, economia de R$ 1,20 💸`});

            return retornarHistoricoBanco;
        }

        const data = await fetch(`${BASE_URL_WAVE}/analise/consulta/ia/${pesquisado?.cpf}}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${pesquisado?.bearerToken}`,
            },
        })
            .then(async (res) => {
                await onda_followup.postFollowup({cod: `${pesquisado?.contrato}`, event: `🤖 *Sucesso ao consultar dados jurídicos api wave, ${pesquisado?.tipo} 🆗`});
                return res;
            })
            .catch(async (error) => {
                await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Erro ao consultar dados jurídicos api wave, ${pesquisado?.tipo} 🛑`});

                await onda_errors.postNotRes({
                    token: pesquisado?.token,
                    classe: "consultarApiIaServidorWave",
                    statico: "consultarApiIaServidorWave",
                    message: JSON.stringify(error)?.slice(0, 4900),
                });
                // TROCAR A MENSAGEM PARA UM OBJETO DE ERRO PARA SETAR A  AÇÃO DE REPROCESSAMENTO CASO ERRO NO SISTEMA
                // NO CASO DE ERRO ENVIAR PARA A ANÁLISE MANUAL
                return setResponse.INTERNAL_REQUEST_API_FAILED({message: "*Erro ao consultar API WAVE"});
            });

        const getData = await data?.json();

        // if (getData?.results?.content == null) {
        //     await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Erro ao buscar dados jurídicos api wave, ${pesquisado?.tipo} 🛑`});

        //     await onda_errors.postNotRes({
        //         token: pesquisado?.token,
        //         classe: "consultarApiIaServidorWave",
        //         statico: "consultarApiIaServidorWave",
        //         message: JSON.stringify(getData)?.slice(0, 4900),
        //     });

        //     // TROCAR A MENSAGEM PARA UM OBJETO DE ERRO PARA SETAR A  AÇÃO DE REPROCESSAMENTO CASO ERRO NO SISTEMA
        //     // NO CASO DE ERRO ENVIAR PARA A ANÁLISE MANUAL
        //     return setResponse.INTERNAL_REQUEST_API_FAILED({message: `🤖 *Erro ao buscar dados jurídicos api wave, ${pesquisado?.tipo} 🛑`});
        // }

        return getData?.results;
    }

    static async separarPartesParaIdentificarSeCpfCnpjEstaEnvolvolvidoComoReuNoProcesso({capivara, pesquisado}) {
        const documentoBuscado = String(capivara?.content?.busca_judicial?.documento) || "";

        const processos = capivara?.content?.busca_judicial?.processos || [];

        const palavrasParaEvitar = new parametrosSistema(pesquisado?.parametrosAnalise).set_onda_config_palavras_restritas_juridico();

        const crimesParaEvitar = [
            ...[
                "despejo",
                "alugueis",
                "aluguel",
                "estelionato",
                "drogas",
                "assassinato",
                "furto",
                "roubo",
                "homicidio",
                "latrocinio",
                "estupro",
                "sequestro",
                "trafico",
                "arrombamento",
                "fraude",
                "corrupcao",
                "aliciamento",
                "falsificacao",
                "violencia",
                "extorsao",
                "vandalismo",
                "pedofilia",
                "calote",
                "penal",
                "cobranca de alugueis",
                "indenizacao por dano ao imovel",
                "dano ao imovel",
                "crimes contra imovel",
                "locacao imovel",
                "seguro aluguel",
                "garantia locaticia",
                "seguro fianca",
                "inadiplimento de aluguel",
                "inadiplimento de alugueis",
                "inadimplimento de aluguel",
                "inadimplimento de alugueis",
                "cobrança de aluguel",
                "RECEPTACAO CULPOSA", // Isa pediu para adicionar dia 03/12/2024
                "RECEPTACAO", // Isa pediu para adicionar dia 03/12/2024
                "armas",
                "arma",
                "carabina",
                "espingarda",
                "fuzil",
                "pistola",
                "punhal",
                "revolver",
                "criminosa",
                "criminoso",
            ],
            ...palavrasParaEvitar,
        ];

        const tiposParaEvitar = [
            "defendant",
            "reu",
            "acusado",
            "acusada",
            "claimed",
            "reclamado",
            "reclamada",
            "executado",
            "executada",
            "condenado",
            "condenada",
            "sujeito",
            "inmate",
            "paciente",
            "preso",
            "detento",
            "prisioneiro",
            "detido",
            "cativo",
            "prisoner",
            "captive",
            "detainee",
            "jailbird",
        ];

        let verificarSeTemCrimesBanidos = false;
        const arrayDePalavrasNoAssuntoDoProcesso = [];

        for (const processo of processos) {
            for (const parte of processo?.partes || []) {
                const tipo = String(parte?.tipo)?.toLocaleLowerCase();

                const documentoParte = String(parte?.documento)?.toLocaleLowerCase();

                const verificarTipo = tiposParaEvitar.includes(tipo);

                //defendant reu acusado
                if (documentoParte == documentoBuscado && verificarTipo == true) {
                    const assuntoProcesso = String(formatarBoleto.removerAcentuacaoDeTexto(processo?.assuntoProcesso?.toLocaleLowerCase()));

                    arrayDePalavrasNoAssuntoDoProcesso.push(assuntoProcesso);
                }
            }
        }

        const setCrimesParaEvitar = crimesParaEvitar.map((crime) => {
            const setcrimesFormatados = formatarBoleto.removerAcentuacaoDeTexto(crime).toLowerCase();
            const regexString = setcrimesFormatados.replace(/ /g, ".*");
            const regex = new RegExp(regexString, "i");

            return regex;
        });

        const crimesEncontradosComoReu = setCrimesParaEvitar.filter((regex) => regex.test(arrayDePalavrasNoAssuntoDoProcesso)).map((crime) => crime.source.replace(/\.\*/g, " "));

        if (crimesEncontradosComoReu?.length > 0) {
            verificarSeTemCrimesBanidos = true;
        }

        if (verificarSeTemCrimesBanidos == true) {
            return {
                messageFront: "🤖 Locatário(a) reprovado na análise!",
                message: "🤖 *Locatário(a) reprovado na análise jurídica!⚠️",
                status: 109,
                aprovado: false,
                crimesEncontradosComoReu: crimesEncontradosComoReu,
            };
        } else if (capivara?.code == "999") {
            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: "Análise jurídica indisponível!"});
            return {
                messageFront: "🤖 Análise jurídica indisponível!",
                message: "🤖 *Análise jurídica indisponível! ⚠️",
                status: 112,
                aprovado: false,
                crimesEncontradosComoReu: crimesEncontradosComoReu,
            };
        } else if (!capivara) {
            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: "Análise jurídica indisponível!"});
            return {
                messageFront: "🤖 Análise jurídica indisponível. Tente mais tarde.",
                message: "🤖 *Análise jurídica indisponível! ⚠️",
                status: 116, // 116	cancelado pela onda
                aprovado: false,
                crimesEncontradosComoReu: crimesEncontradosComoReu,
            };
        } else {
            return {
                messageFront: "🤖 Locatário(a) aprovado na análise jurídica!",
                message: `🤖 *${pesquisado?.tipo}: ${pesquisado?.nome} aprovado(a) na análise jurídica! 🆗`,
                status: 109,
                aprovado: true,
                crimesEncontradosComoReu: crimesEncontradosComoReu,
            };
        }
    }

    static async verificarAnaliseJuridicaParaAtualizarCartaFianca({resultado, pesquisado}) {
        if (resultado?.aprovado == true) {
            //REMOVIDO START 03/02/2025
            //if (pesquisado?.statusAnalise) await onda_cartafianca.atualizarStatus(117, pesquisado?.contrato);
            //REMOVIDO START 03/02/2025
            //if (pesquisado?.statusAnalise) await onda_cartafianca.atualizarStatus(111, pesquisado?.contrato);

            await onda_cartafianca.atualizarStatus(117, pesquisado?.contrato);

            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: resultado?.message});
            return resultado;
        }
        // 109	reprovada	analise
        if (resultado?.aprovado == false) {
            await onda_cartafianca.atualizarStatus(109, pesquisado?.contrato);
            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: resultado?.message});
            return setResponse.WARNING({message: resultado?.messageFront});
        }
    }

    static async verificarValorCartaFiancaParaEvitarConsultaCpfApi(newCartafianca, token) {
        if (Number(newCartafianca.valorvista) >= 10000) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análise acima de 10k precisa ser feita manualmente!"});
            return true;
        } else {
            return false;
        }
    }

    static async verificarSeECnpjEnviarParaAnaliseManual(newCartafianca, token) {
        if (String(removerCaracteresEspeciaisEEspacos(newCartafianca.cpf || "")).length > 12) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ deve ser feita manualmente (locatário)!"});
            return true;
        } else if (String(removerCaracteresEspeciaisEEspacos(newCartafianca.cpfcoparticipante1 || "")).length > 12) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ devem ser feitas manualmente (Copart1)!"});
            return true;
        } else if (String(removerCaracteresEspeciaisEEspacos(newCartafianca.cpfcoparticipante2 || "")).length > 12) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ devem ser feitas manualmente (Copart2)!"});
            return true;
        } else {
            return false;
        }

        function removerCaracteresEspeciaisEEspacos(str) {
            return str
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .replace(/\s/g, "")
                .trim();
        }
    }

    static async consultarNoHistoricoDaCartaFianca(pesquisado) {
        const cartaFianca = await onda_cartafianca.veirificarSeEstaReprovadoByCpfCnpj(pesquisado?.cpf);

        if (!cartaFianca) return;

        await onda_cartafianca.atualizarStatus(109, pesquisado?.contrato);
        await onda_followup.postFollowup({cod: pesquisado?.contrato, event: "Locatário reprovado pelo histórico da análise!"});
        return setResponse.WARNING({message: "Análise do locatárioª foi reprovada!"});
    }
};

export default apiProcobJuridica;
// # onda_status_id	onda_status_descricao	onda_status_setor
// 109	reprovada	analise
// 110	reprovado para renovação	analise
// 111	aprovado	analise
// 112	aguardando análise	analise
// 113	aguardando análise de renovação	analise
// 114	aprovado para renovação	analise
// 115	analisar documento enviado	analise
// 116	Cancelado pela Onda Segura	analise
