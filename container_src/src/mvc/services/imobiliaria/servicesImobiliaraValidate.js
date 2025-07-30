//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";

//BANCO DE DADOS

//SERVICES

const servicesImobiliaraValidate = class servicesImobiliaraValidate {
    static async validatePath(value) {
        const schema = yup.object().shape({
            matrix: yup
                .string()
                .required("O campo matrix é obrigatório!")
                .matches(/^IMOB-/, "O código deve ser o código identificador da imobiliária ex: IMOB-123123123123-2025"),
            id: yup.string().required("O id do contrato é obrigatório!"),
            assinar: yup.boolean().defined("O campo assinar é obrigatório").oneOf([true]),
        });

        return await yupSchemaValidate(schema, value, {abortEarly: false});
    }
    static async validateAtualizacaoStatusImob(value) {
        const schema = yup.object().shape({
            matrix: yup
                .string()
                .required("O campo matrix é obrigatório!")
                .matches(/^IMOB-/, "O código deve ser o código identificador da imobiliária ex: IMOB-123123123123-2025"),
            status: yup.number().oneOf([1300, 1301, 1302, 1303, 1304], "Código inválido").required("Código é obrigatório"),
        });

        return await yupSchemaValidate(schema, value, {abortEarly: false});
    }

    static async validarDadosMigracao(value) {
        const schema = yup.object().shape({
            password: yup.string().required("A senha é obrigatória"),
            from: yup.object().shape({
                id: yup.number().required("O id é obrigatório"),
                name: yup.string().required("O nome é obrigatória"),
                matrix: yup
                    .string()
                    .required("A matrix é obrigatória")
                    .matches(/^IMOB-/, "O código deve ser o código identificador da imobiliária ex: IMOB-123123123123-2025"),
            }),
            contracts: yup
                .array()
                .of(
                    yup.object().shape({
                        id: yup.string().required("O id do contrato é obrigatório"),
                        contrato: yup.string().required("O número do contrato é obrigatório"),
                        imobCodigo: yup.string().required("O código da imobiliária é obrigatório"),
                        cpf: yup.string().required("O cpf/cnpj é obrigatório"),
                        imovelCod: yup.string().nullable(),
                        colabCod: yup.string().nullable(),
                    })
                )
                .required("A lista de contratos é obrigatória")
                .min(1, "É necessário pelo menos um contrato para a migração"),
            to: yup.object().shape({
                id: yup.number().required("O id é obrigatório"),
                name: yup.string().required("O nome é obrigatória"),
                matrix: yup
                    .string()
                    .required("A matrix é obrigatória")
                    .matches(/^IMOB-/, "O código deve ser o código identificador da imobiliária ex: IMOB-123123123123-2025"),
            }),
            config: yup.object().shape({
                migrar_colaboradores: yup.boolean().default(false),
            }),
        });

        return await yupSchemaValidate(schema, value, {abortEarly: false});
    }
};

export default servicesImobiliaraValidate;
