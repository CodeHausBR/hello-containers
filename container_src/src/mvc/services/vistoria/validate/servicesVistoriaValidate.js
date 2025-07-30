//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
//BANCO DE DADOS

//SERVICES

const servicesVistoriaValidate = class servicesVistoriaValidate {
    static async atualizarStatusVistoria_validate(dadosBody, status) {
        const schema = yup.object().shape({
            status: yup
                .string()
                .test("", `Status do setor vistoria está inválido!`, (value) => {
                    return status.includes(value);
                })
                .required(),
            cod: yup.string().required(),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }
};

export default servicesVistoriaValidate;
