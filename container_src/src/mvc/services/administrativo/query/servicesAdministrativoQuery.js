//BIBLIOTECAS

//HELPERS
import json from "../../../utils/formatar/json.js";
import setResponse from "../../../../helpers/response/setResponse.js";
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
//UTILS
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";

//SERVICES

const servicesAdministrativoQuery = class servicesAdministrativoQuery {
    static async treinamentoIa_query(dadosQuery) {
        const query = `
        INSERT INTO ia_treinamento (
            ia_treinamento_cpfcnpj,
            ia_treinamento_locatario,
            ia_treinamento_idade,
            ia_treinamento_protesto,
            ia_treinamento_juridico_execucao,
            ia_treinamento_juridico_criminal,
            ia_treinamento_juridico_trabalhista,
            ia_treinamento_juridico_despejo,
            ia_treinamento_dividas_contasconsumo,
            ia_treinamento_dividas_cartaodecredito,
            ia_treinamento_dividas_financiamentos,
            ia_treinamento_dividas,
            ia_treinamento_sexo,
            ia_treinamento_imigrante,
            ia_treinamento_aprovado,
            ia_treinamento_uf
        ) VALUES (
            '${dadosQuery?.ia_treinamento_cpfcnpj}',
            '${dadosQuery?.ia_treinamento_locatario}',
            '${dadosQuery?.ia_treinamento_idade}',
            '${+dadosQuery?.ia_treinamento_protesto}',
            '${+dadosQuery?.ia_treinamento_juridico_execucao}',
            '${+dadosQuery?.ia_treinamento_juridico_criminal}',
            '${+dadosQuery?.ia_treinamento_juridico_trabalhista}',
            '${+dadosQuery?.ia_treinamento_juridico_despejo}',
            '${+dadosQuery?.ia_treinamento_dividas_contasconsumo}',
            '${+dadosQuery?.ia_treinamento_dividas_cartaodecredito}',
            '${+dadosQuery?.ia_treinamento_dividas_financiamentos}',
            '${+dadosQuery?.ia_treinamento_dividas}',
            '${dadosQuery?.ia_treinamento_sexo}',
            '${+dadosQuery?.ia_treinamento_imigrante}',
            '${dadosQuery?.ia_treinamento_aprovado}',
            '${dadosQuery?.ia_treinamento_uf}'
        );`;

        await executarQuery(query).catch((e) => {
            console.log(e);
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar treinamento ia!"});
        });
    }
};

export default servicesAdministrativoQuery;
