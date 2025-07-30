import {Sequelize} from "sequelize";

const setResponse = class setResponse {
    //response de acertos
    static DEFAULT({message, results, res}) {
        if (res) {
            if (!res.headersSent) {
                return res.status(201).json({
                    status: 201,
                    code: "SUCCESS",
                    type: "success",
                    message: message || "Realizado com sucesso!",
                    count: results?.length || 0,
                    results: results || [],
                });
            } else {
                return;
            }
        }
        throw {
            status: 201,
            code: "SUCCESS",
            type: "success",
            message: message || "Busca realizada com sucesso!",
            count: results?.length || 0,
            results: results || [],
        };
    }

    static SUCCESS({message, results, res}) {
        if (res) {
            if (res.headersSent == false) {
                return res.status(200).json({
                    status: 200,
                    code: "SUCCESS",
                    type: "success",
                    message: message || "Realizado com sucesso!",
                    count: results?.length || 0,
                    results: results || [],
                });
            } else {
                return;
            }
        }
        throw {
            status: 200,
            code: "SUCCESS",
            type: "success",
            message: message || "Busca realizada com sucesso!",
            count: results?.length || 0,
            results: results || [],
        };
    }

    static UNAUTHORIZED({message, results, res}) {
        if (res) {
            if (!res.headersSent) {
                return res.status(201).json({
                    status: 401,
                    code: "UNAUTHORIZED",
                    type: "unauthorized",
                    message: message,
                    count: results?.length || 0,
                    results: results || [],
                });
            } else {
                return;
            }
        }
        throw {
            status: 401,
            code: "UNAUTHORIZED",
            type: "unauthorized",
            message: message || "Aviso de mensagem",
            count: results?.length || 0,
            results: results || [],
        };
    }
    //response de acertos
    static WARNING({message, results, res}) {
        if (res) {
            if (!res.headersSent) {
                return res.status(201).json({
                    status: 406,
                    code: "WARNING",
                    type: "warning",
                    message: message,
                    count: results?.length || 0,
                    results: results || [],
                });
            } else {
                return;
            }
        }
        throw {
            status: 406,
            code: "WARNING",
            type: "warning",
            message: message || "Aviso de mensagem",
            count: results?.length || 0,
            results: results || [],
        };
    }

    static async EMAIL(data) {
        const res = {
            status: 201,
            code: "EMAIL_ERROR",
            type: "warning",
            message: data?.message || "Erro ao enviar email!",
            count: 0,
            results: [],
        };

        throw res;
    }

    //Erro nas válidações de tipo de dados nos formulários da yup
    static async SCHEMA_VALIDATION(results) {
        throw {
            status: 422,
            code: "SCHEMA_VALIDATION",
            type: "warning",
            message: results?.[0] || "Erro na validação do formulário!",
            count: results?.length || 0,
            results: results || [],
        };
    }

    static async SCHEMA_SEQUELIZE(err) {
        if (err instanceof Sequelize.ValidationError) {
            const messages = err?.errors.map((item) => item?.message);
            throw {
                status: 422,
                code: "SCHEMA_VALIDATION",
                type: "warning",
                message: messages?.[0] || "Erro na validação do formulário!",
                count: 0,
                results: messages || [],
            };
        } else {
            return setResponse.DATABASE_ERROR({message: "Erro sequelize, no banco de dados!"});
        }
    }

    //utilizado para funções de bloqueio de ID e tokens
    static async FORBIDDEN() {
        const res = {
            status: 422,
            code: "FORBIDDEN",
            type: "warning",
            message: "Acesso não autorizado!",
            count: 0,
            results: [],
        };

        throw res;
    }

    static async CONFLICT({message}) {
        const res = {
            status: 409,
            code: "CONFLICT",
            type: "error",
            message: message || "Conflito detectado ao processar a solicitação.",
            count: 0,
            results: [],
        };

        throw res;
    }

    //utilizado para TOKENS invalidos
    static async AUTHORIZATION_ERROR(data) {
        const res = {
            status: 422,
            code: "AUTHORIZATION_ERROR",
            type: "warning",
            message: data?.message || "Acesso negado, token inválido!",
            count: 0,
            results: [],
        };

        throw res;
    }

    //Erro em solicitações nas APIs que o servidor grava e consulta informações
    static async INTERNAL_REQUEST_API_FAILED(data) {
        const res = {
            status: 500,
            code: "INTERNAL_REQUEST_API_FAILED",
            type: "warning",
            message: data?.message || "Erro nas solicitações internas em APIs!",
            count: 0,
            results: [],
            erro: data?.erro || "-",
        };

        throw res;
    }

    //utilizado para operações MYSQL
    static async DATABASE_ERROR(data) {
        const res = {
            status: 500,
            code: "DATABASE_ERROR",
            type: "error",
            message: data.message || "Erro na consulta do banco de dados!",
            count: 0,
            results: [],
            erro: data?.erro || "-",
        };

        throw res;
    }

    static async NOT_FOUND(data, erro) {
        const res = {
            status: 404,
            code: "NOT_FOUND",
            type: "warning",
            message: data.message || "Não encontrato!",
            count: 0,
            results: [],
        };

        throw res;
    }

    //utilizado para erros internos no servidor
    static async INTERNAL_SERVER_ERROR() {
        const res = {
            status: 500,
            code: "INTERNAL_SERVER_ERROR",
            type: "error",
            message: "Erro interno no servidor!",
            count: 0,
            results: [],
        };

        throw res;
    }

    static async CRONN_JOB_ERROR(data) {
        const res = {
            status: 500,
            code: "CRONN_JOB_ERROR",
            type: "error",
            message: data.message || "Erro na função cronn job!",
            count: 0,
            results: [],
        };
        throw res;
    }

    static async CRONN_JOB_SUCCESS(data) {
        const res = {
            status: 201,
            code: "CRONN_JOB_SUCCESS",
            type: "success",
            message: data.message || "Sucesso ao executar a tarefa cron!",
            count: 0,
            results: [],
        };
        throw res;
    }

    static SERVER_ERROR(res, error) {
        if (!error?.status || !error?.code || !error?.type) {
            if (!res.headersSent) {
                return res.status(500).json({
                    status: 500,
                    code: "SERVER_ERROR",
                    type: "error",
                    message: "Erro interno no servidor!",
                    count: 0,
                    results: [],
                });
            } else {
                return;
            }
        }

        if (!res.headersSent) {
            return res.status(error.status).json(error);
        } else {
            return;
        }
    }

    static INVALID_FILE({res, message}) {
        const error = {
            status: 500,
            code: "INVALID_FILE",
            type: "warning",
            message: message || "Arquivo inválido!",
            count: 0,
            results: [],
        };

        if (!res.headersSent) {
            return res.status(error.status).json(error);
        } else {
            return;
        }
    }

    static INVALID_TOKEN({res, message}) {
        const error = {
            status: 500,
            code: "INVALID_FILE",
            type: "warning",
            message: message || "Token inválido!",
            count: 0,
            results: [],
        };

        if (!res.headersSent) {
            return res.status(error.status).json(error);
        } else {
            return;
        }
    }
};

export default setResponse;
