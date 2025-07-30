//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS

//SERVICES
// pega um array de objetos percorre ele achando uma key passada por props e transforma todos os itens
// em um array de string com cada key achada e retorna um array de strings dos itens achados da key
const json = class json {
    static keyToArrayString(arrayObjetos, keyObjeto) {
        try {
            const arrayDeString = arrayObjetos.map((obj) => obj?.[keyObjeto]?.toString());

            return arrayDeString;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao gerar array de string!"});
        }
    }
    static keyToArrayNumber(arrayObjetos, keyObjeto) {
        try {
            const arrayDeString = arrayObjetos.map((obj) => Number(obj?.[keyObjeto]?.toString()));

            return arrayDeString;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao gerar array de string!"});
        }
    }
};

export default json;
