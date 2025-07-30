
import yup from "yup";
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
import generateQuery from "../../../../helpers/mysql/generate-query.js";

const servicesSuporteValidate = class servicesSuporteValidate {
    static async ondaSuporte(dadosBody) {
        const schema = yup
            .object()
            .shape({
                suporteImobId: yup.number().integer(),
                suporteStatus: yup.number().integer(),
                suporteTipoSugestao: yup.string().max(45),
                suporteSetor: yup.string().max(45),
                suporteTipoProblema: yup.string().max(45),
                suporteDescricao: yup.string().max(250),
                suporteRetorno: yup.string().max(250),
                suporteAtivo: yup
                    .mixed()
                    .transform((value, originalValue) => {
                        if (typeof originalValue === "string") {
                            const parsed = Number(originalValue);
                            return isNaN(parsed) ? originalValue : parsed;
                        }
                        return value;
                    })
                    .oneOf([0, 1], "suporteAtivo deve ser 0 ou 1")
                    .required("suporteAtivo é obrigatório"),
            })
            .noUnknown();

        const dados = await yupSchemaValidate(schema, dadosBody, { abortEarly: false });

        return generateQuery.retirarkeysVazias(dados);
    }
};

export default servicesSuporteValidate;
