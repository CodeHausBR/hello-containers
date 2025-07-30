import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

//helpers
import setResponse from "../response/setResponse.js";

const createOndaExecParcToken = ({ usuario }) => {
    try {
        const token = jwt.sign(
            {
                nome: usuario?.nome,
                email: usuario?.email,
                id: usuario?.id,
                onda_user_id: usuario?.id,
                codigo: usuario?.codigo,
                type_user: usuario?.tipo,
                departamento: usuario?.userDepartamento,
                organizacao: "onda_segura",
                app: "wave",
            },
            process.env.JSON_WEB_TOKEN_IMOBILIARIA
        );

        return {
            status: 201,
            type: "success",
            code: "SUCCESS",
            token: token,
            nome: usuario?.nome,
            email: usuario?.email,
            id: usuario?.id,
            codigo: usuario?.codigo,
            type_user: usuario?.tipo,
            departamento: usuario?.userDepartamento,
            message: "Login efetuado com sucesso!",
        };
    } catch (error) {
        return setResponse.INTERNAL_SERVER_ERROR({
            classe: "controllersUsersOnda",
            statico: "register",
            funcao: "createOndaExecParcToken",
            message: "Erro ao criar token do usuário onda!",
        });
    }
};

export default createOndaExecParcToken;
