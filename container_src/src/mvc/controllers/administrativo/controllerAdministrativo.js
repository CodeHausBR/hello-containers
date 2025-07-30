//BIBLIOTECAS
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";

//BANCO DE DADOS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

//BANCO DE DADOS

//SERVICES
import servicesAdministrativoValidate from "../../services/administrativo/validate/servicesAdministrativoValidate.js";
import servicesAdministrativoQuery from "../../services/administrativo//query/servicesAdministrativoQuery.js";

const controllerAdministrativo = class controllerAdministrativo {
    static async treinamentoIa(req, res) {
        try {
            const dadosValidados = await servicesAdministrativoValidate.treinamentoIa_validate(req?.body);

            await servicesAdministrativoQuery.treinamentoIa_query(dadosValidados);

            return setResponse.SUCCESS({message: "Análise enviada com sucesso!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerAdministrativo;
