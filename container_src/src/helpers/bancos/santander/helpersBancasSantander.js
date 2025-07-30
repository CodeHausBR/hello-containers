//BIBLIOTECAS

//HELPERS
import setResponse from "../../response/setResponse";
//BANCO DE DADOS

//SERVICES

const CLIENT_ID_SANTANDER = process.env.CLIENT_ID_SANTANDER;
const CLIENTE_SECRET_SANTANDER = process.env.CLIENTE_SECRET_SANTANDER;
const BASE_URL_SANTANDER = process.env.BASE_URL_SANTANDER;

const helpersBancasSantander = class helpersBancasSantander {
    static async gerar_token_auth_santander() {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

        const urlencoded = new URLSearchParams();
        urlencoded.append("client_id", CLIENT_ID_SANTANDER);
        urlencoded.append("client_secret", CLIENTE_SECRET_SANTANDER);
        urlencoded.append("grant_type", "client_credentials");

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: urlencoded,
            redirect: "follow",
        };

        const auth_santander = await fetch(`${BASE_URL_SANTANDER}}/auth/oauth/v2/token`, requestOptions)
            .then((response) => response.json())
            .catch((error) => {
                return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao gerar o token no santander!"});
            });

        return auth_santander?.data?.access_token;
    }

    static async criar_workspace_do_tipo_pagamentos() {
        const myHeaders = new Headers();
        myHeaders.append("X-Application-Key", CLIENT_ID_SANTANDER);
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", await this.gerar_token_auth_santander());

        const raw = JSON.stringify({
            type: "PAYMENTS",
            mainDebitAccount: {
                branch: 1,
                number: 130392838,
            },
            additionalDebitAccounts: [
                {
                    branch: 1,
                    number: 130380064,
                },
            ],
            tags: ["client:123", "11/05/2023"],
            description: "TesteKamila-sandbox",
            webhookURL: "https://www.teste.com.br",
            pixPaymentsActive: true,
            bankSlipPaymentsActive: true,
            barCodePaymentsActive: true,
            taxesByFieldPaymentsActive: true,
            vehicleTaxesPaymentsActive: true,
            bankSlipAvailableActive: true,
            bankSlipAvailableWebhookActive: false,
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        const new_workspace = await fetch(`${BASE_URL_SANTANDER}}/management_payments_partners/v1/workspaces`, requestOptions)
            .then((response) => response.json())

            .catch((error) => console.error(error));

        return new_workspace?.data;
    }

    static async buscar_workspace_id() {}

    static async iniciar_pagamento_tipo_dict_pix() {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("X-Application-Key", "godFAQmscNj4AzK3kzQb0VrgmZ1npw0i");
        myHeaders.append("Authorization", await this.gerar_token_auth_santander());

        const raw = JSON.stringify({
            tags: ["Teste", "22/11"],
            paymentValue: "80.80",
            remittanceInformation: "informação da transferência",
            dictCode: "chavepix@teste.com",
            dictCodeType: "EMAIL",
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        const iniciar_pagamento = await fetch(`${BASE_URL_SANTANDER}}/management_payments_partners/v1/workspaces/a75eb0d1-1878-4200-bf89-4cb1558a895c/pix_payments`, requestOptions)
            .then((response) => response.json())
            .catch((error) => console.error(error));

        return iniciar_pagamento;
    }
};

export default helpersBancasSantander;
