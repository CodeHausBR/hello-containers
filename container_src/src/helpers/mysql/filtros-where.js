//BIBLIOTECAS
//HELPERS

//BANCO DE DADOS

//UTILS
import executarQuery from "../../mvc/utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../response/setResponse.js";

const filtrosWhere = class filtrosWhere {
    static async teste(query, filter) {
        const newQuery1 = `
        SELECT 
        (
            SELECT 
            COUNT(*) 
            FROM VW_CARTAFIANCA_GERAL 
            WHERE DATE(criacao) = CURDATE()
        ) AS quantidadeAnalisesDia,
        (
            SELECT 
            COUNT(*) 
            FROM VW_CARTAFIANCA_GERAL 
            WHERE YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE())
        ) AS quantidadeAnalisesMes,
        (
            SELECT 
            COUNT(*) 
            FROM VW_CARTAFIANCA_GERAL 
            WHERE YEAR(criacao) = YEAR(CURDATE())
        ) AS quantidadeAnalisesAno,
        (
            SELECT 
            SUM(valorvista)
            FROM VW_CARTAFIANCA_GERAL 
            WHERE DATE(criacao) = CURDATE()
        ) AS valorAnalisesDia,
        (
            SELECT 
            SUM(valorvista)
            FROM VW_CARTAFIANCA_GERAL 
            WHERE YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE())
        ) AS valorAnalisesMes,
        (
            SELECT 
            SUM(valorvista)
            FROM VW_CARTAFIANCA_GERAL 
            WHERE YEAR(criacao) = YEAR(CURDATE())
        ) AS valorAnalisesAno

        FROM VW_CARTAFIANCA_GERAL
    `;

        const [results] = await executarQuery(newQuery1).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar dados dashboard!"});
        });

        return results;
    }

    static async buscar(query, filter) {
        const newQuery1 = `
            ${query}
            WHERE DATE(criacao) = CURDATE()
        `;

        const [dia] = await executarQuery(newQuery1).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar dados dashboard!"});
        });

        const newQuery2 = `
            ${query}
            WHERE YEAR(criacao) = YEAR(CURDATE()) AND MONTH(criacao) = MONTH(CURDATE())
        `;
        const [mes] = await executarQuery(newQuery2).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar dados dashboard!"});
        });

        const newQuery3 = `
            ${query}
            WHERE YEAR(criacao) = YEAR(CURDATE())
        `;
        const [ano] = await executarQuery(newQuery3).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar dados dashboard!"});
        });

        return {
            dia: dia,
            mes: mes,
            ano: ano,
        };
    }

    static async dinamico(query, filter, inicio, final) {
        const newQuery = `
            WHERE criacao BETWEEN ${inicio} AND ${final}
        `;
        const [results] = await executarQuery(newQuery);
        return results;
    }
};

export default filtrosWhere;
