import {CronJob} from "cron";
import servicesAnaliseRegras from "../../../mvc/services/analise/regras/servicesAnaliseRegras.js";
import servicesAnaliseQuery from "../../../mvc/services/analise/query/servicesAnaliseQuery.js";

class VerificacaoCartaFiancaJob {
    constructor() {
        this.job = new CronJob("0 5 * * *", this.executar.bind(this), null, true, "America/Sao_Paulo");
    }

    async executar() {
        try {
            await this.verificacaoInadimplencia();
            await this.verificacaoVencimento();
            await this.verificacaoRegrasExoneracao();
            console.log("Cron da cartafiança finalizado");
        } catch (error) {
            console.error("Erro durante execução do cronn de  de cartafiança:", error);
        }
    }

    chunkArray(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }
    async verificacaoInadimplencia() {
        try {
            console.log("Executando tarefa de verificação de inadimplência.");

            const CHUNK_SIZE = 2000;
            const {inadimplentes, adimplentes} = await servicesAnaliseRegras.verificarInadimplencia();

            const chunksInadimplentes = this.chunkArray(inadimplentes, CHUNK_SIZE);
            const chunksAdimplentes = this.chunkArray(adimplentes, CHUNK_SIZE);

            for (const chunk of chunksInadimplentes) {
                await servicesAnaliseQuery.atualizarStatusInadimplencia(chunk, 1);
            }

            for (const chunk of chunksAdimplentes) {
                await servicesAnaliseQuery.atualizarStatusInadimplencia(chunk, 0);
            }
            console.log("Tarefa de verificação de inadimplência e contratos expirados executada");
        } catch (error) {
            console.error("Erro durante execução do cronn de  de inadimplência :", error);
        }
    }

    async verificacaoVencimento() {
        try {
            console.log("Executando tarefa de verificação de contratos vencidos");
            const CHUNK_SIZE = 2000;

            const contratosExpirados = await servicesAnaliseRegras.verificarVencimento();
            const chunkExpirados = this.chunkArray(contratosExpirados, CHUNK_SIZE);
            for (const chunk of chunkExpirados) {
                await servicesAnaliseQuery.atualizarStatusVencimento(chunk);
            }
            // await Promise.all(contratosExpirados.map((cod) => servicesAnaliseQuery.atualizarStatusVencimento(cod)));

            console.log("Tarefa de verificação de contratos vencidos executada");
        } catch (error) {
            console.error("Erro durante execução do cronn de  contratos vencidos:", error);
        }
    }

    async verificacaoRegrasExoneracao() {
        try {
            await servicesAnaliseRegras.servicoVerificacaoExoneracaoAutomatica();
        } catch (error) {
            console.error("Erro durante execução do cronn de  verifição de regras de exoneração.", error);
        }
    }

    iniciar() {
        if (!this.job.running) {
            console.log("iniciando tarefa para verificação de inadimplencia e contratos expirados");
            this.job.start();
        } else {
            console.log("Já foi iniciado");
        }
    }

    parar() {
        if (this.job.running) {
            console.log("parando");
            this.job.stop();
        }
    }
}

const verificacaoCartaFianca = new VerificacaoCartaFiancaJob();
export default verificacaoCartaFianca;
