//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
//BANCO DE DADOS

//SERVICES

const servicesAdministrativoValidate = class servicesAdministrativoValidate {
    static async treinamentoIa_validate(dadosBody) {
        const schema = yup.object().shape({
            ia_treinamento_cpfcnpj: yup.string().required(),
            ia_treinamento_locatario: yup.string().required(),
            ia_treinamento_aprovado: yup.string().required(),
            ia_treinamento_sexo: yup.string().required(),
            ia_treinamento_uf: yup.string().required(),
            ia_treinamento_idade: yup.number().required(),
            ia_treinamento_protesto: yup.boolean().default(false),
            ia_treinamento_juridico_execucao: yup.boolean().default(false),
            ia_treinamento_juridico_criminal: yup.boolean().default(false),
            ia_treinamento_juridico_trabalhista: yup.boolean().default(false),
            ia_treinamento_juridico_despejo: yup.boolean().default(false),
            ia_treinamento_dividas_contasconsumo: yup.boolean().default(false),
            ia_treinamento_dividas_cartaodecredito: yup.boolean().default(false),
            ia_treinamento_dividas_financiamentos: yup.boolean().default(false),
            ia_treinamento_dividas: yup.boolean().default(false),
            ia_treinamento_pf: yup.boolean().default(false),
            ia_treinamento_pj: yup.boolean().default(false),
            ia_treinamento_imigrante: yup.boolean().default(false),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }
};

export default servicesAdministrativoValidate;
