//BIBLIOTECAS
import "dotenv/config";
//HELPERS

//BANCO DE DADOS

//SERVICES

const URL_BLING_ERP = process.env.URL_BLING_ERP;

const apiBlingContasReceber = class apiBlingContasReceber {
    static async criaUmaContaAReceber() {
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
            vendedor: {
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

        await fetch(`${URL_BLING_ERP}/contas/receber`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }

    static async obtemContasAReceber() {
        const myHeaders = new Headers();
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        await fetch(
            `${URL_BLING_ERP}/contas/receber?pagina=1&limite=100&situacoes[]=4&tipoFiltroData=E&dataInicial=<date>&dataFinal=<date>&idsCategorias[]=<integer>&idsCategorias[]=<integer>&idPortador=<integer>&idContato=<integer>&idVendedor=<integer>&idFormaPagamento=<integer>&boletoGerado=0`,
            requestOptions
        )
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }

    static async obtemBoletosDeContasAReceber() {
        const myHeaders = new Headers();
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        await fetch(`${URL_BLING_ERP}/contas/receber/boletos?idOrigem=<integer>&situacoes[]=1`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }

    static async cancelaBoletosDeContasAReceber({id}) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Cookie", "PHPSESSID=7ph2tp6nve7h07drj1lqb3glvf");

        const raw = JSON.stringify({
            motivo: "<string>",
            autenticacao: {
                tipo: 4,
                codigo: "<string>",
            },
            origem: {
                id: "<integer>",
            },
            conta: {
                id: "<integer>",
            },
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        await fetch(`${URL_BLING_ERP}/contas/receber/boletos/cancelar`, requestOptions)
            .then((response) => response.text())
            .then((result) => console.log(result))
            .catch((error) => console.error(error));
    }
};

export default apiBlingContasReceber;
