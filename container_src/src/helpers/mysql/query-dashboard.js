//BIBLIOTECAS

//HELPERS

//BANCO DE DADOS

//UTILS
import getDiasRestantes from "../../mvc/utils/datas/get-dias-restantes.js";

const queryDashboard = class queryDashboard {
    static diaMesAnoSemanas(filtros) {
        const {filtro, label, dia, mes, semana, ano} = filtros;

        const queryDiasMes_1_a_30 = this.todosDiasMes(filtro, label, mes);

        return `  
            #RETORNA TODOS OS DIAS NO MES
                ${queryDiasMes_1_a_30}
            #TOTAL DIA
                SUM(CASE WHEN DATE(criacao) = CURDATE() ${filtro} THEN 1 ELSE 0 END) AS total_${label}_dia,

            #TOTAL  MES
                SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_mes,

            #TOTAL ANO
                SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_ano,

            #TOTAL SEMANAS 1
                SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN 1 AND CEIL(DAY(LAST_DAY(CURDATE())) / 4) 
                ${filtro} THEN 1 ELSE 0 END) AS total_${label}_semana1,

            #TOTAL SEMANAS 2
                SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN CEIL(DAY(LAST_DAY(CURDATE())) / 4) + 1 
                AND CEIL(DAY(LAST_DAY(CURDATE())) / 2) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_semana2,

            #TOTAL SEMANAS 3
                SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN CEIL(DAY(LAST_DAY(CURDATE())) / 2) + 1 
                AND CEIL((DAY(LAST_DAY(CURDATE())) / 4) * 3) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_semana3,

            #TOTAL SEMANAS 4
                SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN CEIL((DAY(LAST_DAY(CURDATE())) / 4) * 3) + 1 
                AND DAY(LAST_DAY(CURDATE())) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_semana4,


            #TOTAL JAN a DEZ
                SUM(CASE WHEN MONTH(criacao) = 1 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_jan,
                SUM(CASE WHEN MONTH(criacao) = 2 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_fev,
                SUM(CASE WHEN MONTH(criacao) = 3 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_mar,
                SUM(CASE WHEN MONTH(criacao) = 4 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_abr,
                SUM(CASE WHEN MONTH(criacao) = 5 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_mai,
                SUM(CASE WHEN MONTH(criacao) = 6 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_jun,
                SUM(CASE WHEN MONTH(criacao) = 7 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_jul,
                SUM(CASE WHEN MONTH(criacao) = 8 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_ago,
                SUM(CASE WHEN MONTH(criacao) = 9 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_set,
                SUM(CASE WHEN MONTH(criacao) = 10 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_out,
                SUM(CASE WHEN MONTH(criacao) = 11 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_nov,
                SUM(CASE WHEN MONTH(criacao) = 12 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro} THEN 1 ELSE 0 END) AS total_${label}_dez,


            #TOTAIS EM REAIS--------------------------------------------------------------------------------------------------------------------------------------------

            #TOTAL DIA
                IFNULL(CAST(SUM(CASE WHEN DATE(criacao) = CURDATE() ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_dia,

            #TOTAL MES
                IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_mes,

            #TOTAL ANO
                IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_ano,

            #TOTAL SEMANAS 1
                IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN 1 AND CEIL(DAY(LAST_DAY(CURDATE())) / 4) 
                ${filtro} THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_semana1,

            #TOTAL SEMANAS 2
                IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN CEIL(DAY(LAST_DAY(CURDATE())) / 4) + 1 
                AND CEIL(DAY(LAST_DAY(CURDATE())) / 2) ${filtro} THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_semana2,

            #TOTAL SEMANAS 3
                IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN CEIL(DAY(LAST_DAY(CURDATE())) / 2) + 1 
                AND CEIL((DAY(LAST_DAY(CURDATE())) / 4) * 3) ${filtro} THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_semana3,

            #TOTAL SEMANAS 4
                IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) AND DAY(criacao) BETWEEN CEIL((DAY(LAST_DAY(CURDATE())) / 4) * 3) + 1 
                AND DAY(LAST_DAY(CURDATE())) ${filtro} THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_semana4,


            #TOTAL JAN a DEZ
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 1 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_jan,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 2 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_fev,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 3 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_mar,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 4 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_abr,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 5 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_mai,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 6 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_jun,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 7 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_jul,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 8 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_ago,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 9 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_set,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 10 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_out,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 11 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_nov,
                IFNULL(CAST(SUM(CASE WHEN MONTH(criacao) = 12 AND YEAR(criacao) = YEAR(CURDATE()) ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_dez

            
        `;
    }

    static todosDiasMes(filtro, label, mes) {
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
            return `
            #TOTAL DIA 
                SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) 
                AND DAY(criacao) = ${dia} ${filtro} THEN 1 ELSE 0 END) AS total_${label}_${dia},
            #REAIS DIA
                IFNULL(CAST(SUM(CASE WHEN YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE()) 
                AND DAY(criacao) = ${dia} ${filtro}  THEN valorvista END)AS DECIMAL (10 , 2 )),0) AS reais_${label}_${dia},
            `;
        }
    }
};

export default queryDashboard;
