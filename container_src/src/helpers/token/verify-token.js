import jwt from "jsonwebtoken";
import getToken from "./get-token.js";
import dotenv from "dotenv";
dotenv.config();

//helpers
import setResponse from "../response/setResponse.js";

//Check if the token has arrived
async function verifyToken(req, res, next) {
    try {
        if (!req.headers.authorization) {
            return setResponse.INVALID_TOKEN({res: res, message: "Token não enviado!!!"});
        }

        const token = await getToken(req);

        if (!token) {
            return setResponse.INVALID_TOKEN({res: res, message: "Acesso negado!!!"});
        }

        const verified = jwt.verify(token, process.env.JSON_WEB_TOKEN_IMOBILIARIA);

        // if (
        //     (verified?.type_user == "ONDA_EXECUTIVO" || verified?.type_user == "ONDA_PARCEIRO") &&
        //     (req.method == "POST" || req.method == "PUT" || req.method == "PATCH" || req.method == "DELETE")
        // ) {
        //     return setResponse.WARNING({res: res, message: "Acesso negado ao executivo ou parceiro!"});
        // }

        await Object.assign(req?.body, {token: verified});
        next();
    } catch (error) {
        return setResponse.INVALID_TOKEN({res: res, message: "Token inválido!!!"});
    }
}

export default verifyToken;
