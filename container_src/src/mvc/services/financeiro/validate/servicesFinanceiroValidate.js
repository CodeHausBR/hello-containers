//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
import setResponse from "../../../../helpers/response/setResponse.js";
//BANCO DE DADOS

//SERVICES

const servicesFinanceiroValidate = class servicesFinanceiroValidate {
    static async atualizarStatusAnalise_validate(dadosBody, status) {
        const schema = yup.object().shape({
            status: yup
                .string()
                .test("", `Status do setor ${dadosBody?.setor} está inválido!`, (value) => {
                    return status.includes(value);
                })
                .required(),
            cod: yup.string().required(),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validatePathDinamico({pay}) {
        const schema = yup.object().shape({
            pay: yup
                .array()
                .of(
                    yup.object().shape({
                        onda_pay_id: yup.number().required("ID é obrigatório"),
                        onda_pay_status: yup.string().nullable(),
                        onda_pay_cnab_status_retorno_id: yup.string().nullable(),
                        onda_pay_cnab_status_retorno: yup.string().nullable(),
                    })
                )
                .min(1, "Pelo menos um item de pagamento é necessário")
                .required("Array de pagamentos é obrigatório"),
        });

        return await yupSchemaValidate(schema, {pay: pay}, {abortEarly: false});
    }

    static async validarRetornoArquivoCnab({informacoesArquivos, res}) {
        const objetoNossoNumero = yup.object().shape({
            ocorrencia: yup.string().required(),
            ocorrenciaDesc: yup
                .object()
                .shape({
                    message: yup.string().required(),
                    nossoStatus: yup.number().required(),
                })
                .required(),
            motivos: yup
                .object()
                .shape({
                    motivo1: yup.string().required(),
                    motivo2: yup.string().required(),
                    motivo3: yup.string().required(),
                    motivo4: yup.string().required(),
                    motivo5: yup.string().required(),
                })
                .required(),
            dataOcorrencia: yup.string().required(),
        });

        const schema = yup.lazy((obj) =>
            yup.object(
                Object.keys(obj).reduce((acc, key) => {
                    if (/^\d{9}$/.test(key)) {
                        acc[key] = objetoNossoNumero;
                    }
                    return acc;
                }, {})
            )
        );

        await schema
            .validate(informacoesArquivos, {abortEarly: false})
            .then((valid) => {
                if (Object?.keys(valid)?.length == 0) {
                    throw new yup.ValidationError("O objeto não possui nenhuma chave válida");
                }
                this.results = valid;
            })
            .catch((error) => {
                return setResponse.SCHEMA_VALIDATION(error?.errors);
            });

        return this.results;
    }

    static async validaCadastrosContasAcordoExtrajudicial({bodyData}) {
        const schema = yup.object().shape({
            // titular: yup.string().required("O titular é obrigatório"),
            // cpf: yup.string().required("O CPF é obrigatório"),
            titularCod: yup.string().required("O id do titutlar é obrigatório"),
            cardNumber: yup.string().nullable().typeError("Número do cartão inválido"),
            serialNumber: yup.string().nullable().typeError("Número de série inválido"),
            contaCod: yup.string().required("A conta de referencia é obrigatório"),
            valorTotal: yup.mixed().required("O valor total é obrigatório"),
            installments: yup
                .array()
                .of(
                    yup.object().shape({
                        statusPagamento: yup.mixed().required("O status do pagamento é obrigatório"),
                        plataforma: yup.string().required("A plataforma é obrigatória"),
                        descricao: yup.string().nullable().typeError("Descrição inválida"),
                        valorParcela: yup.mixed().required("O valor total é obrigatório"),
                        tipoPagamento: yup.string().required("O tipo de pagamento é obrigatório"),
                        helpersTipoPagamentoId: yup.mixed().required("O ID do tipo de pagamento auxiliar é obrigatório"),
                        dataVencimento: yup.date().typeError("Data de vencimento inválida").required("A data de vencimento é obrigatória"),
                        dataPagamento: yup.date().nullable(),
                        numeroParcela: yup.string().required("O número da parcela é obrigatório"),
                        id: yup.number().nullable(),
                    })
                )
                .min(1, "É necessário ao menos uma parcela")
                .required("As parcelas são obrigatórias"),
        });

        return await yupSchemaValidate(schema, bodyData, {abortEarly: false});
    }
    static async validaDeleteContasAcordoExtrajudicial({bodyData}) {
        const schema = yup.object().shape({
            installments: yup
                .array()
                .of(
                    yup.object().shape({
                        statusPagamento: yup.mixed().required("O status do pagamento é obrigatório"),
                        plataforma: yup.string().required("A plataforma é obrigatória"),
                        descricao: yup.string().nullable().typeError("Descrição inválida"),
                        valorParcela: yup.mixed().required("O valor total é obrigatório"),
                        tipoPagamento: yup.string().required("O tipo de pagamento é obrigatório"),
                        helpersTipoPagamentoId: yup.mixed().required("O ID do tipo de pagamento auxiliar é obrigatório"),
                        dataVencimento: yup.date().typeError("Data de vencimento inválida").required("A data de vencimento é obrigatória"),
                        dataPagamento: yup.date().nullable(),
                        numeroParcela: yup.string().required("O número da parcela é obrigatório"),
                        id: yup.number().nullable(),
                    })
                )
                .min(1, "É necessário ao menos uma parcela")
                .required("As parcelas são obrigatórias"),
        });

        return await yupSchemaValidate(schema, bodyData, {abortEarly: false});
    }

    static async validateBuscaContasAcordoExtrajudicial({bodyData}) {
        const schema = yup.object().shape({
            contas: yup.array().of(yup.string().required()).min(1, "É necessário ao menos uma Matrix").required("As matrix de contas são obrigatórias"),
        });

        return await yupSchemaValidate(schema, bodyData, {abortEarly: false});
    }
};

export default servicesFinanceiroValidate;
