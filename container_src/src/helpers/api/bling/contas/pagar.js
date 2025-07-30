//BIBLIOTECAS
import "dotenv/config";
//HELPERS

//BANCO DE DADOS

const URL_BLING_ERP = process.env.URL_BLING_ERP;

const apiBlingContasPagar = class apiBlingContasPagar {
    static async cadastrar() {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const raw = JSON.stringify({
            contato: {
                id: "<integer>",
            },
            valor: "<float>",
            vencimento: "<date>",
            formaPagamento: {
                id: "<integer>",
            },
            saldo: "<float>",
            dataEmissao: "<date>",
            numeroDocumento: "<string>",
            competencia: "<date>",
            historico: "<string>",
            portador: {
                id: "<integer>",
            },
            categoria: {
                id: "<integer>",
            },
            ocorrencia: {
                tipo: 1,
            },
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        await fetch(`${URL_BLING_ERP}/contas/pagar`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }

    static async buscarTodas() {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        await fetch(
            `${URL_BLING_ERP}/contas/pagar?pagina=1&limite=100&dataEmissaoInicial=<date>&dataEmissaoFinal=<date>&dataVencimentoInicial=<date>&dataVencimentoFinal=<date>&dataPagamentoInicial=<date>&dataPagamentoFinal=<date>&situacao=4&idContato=<integer>`,
            requestOptions
        )
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }

    static async buscaPeloId() {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        await fetch(`${URL_BLING_ERP}/Api/v3/contas/pagar/<integer>`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }

    static async atualizaPeloId({id}) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const raw = JSON.stringify({
            contato: {
                id: "<integer>",
            },
            valor: "<float>",
            vencimento: "<date>",
            formaPagamento: {
                id: "<integer>",
            },
            saldo: "<float>",
            dataEmissao: "<date>",
            numeroDocumento: "<string>",
            competencia: "<date>",
            historico: "<string>",
            portador: {
                id: "<integer>",
            },
            categoria: {
                id: "<integer>",
            },
            ocorrencia: {
                tipo: 1,
            },
        });

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        await fetch(`${URL_BLING_ERP}/contas/pagar/${id}`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }

    static async deletaPeloId({id}) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const requestOptions = {
            method: "DELETE",
            headers: myHeaders,
            redirect: "follow",
        };

        await fetch(`${URL_BLING_ERP}/contas/pagar/${id}`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }
};

export default apiBlingContasPagar;
