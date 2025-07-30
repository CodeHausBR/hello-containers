//BIBLIOTECAS

//HELPERS

//BANCO DE DADOS

//SERVICES

const servicesDashboardFiltro = class servicesDashboardFiltro {
    static dashboardAnaliseFiltro() {
        return [
            {
                filtro: "",
                label: "analises",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND statusAnaliseCod = 111",
                label: "analises_aprovadas",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND (statusAnaliseCod = 109 OR statusAnaliseCod = 110)",
                label: "analises_reprovadas",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND statusComercialCod = 319",
                label: "analises_liberadas_negociacao",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND statusFinanceiroCod = 999",
                label: "contratos_pagos",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND tipopagamentoID = 1 AND statusFinanceiroCod = 999",
                label: "pagamento_boleto",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND tipopagamentoID = 2 AND statusFinanceiroCod = 999",
                label: "pagamento_credito",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND tipopagamentoID = 3 AND statusFinanceiroCod = 999",
                label: "pagamento_na",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND tipopagamentoID = 4 AND statusFinanceiroCod = 999",
                label: "pagamento_pix",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND tipopagamentoID = 5 AND statusFinanceiroCod = 999",
                label: "pagamento_recorrente",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND tipopagamentoID = 6 AND statusFinanceiroCod = 999",
                label: "pagamento_boleto_30",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND tipopagamentoID = 7 AND statusFinanceiroCod = 999",
                label: "pagamento_boleto_sem_entrada",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND cfFonte = 'Wave'",
                label: "fonte_wave",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND cfFonte = 'Portal'",
                label: "fonte_portal",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND cfFonte = 'Mobile'",
                label: "fonte_mobile",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND cfFonte = 'WhatsApp'",
                label: "fonte_whatsApp",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND limpeza_ = 1",
                label: "adicional_limpeza",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND pintura_ = 1",
                label: "adicional_pintura",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
            {
                filtro: "AND vistoria_ = 1",
                label: "adicional_vistoria",
                dia: true,
                semana: true,
                mes: true,
                ano: true,
            },
        ];
    }
};

export default servicesDashboardFiltro;
