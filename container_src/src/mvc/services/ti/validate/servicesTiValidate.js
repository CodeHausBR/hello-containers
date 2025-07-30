//BIBLIOTECAS
import yup from "yup";
//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
//BANCO DE DADOS

//SERVICES

const servicesTiValidate = class servicesTiValidate {
    #schemaValidate(schema, data, options) {
        try {
            const response = schema.validateSync(data, {...options, stric: false, stripUnknown: true});
            return response;
        } catch (error) {
            const erros = error.inner.map((err) => ({
                campo: err.path,
                mensagem: err.message,
            }));
            return setResponse.SCHEMA_VALIDATION({message: `Erro ao validar schema`, results: erros});
        }
    }

    async validateCreateServer({data}) {
        const schema = yup.object().shape({
            application: yup
                .string()
                .required("O nome do aplicativo é obrigatório!")
                .transform((value) => value.toLowerCase()),
            environment: yup
                .string()
                .required()
                .transform((value) => value.toLowerCase()),
            active: yup.boolean().default(true), // true = ativo, false = desativado
            status: yup.boolean().default(false), //true = rodando, false = parado
            ip: yup
                .string()
                .transform((value) => {
                    const ipFormatado = value.replace(/\s+/g, "").toLowerCase();
                    return ipFormatado;
                })
                .test("ip", "O ip está invalido", (value) => {
                    const regex =
                        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    return regex.test(value);
                })
                .required("O ip é obrigatório"),
            port: yup.string().required("A porta é obrigatória"),
        });

        return this.#schemaValidate(schema, data, {abortEarly: false});
    }

    async validatePathServer({data}) {
        const schema = yup.object().shape({
            application: yup
                .string()
                .required("O nome do aplicativo é obrigatório!")
                .transform((value) => value.toLowerCase()),
            environment: yup
                .string()
                .required()
                .transform((value) => value.toLowerCase()),
            active: yup.boolean().default(true), // true = ativo, false = desativado
            status: yup.boolean().default(false), //true = rodando, false = parado
            ip: yup
                .string()
                .transform((value) => {
                    const ipFormatado = value.replace(/\s+/g, "").toLowerCase();
                    return ipFormatado;
                })
                .test("ip", "O ip está invalido", (value) => {
                    const regex =
                        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    return regex.test(value);
                })
                .required("O ip é obrigatório"),
            port: yup.string().required("A porta é obrigatória"),
        });

        return this.#schemaValidate(schema, data, {abortEarly: false});
    }

    async validateCreateScript({data}) {
        const schema = yup.object().shape({
            id_application: yup.string().required(),
            side: yup
                .string()
                .required()
                .test("verificar-lado", "O valor deve ser frontend ou backend", (value) => {
                    return value !== "frontend" || value !== "backend";
                }),
            name: yup
                .string()
                .required()
                .transform((value) => value.toLowerCase()),
            description: yup
                .string()
                .required()
                .transform((value) => value.toLowerCase()),
            script: yup.string().required(),
            status: yup.boolean().default(true),
        });

        return this.#schemaValidate(schema, data, {abortEarly: false});
    }

    async validatePathScript({data}) {
        const schema = yup.object().shape({
            id_application: yup.string().required(),
            id_script: yup.string().required(),
            side: yup
                .string()
                .required()
                .test("verificar-lado", "O valor deve ser frontend ou backend", (value) => {
                    return value !== "frontend" || value !== "backend";
                }),
            name: yup
                .string()
                .required()
                .transform((value) => value.toLowerCase()),
            description: yup
                .string()
                .required()
                .transform((value) => value.toLowerCase()),
            script: yup.string().required(),
            status: yup.boolean().default(true),
        });

        return this.#schemaValidate(schema, data, {abortEarly: false});
    }
};

export default servicesTiValidate;
