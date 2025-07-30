import yup from "yup";
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";

const servicesCobrancaValidate = class servicesCobrancaValidate {
    static async atualizarStatusCobrancaValidate(dadosBody, arrayStatus) {
        const schema = yup.object().shape({
            status: yup
                .string()
                .test("status-valido", "Status do setor cobrança está inválido!", (value) => {
                    return arrayStatus.includes(value);
                })
                .required(),
            cod: yup.string().required(),
        });

        const dadosValidados = await schema.validate(dadosBody, {abortEarly: false});
        return dadosValidados;
    }
    // FUNÇÃO COM NOMES DUPLICADOS
    static async atualizarStatusCobranca_validate(dadosBody, arrayStatus) {
        const schema = yup.object().shape({
            status: yup
                .string()
                .test("status-valido", "Status do setor cobrança está inválido!", (value) => {
                    return arrayStatus.includes(value);
                })
                .required(),
            cod: yup.string().required(),
        });

        const dadosValidados = await schema.validate(dadosBody, {abortEarly: false});
        return dadosValidados;
    }
    // FUNÇÃO COM NOMES DUPLICADOS
    static async atualizarStatusCobranca_validate(dadosBody, status) {
        const schema = yup.object().shape({
            cobrancaStatus: yup.number().integer().nullable(),
            cobrancaSinistro: yup.string().max(45).nullable(),
            cobrancaPaga: yup.boolean().nullable(),
            cobrancaEncerramento: yup.string().nullable(),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async quitacaoDivida(dadosBody) {
        const schema = yup.object().shape({
            data: yup.object({
                codContrato: yup.string().required("O campo codContrato é obrigatório!"),
                valorQuitacao: yup.number().required("O campo valorQuitacao é obrigatório!"),
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async confissaoDivida(dadosBody) {
        const schema = yup.object().shape({
            data: yup.object({
                codContrato: yup.string().required("O campo codContrato é obrigatório!"),
                negociacao: yup.object({
                    valorTotal: yup.number().required("O campo valorTotal é obrigatório!"),
                    vencimento: yup.string().required("O campo vencimento é obrigatório!"),
                    parcelas: yup.number().integer().required("O campo parcelas é obrigatório!").max(12, "O parcelamento é "),
                    juros: yup.number().required("O campo valorTotal é obrigatório!"),
                    desconto: yup.number().integer(),
                }),
                sinistros: yup.array().required("A lista de códigos de sinistro é obrigatória!"),
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }
    static async validateCobrancasparaConsolidacao(dataBody) {
        const schema = yup.object().shape({
            cobrancas: yup
                .array()
                .of(
                    yup
                        .string()
                        .matches(/^OSC-\d+-\d{4}$/, "Cobrança fora do padrão esperado (OSC-XXXXXXXXXXXXXX-YYYY)")
                        .required("Cobrança é obrigatória")
                )
                .min(2, "Deve haver pelo menos duas cobrança"),
            valor: yup.number().typeError("Valor deve ser um número").required("Valor é obrigatório"),
        });

        return await yupSchemaValidate(schema, dataBody, {abortEarly: false});
    }
};

export default servicesCobrancaValidate;
