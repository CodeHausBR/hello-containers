import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

//Check if the token has arrived
async function verifyTokenUploadFile(req, res, next) {
    try {
        const lastIndex = req.url.lastIndexOf(".");

        const rest = req.url.substring(0, lastIndex);

        const startIndex = rest.indexOf("/file/");

        const token = rest.substring(startIndex + "/file/".length);

        if (!token) {
            return res.status(401).json({message: "Acesso negado!!!"});
        }

        const verified = jwt.verify(token, process.env.JSON_WEB_TOKEN_IMOBILIARIA_UPLOAD_FILES);
        req.body.tokenFile = verified;
        next();
    } catch (error) {
        return res.status(400).json({message: "Token Inválido"});
    }
}

export default verifyTokenUploadFile;
