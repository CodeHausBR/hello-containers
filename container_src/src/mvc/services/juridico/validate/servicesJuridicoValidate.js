//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
//BANCO DE DADOS

//SERVICES

const servicesJuridicoValidate = class servicesJuridicoValidate {
    static async atualizarStatusSinistro_validate(dadosBody, arrayStatus) {
        const schema = yup.object().shape({
            status: yup
                .string()
                .test("", `Status deve ser: ${arrayStatus}`, (value) => {
                    return arrayStatus.includes(value);
                })
                .required(),
            cod: yup.string().required(),
        });

        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async atualizarSinistro_validate(dadosBody) {
        const schema = yup.object().shape({
            sisnitroCodigo: yup.string().required(),
            sisnitroValorLiquido: yup.number(),
        });

        const results = await yupSchemaValidate(schema, dadosBody, { abortEarly: false });

        return {
            onda_sinistro_codigo: results?.sisnitroCodigo,
            onda_sinistro_valorliquido: results?.sisnitroValorLiquido,
        };
    }

    static async validarDadosAceitarSinistroPortal({ codSinistro, sinistro }) {
        const schema = yup.object().shape({
            codSinistro: yup.string().required().matches(/^SN-/, "O código deve ser o contrato ex: SN-4564564231-2024"),
            sinistro: yup.object().shape({
                aceitar: yup.boolean().required(),
                descricao: yup.string().when("aceitar", {
                    is: false,
                    then: yup.string().required("A descrição é obrigatória quando o sinistro for negado"),
                    otherwise: yup.string(),
                }),
            }),
        });

        const dadosValidados = await yupSchemaValidate(schema, { codSinistro: codSinistro, sinistro: sinistro }, { abortEarly: false });

        return dadosValidados;
    }

    static async validarDadosCancelamentoSinistroPortal({ codSinistro }) {
        const schema = yup.object().shape({
            codSinistro: yup.string().required().matches(/^SN-/, "O código deve ser o contrato ex: SN-4564564231-2024"),
        });

        const dadosValidados = await yupSchemaValidate(schema, { codSinistro: codSinistro }, { abortEarly: false });

        return dadosValidados;
    }

    static async validarDadosFinalizarContestacaoSinistro({ codSinistro }) {
        const schema = yup.object().shape({
            codSinistro: yup.string().required().matches(/^SN-/, "O código deve ser o contrato ex: SN-4564564231-2024"),
        });

        const dadosValidados = await yupSchemaValidate(schema, { codSinistro: codSinistro }, { abortEarly: false });

        return dadosValidados;
    }

    static async validarCodSinistro({ dadosBody }) {
        const schema = yup.object().shape({
            sinistro: yup.object().shape({
                codSinistro: yup.string().required().matches(/^SN-/, "O código deve ser o codSinistro, ex: SN-4564564231-2024"),
                descOnda: yup.string().default("Sinistro encerrado.").nullable(),
            }),
        });

        const dadosValidados = await yupSchemaValidate(schema, dadosBody, { abortEarly: false });

        return dadosValidados;
    }

    static async validarRegistroAcordo({ data }) {
        const schema = yup.object().shape({
            imob: yup.string().required('O campo "onda_juridico_imob" é obrigatório'),
            conta: yup.array().of(
                yup.object().shape({
                    contaCod: yup.string().required("O campo de referência é obrigatório"),
                    contaValor: yup.string().required("O campo de referência é obrigatório"),
                })
            ),
            divida: yup.number().integer("Deve ser um número inteiro").required(),
            datainicio: yup.date().nullable(),
            datatermino: yup.date().nullable(),
            valorparcela: yup.number().integer("Deve ser um número inteiro").nullable(),
            condicao: yup.string().nullable(),
            saldo: yup.number().integer("Deve ser um número inteiro").nullable(),
            taxapaga: yup.number().typeError("Deve ser um número decimal").nullable(),
            info: yup.string().nullable(),
        });
        const dadosValidados = await yupSchemaValidate(schema, data, { abortEarly: false });

        return dadosValidados;
    }
    static async validaUpdateAcordo({ data }) {
        const schema = yup.object().shape({
            data: yup.object().shape({
                imob: yup.string().required("O campo imob é obrigatório"),
                divida: yup.number().integer("Deve ser um número inteiro").required(),
                datainicio: yup.date().nullable(),
                datatermino: yup.date().nullable(),
                valorparcela: yup.number().integer("Deve ser um número inteiro").nullable(),
                condicao: yup.string().nullable(),
                saldo: yup.number().integer("Deve ser um número inteiro").nullable(),
                taxapaga: yup.number().typeError("Deve ser um número decimal").nullable(),
                suspender: yup.number().oneOf([0, 1], "Informação de suspensão não pode ser vazia").required(),
                statusAcordo: yup.number().required("Status do Acordo não pode ser vazio"),
                info: yup.string().nullable(),
            }),
            cod: yup.string().required("O campo cod é obrigatório"),
        });
        const dadosValidados = await yupSchemaValidate(schema, data, { abortEarly: false });

        return dadosValidados;
    }
    static async validaBuscarAcordo({ data }) {
        const schema = yup.object().shape({
            cod: yup.string().required("O campo cod é obrigatório"),
        });
        const dadosValidados = await yupSchemaValidate(schema, data, { abortEarly: false });
        return dadosValidados;
    }



};

export default servicesJuridicoValidate;
