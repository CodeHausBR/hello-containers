import onda_followup from "../../../mvc/models/public/onda_followup.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";
const BASE_URL_WORKER_FINANCEIRO = process.env.BASE_URL_WORKER_FINANCEIRO;

const api_worker_financeiro = class api_worker_financeiro {
    static headers(token) {
        return new Headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        });
    }

    static async criar_cliente_worker_financeiro({cartafianca, token, bearerToken}) {
        if (!cartafianca || !token) return;

        const cliente_cartafianca = {
            data: {
                cliente: {
                    nome: cartafianca?.locatario,
                    email: cartafianca?.locatarioEmail,
                    referencia_externa: cartafianca?.locatarioUuid,
                    cpf_cnpj: cartafianca?.cpf,
                    celular: cartafianca?.celular,
                },
            },
        };

        const results = await fetch(`${BASE_URL_WORKER_FINANCEIRO}/financeiro/cliente`, {
            method: "POST",
            headers: this.headers(bearerToken),
            body: JSON.stringify(cliente_cartafianca),
        })
            .then(async (response) => await response.json())
            .then(async (res) => {
                if (res?.results?.data?.cliente?.codigo != cartafianca?.locatarioUuid) {
                    await onda_followup.postFollowup({token: token, cod: cartafianca?.contrato, event: `🤖 *Erro ao gerar cliente no financeiro 🛑`});
                    await onda_errors.postNotRes({
                        classe: "api_worker_financeiro",
                        statico: "criar_cliente_worker_financeiro",
                        message: JSON.stringify(res?.results)?.slice(0, 4900),
                    });
                } else {
                    await onda_followup.postFollowup({token: token, cod: cartafianca?.contrato, event: `🤖 *Sucesso ao gerar cliente no financeiro 🆗`});
                }
            })
            .catch(async (error) => {
                await onda_followup.postFollowup({token: token, cod: cartafianca?.contrato, event: `🤖 *Erro ao gerar cliente no financeiro 🛑`});
            });

        return;
    }

    static async atualiza_cliente_worker_financeiro({cartafianca, token, bearerToken}) {
        if ((!cartafianca, !token, !bearerToken)) return;

        const cliente = await this.buscar_cliente_worker_financeiro_pelo_filtro({
            data: {
                data: {
                    filtros: {
                        cpf_cnpj: cartafianca?.cpf,
                    },
                },
            },
            token: bearerToken,
        });

        if (cliente?.data?.cliente?.length == 0) {
            await this.criar_cliente_worker_financeiro({cartafianca: cartafianca, token: token, bearerToken: bearerToken});
            return;
        }

        const cliente_cartafianca = {
            data: {
                cliente: {
                    nome: cartafianca?.locatario,
                    email: cartafianca?.locatarioEmail,
                    referencia_externa: cartafianca?.locatarioUuid,
                    cpf_cnpj: cartafianca?.cpf,
                    celular: cartafianca?.celular,
                },
            },
        };

        function verificar_chaves_diferentes(dados_padrao_worker, cliente) {
            const resultado = {data: {cliente: {}}};

            const objeto_wave = dados_padrao_worker?.data?.cliente;
            const objeto_worker = cliente?.data?.cliente?.[0];

            for (const chave in objeto_wave) {
                if (objeto_wave.hasOwnProperty(chave)) {
                    const valor_wave = objeto_wave?.[chave];
                    const valor_worker = objeto_worker?.[chave];

                    if (valor_wave !== valor_worker) {
                        resultado.data.cliente[chave] = valor_wave;
                    }
                }
            }

            return resultado;
        }

        const chaves_para_atualizar = verificar_chaves_diferentes(cliente_cartafianca, cliente);

        if (Object.keys(chaves_para_atualizar?.data?.cliente).length > 0) {
            await fetch(`${BASE_URL_WORKER_FINANCEIRO}/financeiro/cliente/${cliente?.data?.cliente?.[0]?._id}`, {
                method: "PATCH",
                body: JSON.stringify(chaves_para_atualizar),
                headers: this.headers(bearerToken),
            })
                .then(async (response) => await response.json())
                .then(async (res) => {
                    if (res?.results?.data?.cliente?.referencia_externa !== cartafianca?.locatarioUuid) {
                        await onda_followup.postFollowup({token: token, cod: cartafianca?.contrato, event: `🤖 *Erro ao atualizar cliente no financeiro 🛑`});
                        await onda_errors.postNotRes({
                            classe: "api_worker_financeiro",
                            statico: "atualiza_clience_worker_financeiro",
                            message: JSON.stringify(res?.results)?.slice(0, 4900),
                        });
                    } else {
                        await onda_followup.postFollowup({token: token, cod: cartafianca?.contrato, event: `🤖 *Sucesso ao atualizar cliente no financeiro 🆗`});
                    }
                })
                .catch(async (error) => {
                    await onda_followup.postFollowup({token: token, cod: cartafianca?.contrato, event: `🤖 *Erro ao atualizar cliente no financeiro 🛑`});
                });
        }

        return;
    }

    static async buscar_cliente_worker_financeiro_pelo_filtro({data, token}) {
        if (!data || !token) return;

        const search_params = new URLSearchParams(data?.data?.filtros);

        const results = await fetch(`${BASE_URL_WORKER_FINANCEIRO}/financeiro/cliente?${search_params.toString()}`, {
            method: "GET",
            headers: this.headers(token),
        })
            .then(async (response) => {
                if (response?.status == 200) {
                    const res = await response.json();
                    return {
                        data: {
                            cliente: res?.results?.data?.cliente,
                        },
                    };
                }
            })
            .catch((error) => {
                return {
                    data: {
                        cliente: [],
                    },
                };
            });

        return results;
    }
};

export default api_worker_financeiro;
