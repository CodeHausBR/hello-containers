//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import onda_imobiliaria_config from "../../models/mongoose/onda_imobiliaria_config.js";

//SERVICES

const controllerImobiliaria = class controllerImobiliaria {
    static async cadastrarConfigTaxaImob(req, res) {
        try {
            const dadosBody = req?.body;

            const results = await onda_imobiliaria_config.create({dadosBody: dadosBody});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar executivo!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarTaxasImobiliariaCod(req, res) {
        try {
            const {cod} = req?.params;

            const results = await onda_imobiliaria_config.getOneByCod({cod: cod});

            return setResponse.SUCCESS({message: "Sucesso ao buscar executivo!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerImobiliaria;
