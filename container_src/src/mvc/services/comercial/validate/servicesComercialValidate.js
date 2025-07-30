//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
//BANCO DE DADOS

//SERVICES

const servicesComercialValidate = class servicesComercialValidate {
    static async atualizarStatusComercial_validate(dadosBody, status) {
        const schema = yup.object().shape({
            status: yup
                .string()
                .test("", `Status do setor comercial está inválido!`, (value) => {
                    return status.includes(value);
                })
                .required(),
            cod: yup.string().required(),
        });

        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }
    static async contratos_validate(dadosBody) {
        const schema = yup.object().shape({
            where: yup
                .string()
                .test("", `O paramentro deve ser "last90Contratos", "", "pertoRenovacao" ou "allContratos"`, (value) => {
                    return ["allContratos", "last90Contratos", "pertoRenovacao"].includes(value);
                })
                .required(),
        });

        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }
};

export default servicesComercialValidate;
