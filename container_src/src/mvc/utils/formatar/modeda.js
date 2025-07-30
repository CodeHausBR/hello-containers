//BIBLIOTECAS
import extenso from "extenso";
//HELPERS
import serResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS

//SERVICES

const moeda = class moeda {
    static format(value = Number) {
        try {
            const newValue = Number(value);
            const moedaFormatada = newValue.toLocaleString("pt-BR", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            return moedaFormatada;
        } catch (error) {
            return serResponse.WARNING({message: "Erro ao transformar moeda em R$"});
        }
    }
    static escrito(value = String) {
        try {
            const newValue = String(value).replace(".", ",");
            const valorExtenso = extenso(newValue, {mode: "currency", currency: {type: "BRL"}});
            return valorExtenso;
        } catch (error) {
            return serResponse.WARNING({message: "Erro ao transformar R$ em escrito"});
        }
    }
};

export default moeda;
