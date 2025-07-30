//BIBLIOTECAS

//HELPERS
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../../helpers/response/setResponse.js";
//BANCO DE DADOS

//SERVICES

const servicesPublicQuery = class servicesPublicQuery {
    
    static async buscar_onda_helpers_filtro(props) {

        const {onda_helpers_setor} = props
        const query = `
            SELECT 
                onda_helpers_id AS id,
                onda_helpers_descricao AS value
            FROM onda_helpers
            WHERE onda_helpers_setor = '${onda_helpers_setor}'
        `;
        
        const result = await executarQuery(query).catch((error) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda helpers"})
        });

        return result;
    }
};

export default servicesPublicQuery;
