//BIBLIOTECAS
import crypto from "crypto";
//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
//BANCO DE DADOS
import onda_user from "../../../models/users/onda_user.js";
//SERVICES


const servicesUsersQuery = class servicesUsersQuery {
    static async buscarContasExecutivo({token, ano, mes}) {
        try {
            const contaRecebedorTipoId = 205;
            
            const query = `
            SELECT *
            FROM VW_CONTAS
            WHERE contaExecutivoId = ${token.onda_user_id}
            AND contaRecebedorTipoId = ${contaRecebedorTipoId} 
            AND contaCategoria = 174 
            AND YEAR(contaDataCriacao) = ${ano}
            AND MONTH(contaDataCriacao) = ${mes}
            `;

            const result = await executarQuery(query);
              return result

        } catch (error) {
            console.log(error, "error");
            
            return setResponse.WARNING({message: "Erro ao buscar contas do executivo"})
        }
    };

    static async buscarComissoesDoParceiro({token, ano, mes}) {
        try {
            const contaRecebedorTipoId = 202;
            
            const query = `
            SELECT *
            FROM VW_CONTAS
            WHERE contaParceiroId = ${token.onda_user_id}
            AND contaRecebedorTipoId = ${contaRecebedorTipoId} 
            AND contaCategoria = 175 
            AND YEAR(contaDataCriacao) = ${ano}
            AND MONTH(contaDataCriacao) = ${mes}
            `;

            const result = await executarQuery(query);
              return result

        } catch (error) {
            console.log(error, "error");
            
            return setResponse.WARNING({message: "Erro ao buscar contas do parceiro"})
        }
    };
};

export default servicesUsersQuery;
