//BIBLIOTECAS
import yup from "yup";
import crypto from "crypto";
//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
//BANCO DE DADOS

//SERVICES

const servicesAuthValidate = class servicesAuthValidate {
    static async schema({dadosBody}) {
        const schema = yup.object().shape({
            user: yup.object().shape({
                email: yup
                    .string()
                    .email("O email deve ser um endereço de email válido.")
                    .required("O email é obrigatório.")
                    .transform((value) => {
                        const normalizedValue = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        return normalizedValue.toLowerCase().replace(/\s+/g, "");
                    }),
                senha: yup.string().min(6, "A senha deve ter pelo menos 6 caracteres.").required("A senha é obrigatória."),
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async verificarSenha({usuario, dadosBody}) {
        const checkPasswordCrypto = crypto.createHash("md5").update(dadosBody?.user?.senha).digest("hex");

        if (usuario?.senha != checkPasswordCrypto) {
            return setResponse.WARNING({message: "E-mail ou senha incorretos!"});
        }
    }

    static async verificarEmail({usuario}) {
        if (!usuario?.email) {
            return setResponse.WARNING({message: "E-mail ou senha não encontrados!"});
        }
    }
};

export default servicesAuthValidate;
