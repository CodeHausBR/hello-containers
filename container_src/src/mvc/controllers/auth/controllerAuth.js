//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import createOndaExecParcToken from "../../../helpers/token/create-onda-exec-parc-token.js";
//BANCO DE DADOS

//SERVICES
import servicesAuthQuery from "../../../mvc/services/auth/query/servicesAuthQuery.js";
import servicesAuthValidate from "../../../mvc/services/auth/validate/servicesAuthValidate.js";

const controllerAuth = class controllerAuth {
    static async loginOndaExecutivosParceiros(req, res) {
        try {
            const dadosBody = req?.body;
            const dadosValidados = await servicesAuthValidate.schema({dadosBody: dadosBody});

            const usuario = await servicesAuthQuery.buscarUsuario({dadosBody: dadosValidados});

            await servicesAuthValidate.verificarSenha({usuario: usuario, dadosBody: dadosValidados});

            await servicesAuthValidate.verificarEmail({usuario: usuario});

            const token = await createOndaExecParcToken({usuario: usuario});

            return setResponse.SUCCESS({message: "Sucesso ao logar usuário!", results: token, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerAuth;
