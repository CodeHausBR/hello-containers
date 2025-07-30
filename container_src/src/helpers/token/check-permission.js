import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import setResponse from "../response/setResponse.js";
import onda_user_permissoes from "../../mvc/models/permissions/onda_user_permissions.js";
// import {getUserPermissions} from "./permissions-service.js";

dotenv.config();

async function checkPermission(req, res, next) {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return setResponse.UNAUTHORIZED({
                message: "Token não fornecido",
                res: res,
            });
        }
        const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_IMOBILIARIA);
        const userId = decoded.id;

        const permissions = await onda_user_permissoes.getUserPermissions(userId);

        const requiredPermission = getRequiredPermissionForRoute(req.baseUrl, req.method);

        if (!requiredPermission) {
            return setResponse.WARNING({res: res, message: "Permissão não definida para esta rota."});
        }

        if (permissions.includes(requiredPermission)) {
            next();
        } else {
            return setResponse.UNAUTHORIZED({
                res: res,
                message: "Você não tem autorização para acessar essas informações. Contate um administrador.",
            });
        }
    } catch (error) {
        return setResponse.INVALID_TOKEN({res: res, message: "Token inválido!!!"});
    }
}

function getRequiredPermissionForRoute(path, method) {
    const routePermissions = {
        "/formas/pagamento": {GET: "ler_formas_pagamento"},
        "/cobranca": {GET: "buscar_cobrancas"},
        "/anexo1/:cod/:tipo/:email": {POST: "criar_anexo1"},
        "/motivo/re10": {PATCH: "atualizarLocatario"},
    };

    for (const route in routePermissions) {
        const regexPath = "^" + route.replace(/:[^\/]+/g, "[^/]+") + "$";
        const regex = new RegExp(regexPath);

        if (regex.test(path)) {
            return method + ":" + route;
        }
    }

    return null;
}

export default checkPermission;
