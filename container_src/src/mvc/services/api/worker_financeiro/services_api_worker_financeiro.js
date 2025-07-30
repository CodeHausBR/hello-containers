//BIBLIOTECAS
import dotenv from "dotenv";
dotenv.config();
//HELPERS
import onda_errors from "../../../models/public/onda_errors.js";
//BANCO DE DADOS

//SERVICES

const SET_URL_BACKEND_WORKER_FINANCEIRO = process.env.SET_URL_BACKEND_WORKER_FINANCEIRO;

const services_api_worker_financeiro = class services_api_worker_financeiro {
    static cliente = class cliente {
        static async criar({ token, cliente }) {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", `Bearer ${token}`);

            const raw = JSON.stringify({
                data: {
                    cliente: {
                        nome: cliente?.nome,
                        email: cliente?.email,
                        codigo: cliente?.codigo,
                        cpf_cnpj: cliente?.cpf_cnpj,
                        celular: cliente?.celular,
                    },
                },
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };

            const response = await fetch(`${SET_URL_BACKEND_WORKER_FINANCEIRO}/financeiro/cliente`, requestOptions);

            const responseData = await response.json();
            console.log(responseData, "responseData");

            if (response.ok === false) {
                await onda_errors.postNotRes({ classe: "services_api_worker_financeiro.cliente", statico: "criar", message: responseData });
            }

            return {
                data: {
                    cliente: responseData?.results?.data?.cliente,
                },
            };
        }
    };
};

export default services_api_worker_financeiro;
