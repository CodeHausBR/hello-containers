import axios from "axios";
import setResponse from "../../response/setResponse.js";
import "dotenv/config";

const apiLocatario = class apiLocatario {
    static async registerLocatarioSystem({cod}) {
        const data = JSON.stringify({
            cod,
        });

        const config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/wave/register`,
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer X3VMB4lQB5t4vJX11896smYH5",
            },
            data: data,
        };

        try {
            const response = await axios.request(config);
        } catch (error) {
            return error;
        }
    }

    static async login(res) {
        try {
            const loginLocatario = {
                email: process.env.USER_WAVE_USER_LOCATARIO,
                password: process.env.USER_WAVE_AUTH_LOCATARIO,
            };

            const response = await axios.post(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/login`, loginLocatario);

            if (!response || (response.status !== 200 && response.status !== 201)) {
                return setResponse.WARNING({
                    message: "Falha ao conectar ao endereço na URL externa.",
                });
            }

            const tokenLocatario = response.data?.results?.token;

            if (!tokenLocatario) {
                return setResponse.WARNING({
                    message: "Token inexistente.",
                    res: res,
                });
            }

            return tokenLocatario;
        } catch (error) {
            return setResponse.WARNING({
                message: "Erro na requisição de login",
            });
        }
    }

    static async updateAddres(tokenLocatario, locatario, userId) {
        try {
            const updatedAddressDataLocatario = {
                name: locatario.locatarioRua,
                postalCode: locatario.locatarioCep,
                neighborhood: locatario.locatarioBairro,
                number: locatario.locatarioNumero,
                city: locatario.locatarioCidade,
                state: locatario.locatarioUf,
                country: "Brasil",
                complement: locatario.locatarioComplemento,
                updateDate: new Date(),
            };

            const type = "update locatario";

            const response = await axios.patch(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/updateaddress/${userId}/${type}`, updatedAddressDataLocatario, {
                headers: {
                    Authorization: "Bearer " + tokenLocatario,
                    Accept: "application/json",
                    "Content-type": "application/json",
                },
            });

            if (!response || (response.status !== 200 && response.status !== 201)) {
                return setResponse.WARNING({
                    message: "Falha ao conectar ao endereço na URL externa.",
                });
            }

            const resultUpdate = response.data?.results;
            return resultUpdate;
        } catch (error) {
            return setResponse.WARNING({
                message: "Falha ao atualizar endereço no locatário.",
            });
        }
    }

    static async updateContact(tokenLocatario, locatario, userId) {
        try {
            const updateRequests = [];

            if (locatario.locatarioCelular) {
                const updatedContactDataLocatario = {
                    name: locatario.locatarioNome,
                    value: locatario.locatarioCelular,
                    type: "phone",
                    isMain: true,
                };

                const type = "update locatario";

                updateRequests.push(
                    axios.patch(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/updatecontacts/${userId}/${type}`, updatedContactDataLocatario, {
                        headers: {
                            Authorization: "Bearer " + tokenLocatario,
                            Accept: "application/json",
                            "Content-type": "application/json",
                        },
                    })
                );
            }

            if (locatario.locatarioEmail) {
                const updatedContactDataLocatario = {
                    name: locatario.locatarioNome,
                    value: locatario.locatarioEmail,
                    type: "email",
                    isMain: true,
                };

                const type = "update locatario";

                updateRequests.push(
                    axios.patch(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/updatecontacts/${userId}/${type}`, updatedContactDataLocatario, {
                        headers: {
                            Authorization: "Bearer " + tokenLocatario,
                            Accept: "application/json",
                            "Content-type": "application/json",
                        },
                    })
                );
            }

            if (updateRequests.length > 0) {
                const responses = await Promise.all(updateRequests);
                return responses.map((response) => response.data?.results);
            } else {
                return setResponse.WARNING({
                    message: "Nenhum dado para atualizar.",
                });
            }
        } catch (error) {
            return setResponse.WARNING({
                message: "Falha ao atualizar contato no locatário.",
            });
        }
    }

    static async updateCorent(tokenLocatario, locatario, userId, corentType, contractId) {
        try {
            const updateRequests = [];

            if (locatario.locatarioCopart1) {
                const updatedCorentDataLocatario = {
                    name: locatario.locatarioCopart1,
                    contractId: contractId,
                };
                const type = "update locatario";

                updateRequests.push(
                    axios.patch(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/updatecorent/${userId}/${type}/${corentType}`, updatedCorentDataLocatario, {
                        headers: {
                            Authorization: "Bearer " + tokenLocatario,
                            Accept: "application/json",
                            "Content-type": "application/json",
                        },
                    })
                );
            }

            if (locatario.locatarioCopart1renda) {
                const updatedCorentDataLocatario = {
                    income: locatario.locatarioCopart1renda,
                    contractId: contractId,
                };

                const type = "update locatario";

                updateRequests.push(
                    axios.patch(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/updatecorent/${userId}/${type}/${corentType}`, updatedCorentDataLocatario, {
                        headers: {
                            Authorization: "Bearer " + tokenLocatario,
                            Accept: "application/json",
                            "Content-type": "application/json",
                        },
                    })
                );
            }

            if (locatario.locatarioCopart2) {
                const updatedCorentDataLocatario = {
                    name: locatario.locatarioCopart2,
                    contractId: contractId,
                };

                const type = "update locatario";

                updateRequests.push(
                    axios.patch(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/updatecorent/${userId}/${type}/${corentType}`, updatedCorentDataLocatario, {
                        headers: {
                            Authorization: "Bearer " + tokenLocatario,
                            Accept: "application/json",
                            "Content-type": "application/json",
                        },
                    })
                );
            }

            if (locatario.locatarioCopart2renda) {
                const updatedCorentDataLocatario = {
                    income: locatario.locatarioCopart2renda,
                    contractId: contractId,
                };

                const type = "update locatario";

                updateRequests.push(
                    axios.patch(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/updatecorent/${userId}/${type}/${corentType}`, updatedCorentDataLocatario, {
                        headers: {
                            Authorization: "Bearer " + tokenLocatario,
                            Accept: "application/json",
                            "Content-type": "application/json",
                        },
                    })
                );
            }

            if (updateRequests.length > 0) {
                const responses = await Promise.all(updateRequests);
                return responses.map((response) => response.data?.results);
            } else {
                return setResponse.WARNING({
                    message: "Nenhum dado para atualizar.",
                });
            }
        } catch (error) {
            return setResponse.WARNING({
                message: "Falha ao atualizar coparticipante no locatário.",
            });
        }
    }

    static async getContractIdFromLocatario(userId, tokenLocatario) {
        try {
            const response = await axios.get(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/sendcontractlocatariowave/${userId}`, {
                headers: {
                    Authorization: "Bearer " + tokenLocatario,
                    Accept: "application/json",
                    "Content-type": "application/json",
                },
            });
            if (!response || (response.status !== 200 && response.status !== 201)) {
                return setResponse.WARNING({
                    message: "Falha ao conectar ao endereço na URL externa.",
                });
            }

            const contractId = response?.data?.results._id;

            if (userId) {
                return contractId;
            } else {
                return setResponse.WARNING({
                    message: "Contrato não existe.",
                });
            }
        } catch (error) {
            return setResponse.WARNING({
                message: "Falha ao buscar Contrato!",
            });
        }
    }

    static async getUserIdFromLocatario(cnpjcpf, tokenLocatario) {
        try {
            const response = await axios.get(`${process.env.PRIVATE_LOCATARIO_WAVE_URL}/user/sendlocatariowave/${cnpjcpf}`, {
                headers: {
                    Authorization: "Bearer " + tokenLocatario,
                    Accept: "application/json",
                    "Content-type": "application/json",
                },
            });
            if (!response || (response.status !== 200 && response.status !== 201)) {
                return setResponse.WARNING({
                    message: "Falha ao conectar ao endereço na URL externa.",
                });
            }

            const locatarioCnpjcpf = response?.data?.results.cnpjcpf;
            const userId = response?.data?.results._id;

            if (locatarioCnpjcpf === cnpjcpf) {
                return userId;
            } else if (locatarioCnpjcpf !== cnpjcpf) {
                return setResponse.WARNING({
                    message: "Locatário não existe.",
                });
            }
        } catch (error) {
            return setResponse.WARNING({
                message: "Falha ao buscar locatário!",
            });
        }
    }
};

export default apiLocatario;
