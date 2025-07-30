import apiLocatario from "../../../helpers/api/locatario/api-locatario.js";
import setResponse from "../../../helpers/response/setResponse.js";
import onda_locatario from "../../models/analise/onda_locatario.js";
import serviceLocatarioQuery from "../../services/locatario/query/serviceLocatarioQuery.js";

const contollerLocatario = class contollerLocatario {
    static async atualizarLocatario(req, res) {
        try {
            const {cod, type, corentType} = req?.params;
            const {locatario, token} = req?.body;
            //TODO: pegar o contractId por palavrachave por meio de dados similares entre bancos wave - locatario
            const verifyExists = await onda_locatario.getOneNotRes(cod);
            if (!verifyExists) {
                return setResponse.WARNING({message: "O locatário não existe!"});
            }
            const results = await onda_locatario.patchNotRes(locatario, token, cod);
            const newLocatario = await onda_locatario.getOneNotRes(cod);

            if (results === 0) {
                return setResponse.WARNING({
                    message: "Sem atualizações para salvar!",
                    results: newLocatario,
                });
            }

            if (type === "update wave") {
                return setResponse.SUCCESS({
                    message: "Sucesso ao atualizar locatário!",
                    results: newLocatario,
                    res: res,
                });
            } else if (type === "update locatario") {
                if (results === 0) {
                    return setResponse.WARNING({
                        message: "Sem atualizações para salvar!",
                        results: newLocatario,
                    });
                }

                const tokenLocatario = await apiLocatario.login(res);

                const cnpjcpf = newLocatario?.dataValues?.locatarioCnpjcpf;

                if (!cnpjcpf) {
                    return setResponse.WARNING({message: "CNPJ/CPF do locatário não encontrado!"});
                }

                const userId = await apiLocatario.getUserIdFromLocatario(cnpjcpf, tokenLocatario);

                const contractId = await apiLocatario.getContractIdFromLocatario(userId, tokenLocatario);

                const newMicrosservicesLocatarioAddress = await apiLocatario.updateAddres(tokenLocatario, locatario, userId);
                const newMicrosservicesLocatarioContact = await apiLocatario.updateContact(tokenLocatario, locatario, userId);
                const newMicrosservicesLocatarioCorent = await apiLocatario.updateCorent(tokenLocatario, locatario, userId, corentType, contractId);

                return setResponse.SUCCESS({
                    message: "Sucesso ao atualizar locatário!",
                    results: [newLocatario, newMicrosservicesLocatarioAddress, newMicrosservicesLocatarioContact, newMicrosservicesLocatarioCorent],
                    res: res,
                });
            }
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async buscarContratosDoLocatario(req, res) {
        try {
            const {locatario} = req.params;

            if (!locatario) {
                return setResponse.WARNING({message: "Dados do locatario não fornecidos para busca"});
            }
            const results = await serviceLocatarioQuery.buscaContratosQuery(locatario);

            if (results.length === 0) {
                return setResponse.SUCCESS({
                    message: "Nenhum Contrato Encontrado",
                    results: [],
                    res: res,
                });
            }

            return setResponse.SUCCESS({
                message: "Nenhum Contrato Encontrado",
                results: [...results],
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    // BUSCAR ANEXO 1
    static async buscarDocumentosPorContrato(req, res) {
        try {
            const {cod} = req?.params;

            if (!cod) {
                return setResponse.WARNING({message: "Dados do contrato não fornecidos para busca"});
            }

            const results = await serviceLocatarioQuery.buscarDocumentosPorContrato(cod);

            if (results.length === 0) {
                return setResponse.SUCCESS({
                    message: "Nenhum Documento Encontrado",
                    results: [],
                    res: res,
                });
            }

            return setResponse.SUCCESS({
                message: "Documento encontrado com sucesso",
                results: [...results],
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    // BUSCAR BOLETOS
    static async buscarBoletosPorContrato(req, res) {
        try {
            const {cod} = req?.params;

            if (!cod) {
                return setResponse.WARNING({message: "Dados do contrato não fornecidos para busca"});
            }
            const results = await serviceLocatarioQuery.buscarBoletosPorContrato(cod);

            if (results.length === 0) {
                return setResponse.SUCCESS({
                    message: "Nenhum Boleto Encontrado",
                    results: [],
                    res: res,
                });
            }

            return setResponse.SUCCESS({
                message: "Boleto encontrado com sucesso",
                results: [...results],
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarLocatarioPeloCod(req, res) {
        try {
            const {cod} = req?.params;

            if (!cod) {
                return setResponse.WARNING({message: "Dado do locatário não fornecido para busca"});
            }
            const results = await onda_locatario.getOneNotRes(cod);
            return setResponse.SUCCESS({
                message: "Locatário encontrado com sucesso",
                results: results?.dataValues,
                res: res,
            });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default contollerLocatario;
