//BIBLIOTECAS

//HELPERS
import getDataHorarioAtual from "./get-data-horario-atual.js";
//BANCO DE DADOS

//SERVICES

const getDiasRestantes = class getDiasRestantes {
    static async diasRestantes(vencimento) {
        const segundosPorDia = 24 * 60 * 60;

        const timestamp1 = new Date(getDataHorarioAtual.YYYY_MM_DD_00_00_00()).getTime();
        const timestamp2 = new Date(vencimento).getTime();

        const diferencaSegundos = Math.abs(timestamp2 - timestamp1) / 1000;
        const diferencaDias = Math.floor(diferencaSegundos / segundosPorDia);

        return diferencaDias;
    }

    static async vencimentoContrato(vencimento) {
        const dataCom365Dias = new Date(vencimento);
        const newVencimento = dataCom365Dias.setDate(vencimento.getDate() + 365);
        return newVencimento;
    }

    static getUltimoDiaMesAtual() {
        const agora_ = new Date();
        const ano_ = agora_.getFullYear();
        const mes_ = agora_.getMonth() + 1;
        const proximoMes = new Date(ano_, mes_, 1);
        const ultimoDiaDoMesAtual = Number(new Date(proximoMes - 1).getDate());
        return ultimoDiaDoMesAtual;
    }
};

export default getDiasRestantes;
