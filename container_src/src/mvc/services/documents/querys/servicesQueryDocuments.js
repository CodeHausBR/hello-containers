//BIBLIOTECAS
//HELPERS
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../../helpers/response/setResponse.js";
import json from "../../../utils/formatar/json.js";
//BANCO DE DADOS

//SERVICES

const servicesDocumentsQuery = class servicesDocumentsQuery {
    static async solicitarDocumentos_query(dadosValidados) {
        const query = `
            INSERT INTO onda_docs (
                onda_docs_matrix, 
                onda_docs, 
                onda_docs_date, 
                onda_docs_original_name, 
                onda_docs_name, 
                onda_docs_typefile_id, 
                onda_docs_status
              ) 
              VALUES (
                '${dadosValidados?.cod}', 
                'aguardando arquivo', 
                '0000-00-00 00:00:00', 
                'aguardando arquivo', 
                'aguardando arquivo', 
                '${dadosValidados?.typeFileId}', 
                '1004'
            );
        `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: `Erro ao solicitar arquivo: ${err}`});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel solicitar arquivo!"});
        }

        return;
    }
};

export default servicesDocumentsQuery;
