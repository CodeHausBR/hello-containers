//BIBLIOTECAS

//HELPERS
import queryDashboard from "./query-dashboard.js";
//BANCO DE DADOS

//SERVICES

const generateQuery = class generateQuery {
    static geral(querys) {
        let consultas = ``;
        newQuery();
        async function newQuery() {
            querys.forEach((filtros, index) => {
                if (querys.length == index + 1) {
                    //Ultima linha so SQL sem vingula
                    return (consultas = `${consultas} ${queryDashboard.diaMesAnoSemanas(filtros)}`);
                } else {
                    //Linha do mysql com virgula
                    return (consultas = `${consultas} ${queryDashboard.diaMesAnoSemanas(filtros)},`);
                }
            });
        }

        return consultas;
    }

    static retirarkeysVazias(dadosValidados = {}) {
        let obj = dadosValidados;
        obj = Object.fromEntries(
            Object.entries(obj).filter(
                ([key, value]) => value?.length != 0 && value !== undefined && value !== null && value !== "" && value !== "undefined" && value !== "null" && value !== "NaN"
            )
        );

        return obj;
    }

    static retirarkeysNull(dadosValidados = {}) {
        let obj = dadosValidados;
        obj = Object.fromEntries(Object.entries(obj).filter(([key, value]) => value !== null && value !== "" && value !== undefined));

        return obj;
    }
};

export default generateQuery;
