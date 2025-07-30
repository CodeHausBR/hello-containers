//BIBLIOTECAS
import dotenv from "dotenv";
dotenv.config();
//HELPERS
import setResponse from "./setResponse.js";
import onda_errors from "../../mvc/models/public/onda_errors.js";
import formatarDataHora from "../geral/formatar-data-hora.js";
//BANCO DE DADOS
import onda_followup from "../../mvc/models/public/onda_followup.js";

//SERVICES

const BASE_URL_BUCKET_ONDAS3 = process.env.BASE_URL_BUCKET_ONDAS3;
const BASE_URL_WAVE = process.env.BASE_URL_WAVE;

const httpRequestProvider = class httpRequestProvider {
    static async deletarDocBucket(token, url) {
        if (Array.isArray(url)) {
            for (const item of url) {
                const docsName = item?.docsName;
                await new Promise(async (resolve, reject) => {
                    await deleteDoc(docsName).catch((error) => {
                        return reject(error);
                    });
                    resolve();
                });
            }
        } else if (typeof url === "string") {
            return await deleteDoc(url);
        } else {
            return setResponse.WARNING({message: "Tipo de arquivo errado ao deletar doc"});
        }

        async function deleteDoc(url) {
            const data = await fetch(`${BASE_URL_BUCKET_ONDAS3}/bucket/documentos/${url}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }).catch(() => {
                return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao deletar no post!"});
            });

            const getData = await data.json();

            if (getData?.type !== "success") {
                return setResponse.INTERNAL_REQUEST_API_FAILED({message: getData?.message});
            }

            return;
        }
    }

    static async salvarDocBucket(token, formData, cod) {
        const data = await fetch(`${BASE_URL_BUCKET_ONDAS3}/bucket/documentos/${cod}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        }).catch(async (error) => {
            await onda_followup.postFollowup({token: token, cod: cod, event: "*Erro ao salvar arquivo no bucket!"});
            //return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao salvar arquivo no bucket!"});
            return;
        });
        const getData = await data?.json();

        if (getData?.type != "success") {
            await onda_followup.postFollowup({token: token, cod: cod, event: `*Erro ao enviar arquivo para o bucket!`});
            //return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao enviar arquivo para o bucket!"});
            return;
        }

        return;
    }

    static async salvarDocBucketDeImagem(token, formData, cod) {
        const data = await fetch(`${BASE_URL_BUCKET_ONDAS3}/bucket/imagem/${cod}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        }).catch(async () => {
            await onda_followup.postFollowup({token: token, cod: cod, event: "*Erro ao salvar arquivo no bucket!"});
            //return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao salvar arquivo no bucket!"});
            return;
        });
        const getData = await data?.json();

        if (getData?.type != "success") {
            await onda_followup.postFollowup({token: token, cod: cod, event: `*Erro ao enviar arquivo para o bucket!`});
            //return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao enviar arquivo para o bucket!"});
            return;
        }

        return;
    }

    static async consultarApiIaServidorWave(cpfCnpj, token) {
        const data = await fetch(`${BASE_URL_WAVE}/analise/consulta/ia/${cpfCnpj}}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).catch(async () => {
            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "*Erro ao consultar API WAVE"});
        });

        const getData = await data?.json();

        if (getData?.type != "success") {
            await onda_errors.postNotRes({classe: "httpRequestProvider", statico: "consultarApiIaServidorWave", message: JSON.stringify(getData)?.slice(0, 4900)});

            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "*Erro ao consultar API WAVE"});
        }

        return getData?.results;
    }

    static async escavador(doc) {
        const url = new URL("https://api.escavador.com/api/v2/envolvido/processos");

        let params = {
            cpf_cnpj: doc,
        };

        Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

        let headers = {
            Authorization:
                "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZDdlZDg4ZDQzODc0ZTRlOTZjMjQ2MDk2ZTA5ZjVkNGEyMTM0ZDI3MTRiY2U4YzQ1NTI4NGI4NmYxZTZiOWQwZDNmMTc5YTU1N2VlZmY4YWUiLCJpYXQiOjE3MTM3OTIyMjMuNTQyODgzLCJuYmYiOjE3MTM3OTIyMjMuNTQyODg1LCJleHAiOjIwMjkzMjUwMjMuNTM5OTgzLCJzdWIiOiIxNzYzMjIzIiwic2NvcGVzIjpbImFjZXNzYXJfYXBpX3BhZ2EiXX0.znEfksmk8OWGkx4sHthgNQAyVi5TKQFyKZiwrci4ZA0GPzBFY2Sjl8ziZL-GUlmUyp3suuBe_4nd1ihkovGrbkdgGj0qa0lcMjQaopJnqYJaKThKp_10gGzTTXZNVzMCALnxZSlHHLPDXPrG1ARswm4gg6TlCT3EpHO8u3lmGcbyPpeQCOtfBBbqWf8b9dHOVwxBO6xZOzBYkjm5h1aoOrFSPifssITq2hfeQNJ0RQPkJHzQRDwn3gL1cOsEdBeoNHKs-M2SueihQUlbmFrRzg6UHUCcJtWGmeS3duXTJgQLizf4TwZ-9l9d23xslLjE_O4W3lbAY3saMhfyC4T5ZVzdBtfPXmR2OxxltCUIGVXDsVMfnj5GADqmUBl4R3oVtvS7w1gRfUxWkw5Gqh_IvcFwAcRCpljtW11h7_5rASLAG8CEGQMGAwjCgjiJmutQ7HD6zUlCRj2-Hd8fX20tmnUdH5Gkcog_v5byirBPWWEadqxvunPs_jelO_Z6LkObwFTxK0HN1cZq2HxpLOdWmznWuqIMZCFYyPBbWzYNVRV-dXhP6P5X8uEypHcdqw3Fq4DW6G2nQMNkywpARNmpQW27BTFZaA0vDiQTIq0TvUr_VUQf35DrnimneHJElq4epB_qLIppTRljFEuuJgj0x0i0PLAM3KdBj7fJz9IgQzY",
            "X-Requested-With": "XMLHttpRequest",
            Accept: "*/*",
            "Content-Type": "application/json",
        };

        const map = (array) => {
            const mapping = array?.map((a) =>
                a.map(
                    (i) =>
                        `Processo: ${i?.processo_fonte_id}, Local: ${i?.unidade_origem?.cidade}, Tipo: ${i?.capa?.classe}, Estado: ${i?.sigla}, Status: ${
                            i?.capa?.situacao
                        }, Última Atualização: ${formatarDataHora(i?.data_ultima_verificacao)}`
                )
            );

            return mapping.join("\n");
        };

        const filtraReu = (acao) => {
            const resultado = [];
            acao.forEach((arrayDeObjetos) => {
                arrayDeObjetos.forEach((objeto) => {
                    const envolvidos = objeto.envolvidos;

                    envolvidos.forEach((envolvido) => {
                        resultado.push(envolvido);
                    });
                });
            });
            return resultado.filter((r) => r?.tipo == "Réu" || r?.tipo == "Executado" || r?.tipo == "Acusado");
        };

        const data = await fetch(url, {
            method: "GET",
            headers: headers,
        })
            .then(async (response) => {
                const resp = await response?.json();

                if (!resp?.envolvido_encontrado || !resp?.items) {
                    return "WARNING";
                }
                if (resp?.items?.length <= 0) {
                    return null;
                }

                const criminal = resp?.items
                    ?.filter((item) =>
                        item?.fontes?.some(
                            (fonte) =>
                                fonte?.capa?.classe?.includes("Criminal") ||
                                fonte?.capa?.classe?.includes("CRIMINAL") ||
                                fonte?.capa?.orgao_julgador?.includes("CRIMINAL") ||
                                fonte?.capa?.orgao_julgador?.includes("Criminal") ||
                                fonte?.capa?.classe?.includes("PENAL") ||
                                fonte?.capa?.classe?.includes("Penal")
                        )
                    )
                    ?.map((d) => d?.fontes);

                const despejo = resp?.items
                    ?.filter((item) =>
                        item?.fontes?.some(
                            (fonte) =>
                                fonte?.capa?.classe?.includes("Despejo") ||
                                fonte?.capa?.classe?.includes("DESPEJO") ||
                                ((fonte?.capa?.classe?.includes("Execução") ||
                                    fonte?.capa?.classe?.includes("EXECUÇÃO") ||
                                    fonte?.capa?.classe?.includes("Cobrança") ||
                                    fonte?.capa?.classe?.includes("COBRANÇA")) &&
                                    (fonte?.capa?.assunto_principal_normalizado?.nome?.includes("Aluguéis") ||
                                        fonte?.capa?.assunto_principal_normalizado?.nome?.includes("Despejo")))
                        )
                    )
                    ?.map((d) => d?.fontes);

                const criminoso = filtraReu(criminal).filter((i) => i?.nome == resp?.envolvido_encontrado?.nome);
                const despejado = filtraReu(despejo).filter((i) => i?.nome == resp?.envolvido_encontrado?.nome);

                const risco = criminoso?.concat(despejado);
                const desc = criminal?.concat(despejo);

                const descricao = {descricao: map(desc), criminal: criminal?.length > 0 && criminal, despejo: despejo?.length > 0 && despejo};

                if (risco?.length <= 0 || !risco) {
                    return null;
                } else {
                    return descricao;
                }
            })
            .catch(() => {
                return "WARNING";
            });

        return data;
    }

    static async buscarLinkBombaPdfSimulacaoOuAnexo1Bucket(props) {
        const {token, url} = props;

        const data = await fetch(`${BASE_URL_BUCKET_ONDAS3}/bucket/documentos/token/${url}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).catch(() => {
            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao buscar link bomba no bucket!"});
        });

        const getData = await data.json();

        if (getData?.type != "success") {
            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro erro ao buscar link bomba bucket!"});
        } else {
            const tokenBombaGerado = BASE_URL_BUCKET_ONDAS3 + "/bucket/documentos/visualizar/" + getData?.token;

            return tokenBombaGerado;
        }
    }
};

export default httpRequestProvider;
