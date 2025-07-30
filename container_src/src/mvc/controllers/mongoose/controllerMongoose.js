//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import VW_CARTAFIANCA_GERAL from "../../models/mongoose/VW_CARTAFIANCA_GERAL.js";
import VW_CONTAS from "../../models/mongoose/VW_CONTAS.js";
//SERVICES

const controllerMongoose = class controllerMongoose {
    static async sincronizarDadosCartaFianca(req, res) {
        try {
            await VW_CARTAFIANCA_GERAL.sincronizarBancos();

            return setResponse.SUCCESS({message: "Sucesso ao sincornizar carta fiança com o pagarme!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async sincronizarDadosContas(req, res) {
        try {
            setResponse.SUCCESS({message: "Sucesso ao sincornizar contas com o pagarme!", res: res});

            await VW_CONTAS.sincronizarBancos();

            return;
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerMongoose;
