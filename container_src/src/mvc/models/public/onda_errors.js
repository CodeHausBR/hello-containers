//BIBLIOTECAS

//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
//BANCO DE DADOS

//SERVICES

const onda_errors = class onda_errors {
    static async postNotRes(props) {
        const { classe, statico, token, funcao, status, code, type, message, onda_imob_id } = props;
        const id = (token?.onda_imob_id != 0 && token?.onda_imob_id) || (token?.onda_user_id != 0 && token?.onda_user_id);

        const newMessage = () => {
            if (typeof message === "object") {
                return JSON.stringify(message).slice(0, 4900);
            } else {
                return message;
            }
        };

        const escapeString = (str) => {
            if (typeof str !== "string") return str;
            return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
        };

        const query = `
        INSERT INTO onda_errors (
        onda_errors_class,
        onda_errors_static,
        onda_errors_function,
        onda_errors_horario,
        onda_errors_status,
        onda_errors_code,
        onda_errors_type,
        onda_errors_message,
        onda_errors_imob_id,
        onda_errors_resolvido
    )
    VALUES(
        '${classe}', 
        '${statico}', 
        '${funcao || "-"}', 
        NOW(),
        ${status || 500}, 
        '${code || "DATABASE_ERROR"}', 
        '${type || "error"}', 
        '${escapeString(newMessage() || "erro ao gerar")}',
        '${id || token?.id || 60}',
        0
    )`;

        await executarQuery(query).catch(() => {
            return;
        });
    }
};

export default onda_errors;
