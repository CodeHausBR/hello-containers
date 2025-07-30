//helpers
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

// Relacionamentos com o user da imobiliária

const onda_docs = class onda_docs {
    static async verificarSeExistemArquivosPendentes({matrix}) {
        const query = `
            SELECT 
                COUNT(*) AS docsPendentes
            FROM onda_docs
            WHERE onda_docs_matrix = '${matrix}'
            AND onda_docs_status IN(1000, 1004)
           
        `;

        const [qtddArquivosPendentes] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar arquivos pendentes!"});
        });

        return qtddArquivosPendentes;
    }
};

export default onda_docs;
