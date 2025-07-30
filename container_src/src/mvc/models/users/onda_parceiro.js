import * as yup from "yup";
import crypto from "crypto";
//helpers
import setResponse from "../../../helpers/response/setResponse.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//models
import onda_followup from "../public/onda_followup.js";
const onda_parceiro = class onda_parceiro {
    static async validate({dadosBody}) {
        const schema = yup.object().shape({
            parceiro: yup.object().shape({
                email: yup.string().email("Email inválido").max(100, "Email deve ter no máximo 100 caracteres").required("Email é obrigatório"),
                password: yup.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(100, "Senha deve ter no máximo 100 caracteres").required("Senha é obrigatória"),
                nome: yup.string().max(45, "Nome deve ter no máximo 45 caracteres").required("Nome é obrigatório"),
                estado: yup.string().max(45, "Estado deve ter no máximo 45 caracteres").required("Estado é obrigatório"),
                cpfcnpj: yup.string().required("CPF/CNPJ é obrigatório"),
                regiao: yup.string().max(45, "Região deve ter no máximo 45 caracteres").required("Região é obrigatória"),
                parceiroAtivo: yup.boolean(),
                parceiroComissao: yup.boolean(),
                tipo_parceiro: yup.object().shape({id: yup.number().required(), value: yup.string().required()}).required("O tipo de parceiro é obrigatório")
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validar_update({dadosBody}) {
        const schema = yup.object().shape({
            parceiro: yup.object().shape({
                email: yup.string().email("Email inválido").max(100, "Email deve ter no máximo 100 caracteres").required("Email é obrigatório"),
                password: yup.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(100, "Senha deve ter no máximo 100 caracteres"),
                nome: yup.string().max(45, "Nome deve ter no máximo 45 caracteres").required("Nome é obrigatório"),
                estado: yup.string().max(45, "Estado deve ter no máximo 45 caracteres").required("Estado é obrigatório"),
                cpfcnpj: yup.string().required("CPF/CNPJ é obrigatório"),
                regiao: yup.string().max(45, "Região deve ter no máximo 45 caracteres").required("Região é obrigatória"),
                parceiroAtivo: yup.boolean(),
                parceiroComissao: yup.boolean(),
                tipo_parceiro: yup.object().shape({id: yup.number(), value: yup.string()})
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validateCodParceiro({codParceiro}) {
        const schema = yup.object().shape({
            codParceiro: yup
                .string()
                .required("codParceiro é obrigatório!")
                .matches(/^PARC-/, "O código  deve ser o contrato ex: PARC-4564564231-2024!"),
        });

        const dadosBody = await yupSchemaValidate(schema, {codParceiro: codParceiro}, {abortEarly: false});
        return dadosBody;
    }

    static async cadastrar({dadosBody, token}) {
        
        const dadosValidados = await this.validate({dadosBody: dadosBody});
        
        const hashedPassword = crypto.createHash("md5").update(dadosValidados?.parceiro?.password).digest("hex");

        const newParceiro = Object({
            onda_parceiro_codigo: gerarCondigoSetores("PARC"),
            onda_parceiro_email: dadosValidados?.parceiro?.email,
            onda_parceiro_passowrd: hashedPassword,
            onda_parceiro_nome: dadosValidados?.parceiro?.nome,
            onda_parceiro_estado: dadosValidados?.parceiro?.estado,
            onda_parceiro_cpfcnpj: dadosValidados?.parceiro?.cpfcnpj,
            onda_parceiro_regiao: dadosValidados?.parceiro?.regiao,
            onda_parceiro_datacriacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_parceiro_dataupdate: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_parceiro_tipo_parceiro: dadosValidados?.parceiro.tipo_parceiro
        });

        const checkQuery = `
            SELECT onda_parceiro_id FROM onda_parceiro 
            WHERE onda_parceiro_email = ? OR onda_parceiro_cpfcnpj = ? 
            LIMIT 1;
        `;

        const existingUser = await executarQuery(checkQuery, [newParceiro.onda_parceiro_email, newParceiro.onda_parceiro_cpfcnpj]);

        if (existingUser.length > 0) {
            return setResponse.WARNING({message: "Usuário já existe com este e-mail ou CPF/CNPJ!"});
        }

        const insertQuery = `
        INSERT INTO onda_parceiro (
            onda_parceiro_codigo, 
            onda_parceiro_email, 
            onda_parceiro_passowrd, 
            onda_parceiro_nome, 
            onda_parceiro_estado, 
            onda_parceiro_cpfcnpj, 
            onda_parceiro_regiao, 
            onda_parceiro_datacriacao, 
            onda_parceiro_dataupdate,
            onda_parceiro_user_create,
            onda_parceiro_type_user,
            onda_parceiro_tipo_parceiro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

        const results = await executarQuery(insertQuery, [
            newParceiro.onda_parceiro_codigo,
            newParceiro.onda_parceiro_email,
            newParceiro.onda_parceiro_passowrd,
            newParceiro.onda_parceiro_nome,
            newParceiro.onda_parceiro_estado,
            newParceiro.onda_parceiro_cpfcnpj,
            newParceiro.onda_parceiro_regiao,
            newParceiro.onda_parceiro_datacriacao,
            newParceiro.onda_parceiro_dataupdate,
            token.id,
            token.type_user,
            newParceiro.onda_parceiro_tipo_parceiro.id
        ])
            .then(async (res) => {
                await onda_followup.postFollowup({token: token, cod: newParceiro.onda_parceiro_codigo, event: "Sucesso ao criar parceiro!"});

                return res;
            })
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar parceiro!"});
            });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel cadastrar o parceiro!"});
        }

        const parceiro = await this.getOneById({id: results?.insertId});

        return parceiro;
    }

    static async atualizar({dadosBody, codParceiro, token}) {
        const dadosValidados = await this.validar_update({dadosBody: dadosBody});
        const cod = await this.validateCodParceiro({codParceiro: codParceiro});

        const hashedPassword = (dadosValidados?.parceiro?.password && crypto.createHash("md5").update(dadosValidados?.parceiro?.password).digest("hex")) || null;

        const updateParceiro = Object({
            onda_parceiro_codigo: cod?.codParceiro,
            onda_parceiro_email: dadosValidados?.parceiro?.email,
            onda_parceiro_passowrd: hashedPassword,
            onda_parceiro_nome: dadosValidados?.parceiro?.nome,
            onda_parceiro_estado: dadosValidados?.parceiro?.estado,
            onda_parceiro_cpfcnpj: dadosValidados?.parceiro?.cpfcnpj,
            onda_parceiro_regiao: dadosValidados?.parceiro?.regiao,
            onda_parceiro_ativo: dadosValidados?.parceiro?.parceiroAtivo === true ? 1 : 0,
            onda_parceiro_receber_comissao: dadosValidados?.parceiro?.parceiroComissao === true ? 1 : 0,
            onda_parceiro_dataupdate: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_parceiro_tipo_parceiro: dadosValidados?.parceiro.tipo_parceiro.id
        });

        const query = `
            UPDATE onda_parceiro 
            SET 
                onda_parceiro_email = '${updateParceiro?.onda_parceiro_email}',
                ${set_update_pass()}
                onda_parceiro_nome = '${updateParceiro?.onda_parceiro_nome}',
                onda_parceiro_estado = '${updateParceiro?.onda_parceiro_estado}',
                onda_parceiro_cpfcnpj = '${updateParceiro?.onda_parceiro_cpfcnpj}',
                onda_parceiro_regiao = '${updateParceiro?.onda_parceiro_regiao}',
                onda_parceiro_dataupdate = '${updateParceiro?.onda_parceiro_dataupdate}',
                onda_parceiro_user_update = '${token.id}',
                onda_parceiro_type_user = '${token.type_user}',
                onda_parceiro_receber_comissao = '${updateParceiro?.onda_parceiro_receber_comissao}',
                onda_parceiro_ativo = '${updateParceiro?.onda_parceiro_ativo}',
                onda_parceiro_tipo_parceiro = '${updateParceiro?.tipo_parceiro}'
            WHERE 
                onda_parceiro_codigo = '${cod?.codParceiro}';
        `;

        function set_update_pass() {
            if (updateParceiro?.onda_parceiro_passowrd) {
                return `onda_parceiro_passowrd = ${updateParceiro?.onda_parceiro_passowrd},`;
            } else {
                return ``;
            }
        }

        const results = await executarQuery(query)
            .then(async (res) => {
                await onda_followup.postFollowup({token: token, cod: cod?.codParceiro, event: "Sucesso ao atualizar parceiro!"});
                return res;
            })
            .catch(async () => {
                await onda_followup.postFollowup({token: token, cod: cod?.codParceiro, event: "Erro ao atualizar parceiro!"});

                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar parceiro!"});
            });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possível atualizar o parceiro!"});
        }

        const parceiro = await this.getOneByCod({codParceiro: cod?.codParceiro});

        return parceiro;
    }

    static async getOneByCod({codParceiro}) {
        const dadosValidados = await this.validateCodParceiro({codParceiro: codParceiro});

        const query = `
        SELECT 
            *
        FROM VW_PARCEIRO AS VW
        WHERE parceiroCod = '${dadosValidados?.codParceiro}'
    `;

        const [parceiros] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar parceiros!"});
        });

        return parceiros;
    }

    static async getOneById({id}) {
        const schema = yup.object().shape({
            id: yup.string().required("id em get parceiro é obrigatório!"),
        });

        const dadosBody = await yupSchemaValidate(schema, {id: id}, {abortEarly: false});

        const query = `
        SELECT 
            *
        FROM VW_PARCEIRO AS VW
        WHERE id = '${dadosBody?.id}'
    `;

        const [parceiros] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar parceiros!"});
        });

        return parceiros;
    }

    static async getAll() {
        const query = `
            SELECT 
                *
            FROM VW_PARCEIRO
        `;

        const parceiros = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar parceiros!"});
        });

        return parceiros;
    }
};

export default onda_parceiro;
