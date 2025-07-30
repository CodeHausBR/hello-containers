//BIBLIOTECAS
//HELPERS
import helpersServicesValidateAsaas from './helpersServicesValidateAsaas.js';
import setResponse from '../../../response/setResponse.js'
//UTILS
import executarQuery from '../../../../mvc/utils/mysql/funcoesQuery/executarQuery.js'
import axios from 'axios';

//BANCO DE DADOS

//SERVICES
const BASE_URL_ASAAS = process.env.BASE_URL_ASAAS;
const SK_TOKEN_ASAAS = process.env.SK_TOKEN_ASAAS;
const helpersServicesQueryAsaas = class helpersServicesQueryAsaas {
    static async getCustomerClient({codLocatario}){

        const dadosValidados = await helpersServicesValidateAsaas.validateCreateCustomer({codLocatario: codLocatario})

        const query = `
            SELECT
                *
            FROM
                onda_locatario
            WHERE
                onda_locatario_codigo = '${dadosValidados?.codLocatario}'
            LIMIT 1;
        `

        const [result] = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar customer id"})
        })

        return result
    }


    static async getOneCostumerAsaas({ customerId }){
        const options = {
            method: "GET",
            url: `${BASE_URL_ASAAS}/customers/${customerId}`,
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                access_token: SK_TOKEN_ASAAS
            }
        }

        const costumer = axios
        .request(options)
        .then((res) => {
            return res?.data
        })
        .catch(() => {
            return null
        })

        return costumer
    }
};

export default helpersServicesQueryAsaas;