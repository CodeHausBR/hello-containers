//BIBLIOTECAS

//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import json from "../../../utils/formatar/json.js";

//UTILS
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";

//MODELS
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";

const servicesComercialQuery = class servicesComercialQuery {
    static async buscarArrayStatusComercial_query() {
        const query = ` SELECT *  FROM onda_status WHERE onda_status_setor = 'comercial'`;

        const statusSetorAnalise = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
        });

        if (statusSetorAnalise.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar status pelo setor!"});
        }
        const arrayStatus = await json.keyToArrayString(statusSetorAnalise, "onda_status_id");
        return arrayStatus;
    }

    static async atualizarStatusComercial_query(dadosValidados) {
        const query = `                    
            UPDATE onda_cartafianca AS CF
                INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                SET 
                    ${updateStatusFinanceiro()}
                    CF.onda_cartafianca_status_comercial = '${dadosValidados.status}'
            WHERE CO.onda_contratos_contrato = '${dadosValidados.cod}'
        `;

        function updateStatusFinanceiro() {
            if (["310", "309", "305", "301", "318"].includes(dadosValidados.status)) {
                return `
                    CF.onda_cartafianca_status_financeiro = '998',
                `;
            } else {
                return "";
            }
        }

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status análise!"});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar o status comercial!"});
        }

        if (results?.changedRows === 0) {
            const results = await onda_cartafianca.getOneNotResView(dadosValidados?.cod);
            return setResponse.WARNING({message: "O Status já foi atualizado!", results: results});
        }
        return;
    }
};

export default servicesComercialQuery;
