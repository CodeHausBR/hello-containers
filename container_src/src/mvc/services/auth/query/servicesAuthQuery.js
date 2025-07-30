//BIBLIOTECAS

//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
//BANCO DE DADOS

//SERVICES

const servicesAuthQuery = class servicesAuthQuery {
    static async buscarUsuario({dadosBody}) {
        const query = `
            SELECT 
                * 
            FROM VW_AUTH_USERS
            WHERE email = '${dadosBody?.user?.email}'
            LIMIT 1
        `;

        const [usuario] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar e-mail ou senha!"});
        });

        return usuario;
    }
};

export default servicesAuthQuery;
