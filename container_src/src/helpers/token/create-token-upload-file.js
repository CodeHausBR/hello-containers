//helpers
import setResponse from "../response/setResponse.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const createTokenUploadFile = async (url, req, res) => {
    try {
        const pontoIndex = url.lastIndexOf(".");

        const formatoArquivo = url.substring(pontoIndex + 1);

        const token = jwt.sign(
            {
                url: url,
                exp: Math.floor(Date.now() / 1000) + 30,
            },
            process.env.JSON_WEB_TOKEN_IMOBILIARIA_UPLOAD_FILES
        );

        res.status(202).json({
            status: 202,
            message: "Login efetuado com suceso!",
            code: "SUCCESS",
            type: "success",
            token: token + "." + formatoArquivo,
        });
        return;
    } catch (error) {
        return setResponse.AUTHORIZATION_ERROR({
            classe: "createTokenUploadFile",
            statico: "createTokenUploadFile",
            funcao: "createTokenUploadFile",
            message: "Erro ao criar token de upload!",
        });
    }
};

export default createTokenUploadFile;
