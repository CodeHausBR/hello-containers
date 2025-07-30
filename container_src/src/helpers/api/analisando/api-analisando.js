import onda_cartafianca from "../../../mvc/models/analise/onda_cartafianca.js";
import onda_serasa_consulta_pf from "../../../mvc/models/mongoose/onda_serasa_consulta_pf.js";

import onda_errors from "../../../mvc/models/public/onda_errors.js";
import onda_followup from "../../../mvc/models/public/onda_followup.js";
import utilsFormatar from "../../../mvc/utils/formatar/formatar.js";
import setResponse from "../../response/setResponse.js";

const ANALISANDO_URL = process.env.ANALISANDO_URL;
const ANALISANDO_AUTH_GET_TOKEN = process.env.ANALISANDO_AUTH_GET_TOKEN;

const apiAnalisando = class apiAnalisando {
    static async controller({cartaFianca, token, bearerToken, valoresCartaFianca}) {
        try {
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
            if (locatario?.cpf) {
                return await apiAnalisando.start({dadoPesquisado: locatario, valoresCartaFianca: valoresCartaFianca});
            }
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao buscar dados locatário - API Analisando"});
        }
    }

    static async start({dadoPesquisado}) {
        const consulta = async () => {
            return await apiAnalisando.consultar_cpf_cnpj_relatorio_avancado({dadoPesquisado: dadoPesquisado});
        };

        const set_consulta = await consulta();
        return {consulta: set_consulta, target: dadoPesquisado};
    }

    static async verificarSeConsultaExpirou(registro) {
        if (!registro || !registro?.createdAt) {
            return true;
        }
        const dataCriacao = new Date(registro.createdAt);
        const dataAtual = new Date();
        const diferencaEmMilissegundos = dataAtual - dataCriacao;
        const diferencaEmDias = diferencaEmMilissegundos / (1000 * 60 * 60 * 24);
        return diferencaEmDias > 15;
    }

    static async consultar_cpf_cnpj_relatorio_avancado({dadoPesquisado}) {
        try {
            const registro = await onda_serasa_consulta_pf.getOne({documento: dadoPesquisado?.cpf});

            const consultaExpirou = await this.verificarSeConsultaExpirou(registro);
            if (!consultaExpirou) {
                await onda_followup.postFollowup({cod: dadoPesquisado?.contrato, event: `🤖Dados do Analisando buscados na base interna do WAVE`});
                return registro;
            }

            const response = await this.api_relatorio_avancado_top_score_pf_pme({dadoPesquisado: dadoPesquisado?.cpf});

            const data = await response.json();
            if (data.status === 406 || data.status === 404 || data.status === 500 || response.status === 406 || response.status === 404 || response.status === 500) {
                await onda_errors.postNotRes({
                    classe: "apiAnalisando",
                    funcao: "!response?.ok na linha 111",
                    statico: "consultar_cpf_cnpj_relatorio_avancado",
                    message: response,
                });
                return {error: true, message: "Erro ao consultar. Por favor, tente novamente mais tarde."};
            }

            await onda_followup.postFollowup({cod: dadoPesquisado?.contrato, event: `🤖 *Consulta análise financeira feita na API Analisando`});
            await onda_serasa_consulta_pf.post({data: data.results[0]?.result?.jsonData?.reports?.[0], documento: dadoPesquisado?.cpf});
            return data.results[0]?.result?.jsonData?.reports?.[0];
        } catch (error) {
            await onda_followup.postFollowup({cod: dadoPesquisado?.contrato, event: `🤖 *Erro na consulta análise financeira feita na API Analisando`});
            await onda_errors.postNotRes({classe: "apiAnalisando", statico: "consultar_cpf_cnpj_relatorio_avancado", message: error});
        }
    }

    static async api_relatorio_avancado_top_score_pf_pme({dadoPesquisado}) {
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", `Bearer ${ANALISANDO_AUTH_GET_TOKEN}`);

            const raw = {
                dadoPesquisado: dadoPesquisado,
                Cod: "4", // 4 para cpf e 5 para cnpj
                apiValueType: "cpfcompleto", // cpfcompleto ou cnpjcompleto
            };

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(raw),
            };

            const response = await fetch(`${ANALISANDO_URL}/analise/api/criarconsulta`, requestOptions);
            return response;
        } catch (error) {
            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao fazer requesição a api externa"});
        }
    }
};

export default apiAnalisando;
