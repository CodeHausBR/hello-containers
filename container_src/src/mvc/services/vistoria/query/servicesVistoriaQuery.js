//BIBLIOTECAS

//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import json from "../../../utils/formatar/json.js";
//BANCO DE DADOS
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
//SERVICES

const servicesVistoriaQuery = class servicesVistoriaQuery {
    static async atualizarStatusVistoria_query(dadosValidados) {
        const query = `                    
            UPDATE onda_cartafianca AS CF
                INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                SET 
                    CF.onda_cartafianca_status_vistoria = ${dadosValidados.status}
            WHERE CO.onda_contratos_contrato = '${dadosValidados.cod}'
        ;`;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status vistoria!"});
        });

        const newresultsCf = await onda_cartafianca.getOneNotResView(dadosValidados?.cod);

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar o status vistoria!", results: newresultsCf});
        }

        if (results?.changedRows === 0) {
            return setResponse.WARNING({message: "O status vistoria já foi atualizado!", results: newresultsCf});
        }

        if (results?.changedRows === 0) {
            return setResponse.WARNING({message: "O Status já foi atualizado!", results: newresultsCf});
        }
        return newresultsCf;
    }

    static async buscarArrayStatusVistoria_query() {
        const query = ` SELECT *  FROM onda_status  WHERE onda_status_setor = 'vistoria'`;

        const statusSetorAnalise = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
        });

        if (statusSetorAnalise.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar status pelo setor!"});
        }
        const arrayStatus = await json.keyToArrayString(statusSetorAnalise, "onda_status_id");
        return arrayStatus;
    }
    static async atualizarImovelNaCartaFiancaComBaseNoAgendamentoDeVistoria({id_imovel, contrato}) {
        
    }
};


export default servicesVistoriaQuery;
