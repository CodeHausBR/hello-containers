import extenso from "extenso";
import serResponse from "../../../helpers/response/setResponse.js";

const formatarTexto = class formatarTexto {
    static numero_por_extenso({value = String}){
            try {
                const newValue = String(value).replace(".", ",");
                const valorExtenso = extenso(newValue);
                return valorExtenso;
            } catch (error) {
                return serResponse.WARNING({message: "Erro ao transformar número em escrito"});
            }
        }
}

export default formatarTexto