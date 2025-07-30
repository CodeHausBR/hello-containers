//BIBLIOTECAS

//HELPERS
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../../helpers/response/setResponse.js";
import getDiasRestantes from "../../../utils/datas/get-dias-restantes.js";
//BANCO DE DADOS

//SERVICES

const servicesDashboardQuery = class servicesDashboardQuery {
    static async dashboardAnaliseQuery(token, filtros, filtroFront) {
        const newFiltro = new Object({
            tipo: filtroFront?.tipo,
            periodo: filtroFront?.periodo,
            executivo: filtroFront?.executivo,
            imobiliaria: filtroFront?.imobiliaria,
            parceiro: filtroFront?.parceiro,
            formasPagamento: filtroFront?.formasPagamento,
            fonte: filtroFront?.fonte,
            cebertura: filtroFront?.cebertura,
            uf: filtroFront?.uf,
        });

        const query = this.adicionarVirvulaUltimaLinhaSql(filtros, newFiltro);

        const newQuery = `
            SELECT
                ${query}
            FROM VW_CARTAFIANCA_GERAL
            ${this.setWhereColaboradorAndImobiliaria(token)}
            ${this.setAndFiltrosFront(newFiltro)}
       
        `;

        return await executarQuery(newQuery).catch((error) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar dados dashboard da análise!"});
        });
    }

    static adicionarVirvulaUltimaLinhaSql(querys, filtroFront) {
        let consultas = ``;

        newQuery();
        function newQuery() {
            querys.forEach((filtros, index) => {
                if (querys.length == index + 1) {
                    //Ultima linha so SQL sem vingula
                    return (consultas = `${consultas} ${servicesDashboardQuery.dashboardQueryPadraoUsadoEmTudo(filtros, filtroFront)}`);
                } else {
                    //Linha do mysql com virgula
                    return (consultas = `${consultas} ${servicesDashboardQuery.dashboardQueryPadraoUsadoEmTudo(filtros, filtroFront)},`);
                }
            });
        }

        return consultas;
    }

    static dashboardQueryPadraoUsadoEmTudo(filtros, filtroFront) {
        const {filtro, label, dia, mes, semana, ano} = filtros;

        return `  
            ${servicesDashboardQuery.gerarSqlTodosDiasMes_1_ao_30(filtro, label, mes, filtroFront)}

            ${servicesDashboardQuery.gerarGraficoTotalReaisAnoMesDia(filtro, label, filtroFront)}

            ${servicesDashboardQuery.gerarGraficoAnualJanDezQuantidadeReais(filtro, label, filtroFront)}
        `;
    }

    static setWhereColaboradorAndImobiliaria(token, where) {
        return "";
        if (token?.type_user === "IMOB_ADM") {
            return `WHERE imobiliariaCod = '${token?.onda_imob_id}'`;
        } else if (token?.type_user === "COLABORADOR_IMOB") {
            return `WHERE colabImobId = ${token?.onda_colaborador_id}`;
        } else if (token?.type_user === "ONDA_USER") {
            return where || "";
        }
        return "";
    }

    static setAndFiltrosFront(filtroFront) {
        let stringAndSql = "";

        function verificarAndWhere() {
            if (stringAndSql.length == 0) {
                return "WHERE";
            } else {
                return "AND";
            }
        }
        if (filtroFront?.executivoCod != null) {
            stringAndSql = stringAndSql + `${verificarAndWhere()} executivoCod = '${filtroFront?.executivoCod}' `;
        }

        if (filtroFront?.imobiliaria != null) {
            stringAndSql = stringAndSql + `${verificarAndWhere()} imobiliariaCod = '${filtroFront?.imobiliaria}' `;
        }
        if (filtroFront?.parceiro != null) {
            stringAndSql = stringAndSql + `${verificarAndWhere()} parceiroCod = '${filtroFront?.parceiro}'`;
        }
        if (filtroFront?.formasPagamento != null) {
            stringAndSql = stringAndSql + `${verificarAndWhere()} tipopagamentoID = '${filtroFront?.formasPagamento}' `;
        }
        if (filtroFront?.fonte != null) {
            stringAndSql = stringAndSql + `${verificarAndWhere()} cfFonte = '${filtroFront?.fonte}' `;
        }
        if (filtroFront?.cebertura != null) {
            stringAndSql = stringAndSql + `${verificarAndWhere()} plano = '${filtroFront?.cebertura}' `;
        }
        if (filtroFront?.uf != null) {
            stringAndSql = stringAndSql + `${verificarAndWhere()} ImobUF = '${filtroFront?.uf}' `;
        }

        return stringAndSql;

        // "tipo": "seriesQuantidade", // recebe seriesQuantidade ou seriesReais
        // "periodo": "anual",
        // "executivo": null,
        // "imobiliaria": null,
        // "parceiro": null,
        // "formasPagamento": null,
        // "fonte": null,
        // "cebertura": null
    }

    static gerarSqlTodosDiasMes_1_ao_30(filtro, label, mes, newFiltro) {
        if (newFiltro?.periodo !== "mensal") return "";

        if (mes === true) {
            const dia_ = getDiasRestantes.getUltimoDiaMesAtual();
            let querysDosDias = ``;

            const newArray = Array.from({length: dia_}, (_, i) => i + 1);

            newArray.forEach((numeroDia) => {
                return (querysDosDias = `${querysDosDias} ${gerarQueryDiasMesAtual(numeroDia)}`);
            });

            return querysDosDias;
        } else {
            return "";
        }

        function gerarQueryDiasMesAtual(dia) {
            if (newFiltro?.tipo == "seriesQuantidade") {
                return `
                        SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) 
                        AND DAY(criacao) = ${dia} ${filtro} THEN 1 ELSE 0 END) AS total_${label}_mensal_${dia},
                `;
            }
            if (newFiltro?.tipo == "seriesReais") {
                return `
                        IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) 
                        AND DAY(criacao) = ${dia} ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_mensal_${dia},
                `;
            }
        }
    }

    static gerarGraficoTotalReaisAnoMesDia(filtro, label, newFiltro) {
        if (newFiltro?.tipo == "seriesQuantidade") {
            return `  
                #TOTAL DIA
                    SUM(CASE WHEN DATE(criacao) = CURDATE() ${filtro} THEN 1 ELSE 0 END) AS total_${label}_diariox_dia,

                #TOTAL  MES
                    SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_mensalx_mes,

                #TOTAL ANO
                    SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anualx_ano,
        `;
        }
        if (newFiltro?.tipo == "seriesReais") {
            return `              
                #TOTAL DIA
                    IFNULL(CAST(SUM(CASE WHEN DATE(criacao) = CURDATE() ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_diariox_dia,

                #TOTAL MES
                    IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_mensalx_mes,

                #TOTAL ANO
                    IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anualx_ano,
        `;
        }
        return "";
    }

    static gerarGraficoAnualJanDezQuantidadeReais(filtro, label, newFiltro) {
        if (newFiltro?.periodo !== "anual") return "";

        if (newFiltro?.tipo == "seriesQuantidade") {
            return `
                SUM(CASE WHEN MONTH(criacao) = 1 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_jan,
                SUM(CASE WHEN MONTH(criacao) = 2 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_fev,
                SUM(CASE WHEN MONTH(criacao) = 3 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_mar,
                SUM(CASE WHEN MONTH(criacao) = 4 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_abr,
                SUM(CASE WHEN MONTH(criacao) = 5 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_mai,
                SUM(CASE WHEN MONTH(criacao) = 6 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_jun,
                SUM(CASE WHEN MONTH(criacao) = 7 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_jul,
                SUM(CASE WHEN MONTH(criacao) = 8 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_ago,
                SUM(CASE WHEN MONTH(criacao) = 9 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_set,
                SUM(CASE WHEN MONTH(criacao) = 10 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_out,
                SUM(CASE WHEN MONTH(criacao) = 11 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_nov,
                SUM(CASE WHEN MONTH(criacao) = 12 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_anual_dez

            `;
        }
        if (newFiltro?.tipo == "seriesReais") {
            return `
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 1 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_jan,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 2 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_fev,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 3 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_mar,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 4 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_abr,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 5 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_mai,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 6 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_jun,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 7 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_jul,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 8 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_ago,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 9 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_set,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 10 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_out,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 11 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_nov,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 12 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_anual_dez

            `;
        }

        return "";
    }
};

export default servicesDashboardQuery;
