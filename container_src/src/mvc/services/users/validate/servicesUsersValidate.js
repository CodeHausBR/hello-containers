//BIBLIOTECAS
import crypto from "crypto";
import yup from "yup";

//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS

//SERVICES

const servicesUsersValidate = class servicesUsersValidate {
    static async patchOndaImob(dadosBody) {
        const schema = yup.object().shape({
            imobNome: yup.string().max(200),
            imobCpfCnpj: yup.string().max(25),
            imobCreci: yup.string().max(25),
            imobCep: yup.string().max(15),
            imobRua: yup.string().max(200),
            imobNumero: yup.string().max(10),
            imobBairro: yup.string().max(200),
            imobCidade: yup.string().max(200),
            imobUf: yup.string().max(2),
            ondaImobComplemento: yup.string().max(200),
            imobEmail: yup.string().max(200),
            imobInstagram: yup.string().max(200),
            imobTelefone: yup.string().max(25),
            imobContato: yup.string().max(250),
            imobConsultor: yup.number().integer(),
            imobAlteradoPor: yup.number().integer().required().default(dadosBody?.token?.onda_user_id),
            imobDataAlteracao: yup.string().default(getDataHorarioAtual.YYYY_MM_DD_00_00_00()),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async ondaUser(dadosBody) {
        const schema = yup
            .object()
            .shape({
                userUsername: yup.string().max(100).required("userUsername é obrigatório"),
                userPass: yup.string().default(crypto.createHash("md5").update(dadosBody?.userPass).digest("hex")).required("Erro ao criptografar senha!"),
                userDepartamento: yup.string().max(100),
                userNomecompleto: yup.string().max(150),
                userCpf: yup.string().max(20),
                userEmail: yup.string().max(200).email("userEmail deve ser um email válido"),
                userAtivo: yup.number().integer(),
            })
            .noUnknown();

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async ondaPermissao(dadosBody) {
        const schema = yup
            .object()
            .shape({
                permissaoComercial: yup.number().integer().max(1),
                permissaoAnalise: yup.number().integer().max(1),
                permissaoFinanceiro: yup.number().integer().max(1),
                permissaoJuridico: yup.number().integer().max(1),
                permissaoSinistro: yup.number().integer().max(1),
                permissaoVistoria: yup.number().integer().max(1),
                permissaoCobranca: yup.number().integer().max(1),
                permissaoDashboardComercial: yup.number().integer().max(1),
                permissaoDashboardAnalise: yup.number().integer().max(1),
                permissaoDashboardFinanceiro: yup.number().integer().max(1),
                permissaoDashboardSinistro: yup.number().integer().max(1),
                permissaoDashboardJuridico: yup.number().integer().max(1),
                permissaoDashboardCobranca: yup.number().integer().max(1),
                permissaoDashboardVistoria: yup.number().integer().max(1),
                permissaoDashboardImobiliaria: yup.number().integer().max(1),
                permissaoDashboardParceiro: yup.number().integer().max(1),
                permissaoDashboardExecutivo: yup.number().integer().max(1),
            })
            .noUnknown();

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async login_validate(dadosBody) {
        const schema = yup.object().shape({
            email: yup.string().required("Por favor insira o e-amail!"),
            password: yup.string().required("Por favor insira a senha!"),
        });

        return await schema.validate(dadosBody).catch((error) => {
            return setResponse.SCHEMA_VALIDATION(error.errors[0]);
        });
    }
};

export default servicesUsersValidate;
