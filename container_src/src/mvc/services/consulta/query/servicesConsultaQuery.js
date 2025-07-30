//HELPERS

import apiProcob from "../../../../helpers/api/procob/api-procob.js";
import getToken from "../../../../helpers/token/get-token.js";

//MODELS
import onda_ar from "../../../models/analise/onda_ar.js";
import onda_historico_analise from "../../../models/analise/onda_historico_analise.js";
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
import onda_helpers from "../../../models/public/onda_helpers.js";
import onda_followup from "../../../models/public/onda_followup.js";

//UTILS
import getDiasRestantes from "../../../utils/datas/get-dias-restantes.js";

const servicesConsultaQuery = class servicesConsultaQuery {
    static async startConsultaApiCpfCnpj(infoLocatario, infoAnalise, token, req, newCartafianca) {
        const helpersAnalise = await onda_helpers.buscarConsultaApiCpfCnpjSetada();
        const tokenAuth = getToken(req);

        if (await this.verificarValorCartaFiancaParaEvitarConsultaCpfApi(newCartafianca, token)) return;

        if (await this.verificarSeECnpjEnviarParaAnaliseManual(newCartafianca, token)) return;

        const dadoLocatario = {
            cpf: infoLocatario?.locatarioCnpjcpf,
            token: token?.onda_user_id || token?.onda_imob_id,
            fonte: infoAnalise?.cartafiancaFonte,
            origem: helpersAnalise?.onda_helpers_descricao,
            nome: infoLocatario?.locatarioNome,
            contrato: newCartafianca?.contrato,
            tipo: "Locatário",
            token2: tokenAuth,
        };

        const dadoCoparticipante1 = {
            cpf: infoLocatario?.locatarioCopart1cpf,
            token: token?.onda_user_id || token?.onda_imob_id,
            fonte: infoAnalise?.cartafiancaFonte,
            origem: helpersAnalise?.onda_helpers_descricao,
            nome: infoLocatario?.locatarioCopart1,
            contrato: newCartafianca?.contrato,
            tipo: "Coparticipante 1",
            token2: tokenAuth,
        };

        const dadoCoparticipante2 = {
            cpf: infoLocatario?.locatarioCopart2cpf,
            token: token?.onda_user_id || token?.onda_imob_id,
            fonte: infoAnalise?.cartafiancaFonte,
            origem: helpersAnalise?.onda_helpers_descricao,
            nome: infoLocatario?.locatarioCopart2,
            contrato: newCartafianca?.contrato,
            tipo: "Coparticipante 2",
            token2: tokenAuth,
        };

        await this.consultarCpfCnpj(dadoLocatario);

        if (dadoCoparticipante1?.locatarioCopart1cpf) {
            await this.consultarCpfCnpj(dadoCoparticipante1);
        }
        if (dadoCoparticipante2?.locatarioCopart2cpf) {
            await this.consultarCpfCnpj(dadoCoparticipante2);
        }
        return;
    }

    static async consultarCpfCnpj(pesquisado) {
        //Consultar das análises enviadas
        if (await this.consultarNoHistoricoDaCartaFianca(pesquisado)) return;
        //INICIO
        //Consultar onda_ar e onda_historico_analise
        const consultaAutoRisco = await onda_ar.getOneNotRes(pesquisado?.cpf);

        //Yes 001 Verificar se existe,  Colocar um status "reprovado auto risco"
        if (consultaAutoRisco) {
            return await this.atualizarStatusAnaliseSalvarHistoricoAnalise({
                pesquisado: pesquisado,
                aprovado: 0,
                status: 109,
                acoes: consultaAutoRisco?.arDescricao,
                message: `*${pesquisado?.tipo} reprovado!`,
            });
        } //FIM

        //No 002
        const consultaHistoricoAnalise = await onda_historico_analise.getOneNotRes(pesquisado?.cpf);

        const tempoDezDaUltimaConsulta = await getDiasRestantes.diasRestantes(consultaHistoricoAnalise?.onda_historico_analise_criacao);

        //No 006 não existe em onda_ar e onda_historico_analise
        if (!consultaHistoricoAnalise) {
            const api = await apiProcob.start(pesquisado?.cpf, pesquisado?.token2, pesquisado);
            // Yes 007 e Yes 008 juntos
            await this.atualizarStatusAnaliseSalvarHistoricoAnalise({
                pesquisado: pesquisado,
                aprovado: api?.aprovado,
                status: api?.status,
                acoes: api?.processos,
                message: api?.message,
            });
            return;
        } //FIM

        //Yes 003 Verifica se é aprovado
        if (consultaHistoricoAnalise?.onda_historico_analise_aprovado == 1 && tempoDezDaUltimaConsulta <= 90) {
            //Yes 004
            await onda_cartafianca.atualizarStatus(111, pesquisado?.contrato);
            await onda_followup.postFollowup({
                token: pesquisado?.token2,
                cod: pesquisado?.contrato,
                event: `*${pesquisado?.tipo} aprovado automaticamente pelo histórico do wave!`,
            });
            return; //FIM
        } else if (consultaHistoricoAnalise?.onda_historico_analise_aprovado == 0) {
            await onda_followup.postFollowup({token: pesquisado?.token2, cod: pesquisado?.contrato, event: `*${pesquisado?.tipo} reprovado pelo histórico da análise!`});
            await onda_cartafianca.atualizarStatus(109, pesquisado?.contrato);
            return; //FIM
        }

        //No 005
        const api = await apiProcob.start(pesquisado?.cpf, pesquisado?.token2);
        // Yes 007 e Yes 008 juntos
        await this.atualizarStatusAnaliseSalvarHistoricoAnalise({
            pesquisado: pesquisado,
            aprovado: api?.aprovado,
            status: api?.status,
            acoes: api?.processos,
            message: api?.message,
        });
        return;
        //FIM
    }

    static async atualizarStatusAnaliseSalvarHistoricoAnalise(props) {
        const {pesquisado, aprovado, status, acoes, message} = props;

        const [_, cfAtualizada] = await Promise.all([
            onda_historico_analise.createNotRes({pesquisado: pesquisado, aprovado: aprovado, acoes: acoes}),
            onda_cartafianca.atualizarStatus(status, pesquisado?.contrato),
            onda_followup.postFollowup({token: pesquisado?.token, cod: pesquisado?.contrato, event: message}),
        ]);

        return cfAtualizada;
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
        if (String(newCartafianca.cpf).trim().length > 15) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ deve ser feita manualmente (locatário)!"});
            return true;
        } else if (String(newCartafianca.cpfcoparticipante1).length > 15) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ devem ser feitas manualmente (Copart1)!"});
            return true;
        } else if (String(newCartafianca.cpfcoparticipante2).length > 15) {
            await onda_followup.postFollowup({token: token, cod: newCartafianca?.contrato, event: "*Análises de CNPJ devem ser feitas manualmente (Copart2)!"});
            return true;
        } else {
            return false;
        }
    }

    static async consultarNoHistoricoDaCartaFianca(pesquisado) {
        const cartaFianca = await onda_cartafianca.veirificarSeEstaReprovadoByCpfCnpj(pesquisado?.cpf);

        if (!cartaFianca) {
            return false;
        } else {
            await this.atualizarStatusAnaliseSalvarHistoricoAnalise({
                pesquisado: pesquisado,
                aprovado: 0,
                status: 109,
                acoes: "",
                message: "*Reprovado pela consulta histórico da carta fiança.",
            });
            return true;
        }
    }
};

export default servicesConsultaQuery;
