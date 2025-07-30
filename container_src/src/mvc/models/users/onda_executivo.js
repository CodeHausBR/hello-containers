import * as yup from "yup";
import crypto from "crypto";
// helpers
import setResponse from "../../../helpers/response/setResponse.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";

//BANCO DADOS
import onda_followup from "../../models/public/onda_followup.js";
class onda_executivo {
    static async validate({dadosBody}) {
        const schema = yup.object().shape({
            executivo: yup.object().shape({
                parceiro: yup.number().default(1).required("Parceiro é obrigatório"), // PRECISA VIR PELO TOKEN
                email: yup.string().max(100, "E-mail deve ter no máximo 100 caracteres").required("E-mail é obrigatório"),
                password: yup.string().max(300, "Senha deve ter no máximo 300 caracteres").required("Senha é obrigatória"),
                nome: yup.string().max(45, "Nome deve ter no máximo 45 caracteres").required("Nome é obrigatório"),
                estado: yup.string().max(45, "Estado deve ter no máximo 45 caracteres"),
                cpfcnpj: yup.string().max(45, "CPF/CNPJ deve ter no máximo 45 caracteres"),
                regiao: yup.string().max(45, "Região deve ter no máximo 45 caracteres"),
                comissaoAtiva: yup.boolean().required("Enviar se a comissão vai ser ativa ou não"),
                ativo: yup.boolean().default(true),
                tipo_executivo: yup.object().shape({id: yup.number().required(), value: yup.string().required()}).required("tipo executivo obrigatório")
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validate_update({dadosBody}) {
        const schema = yup.object().shape({
            executivo: yup.object().shape({
                parceiro: yup.number().default(1).required("Parceiro é obrigatório"), // PRECISA VIR PELO TOKEN
                email: yup.string().max(100, "E-mail deve ter no máximo 100 caracteres").required("E-mail é obrigatório"),
                nome: yup.string().max(45, "Nome deve ter no máximo 45 caracteres").required("Nome é obrigatório"),
                estado: yup.string().max(45, "Estado deve ter no máximo 45 caracteres"),
                cpfcnpj: yup.string().max(45, "CPF/CNPJ deve ter no máximo 45 caracteres"),
                regiao: yup.string().max(45, "Região deve ter no máximo 45 caracteres"),
                comissaoAtiva: yup.boolean(),
                ativo: yup.boolean(),
                tipo_executivo: yup.object().shape({id: yup.number(), value: yup.string()})
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validateId({id}) {
        const schema = yup.object().shape({
            id: yup.number().required("ID é obrigatório"),
        });
        return await yupSchemaValidate(schema, {id: id}, {abortEarly: false});
    }

    static async validateCod({cod}) {
        const schema = yup.object().shape({
            cod: yup
                .string()
                .required("cod é obrigatório")
                .matches(/^EXEC-/, "ex: EXEC-4564564231-2024"),
        });

        return await yupSchemaValidate(schema, {cod: cod}, {abortEarly: false});
    }

    static async cadastrar({dadosBody, token}) {
        
        const {executivo} = await this.validate({dadosBody: dadosBody});
        const hashedPassword = crypto.createHash("md5").update(executivo.password).digest("hex");

        const newExecutivo = Object({
            onda_executivo_codigo: gerarCondigoSetores("EXEC"),
            onda_executivo_parceiro: executivo.parceiro,
            onda_executivo_email: executivo.email,
            onda_executivo_password: hashedPassword,
            onda_executivo_nome: executivo.nome,
            onda_executivo_estado: executivo.estado,
            onda_executivo_cpfcnpj: executivo.cpfcnpj,
            onda_executivo_regiao: executivo.regiao,
            onda_executivo_datacriacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_executivo_receber_comissao: executivo?.comissaoAtiva === true ? 1 : 0,
            onda_executivo_ativo: executivo?.ativo === true ? 1 : 0,
            onda_executivo_tipo_executivo: executivo?.tipo_executivo
        });

        const checkQuery = `
        SELECT onda_executivo_id FROM onda_executivo 
        WHERE onda_executivo_email = ? OR onda_executivo_cpfcnpj = ? 
        LIMIT 1;
        `;

        const existingUser = await executarQuery(checkQuery, [newExecutivo.onda_executivo_email, newExecutivo.onda_executivo_cpfcnpj]);

        if (existingUser.length > 0) {
            return setResponse.WARNING({message: "Usuário já existe com este e-mail ou CPF/CNPJ!"});
        }

        const insertQuery = `
            INSERT INTO onda_executivo (
              onda_executivo_codigo, 
              onda_executivo_parceiro, 
              onda_executivo_email, 
              onda_executivo_password, 
              onda_executivo_nome, 
              onda_executivo_estado, 
              onda_executivo_cpfcnpj, 
              onda_executivo_regiao, 
              onda_executivo_datacriacao,
              onda_executivo_receber_comissao,
              onda_executivo_ativo,
              onda_executivo_user_create,
              onda_executivo_type_user,
              onda_executivo_tipo_executivo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?);
        `;
        
        const results = await executarQuery(insertQuery, [
            newExecutivo.onda_executivo_codigo,
            newExecutivo.onda_executivo_parceiro,
            newExecutivo.onda_executivo_email,
            newExecutivo.onda_executivo_password,
            newExecutivo.onda_executivo_nome,
            newExecutivo.onda_executivo_estado,
            newExecutivo.onda_executivo_cpfcnpj,
            newExecutivo.onda_executivo_regiao,
            newExecutivo.onda_executivo_datacriacao,
            newExecutivo.onda_executivo_receber_comissao,
            newExecutivo.onda_executivo_ativo,
            token.id,
            token.type_user,
            newExecutivo.onda_executivo_tipo_executivo.id
        ])
            .then(async (res) => {
                await onda_followup.postFollowup({token: token, cod: newExecutivo.onda_executivo_codigo, event: "Sucesso ao criar executivo!"});

                return res;
            })
            .catch((err) => {
                
                return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar executivo!"});
            });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possível cadastrar o executivo!"});
        }

        const getNewExecutivo = await this.getOneById({id: results?.insertId});

        return getNewExecutivo;
    }

    static async atualizar({dadosBody, cod, token}) {
        
        const {executivo} = await this.validate_update({dadosBody: dadosBody});

        const dadosValidados = await this.validateCod({cod: cod});
        
        const hashedPassword = (executivo.password && crypto.createHash("md5").update(executivo.password).digest("hex")) || null;

        const updateExecutivo = Object({
            onda_executivo_parceiro: executivo.parceiro,
            onda_executivo_email: executivo.email,
            onda_executivo_password: hashedPassword,
            onda_executivo_nome: executivo.nome,
            onda_executivo_estado: executivo.estado,
            onda_executivo_cpfcnpj: executivo.cpfcnpj,
            onda_executivo_regiao: executivo.regiao,
            onda_executivo_receber_comissao: executivo?.comissaoAtiva === true ? 1 : 0,
            onda_executivo_ativo: executivo?.ativo === true ? 1 : 0,
            onda_executivo_tipo_executivo: executivo?.tipo_executivo.id
        });
        
        const query = `
            UPDATE onda_executivo 
            SET 
                onda_executivo_parceiro = '${updateExecutivo.onda_executivo_parceiro}',
                onda_executivo_email = '${updateExecutivo.onda_executivo_email}',
                ${set_update_pass()}
                onda_executivo_ativo = '${updateExecutivo.onda_executivo_ativo}',
                onda_executivo_nome = '${updateExecutivo.onda_executivo_nome}',
                onda_executivo_estado = '${updateExecutivo.onda_executivo_estado}',
                onda_executivo_cpfcnpj = '${updateExecutivo.onda_executivo_cpfcnpj}',
                onda_executivo_regiao = '${updateExecutivo.onda_executivo_regiao}',
                onda_executivo_dataupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_executivo_user_update = '${token.id}',
                onda_executivo_receber_comissao = '${updateExecutivo.onda_executivo_receber_comissao}',
                onda_executivo_type_user = '${token.type_user}',
                onda_executivo_tipo_executivo = '${updateExecutivo.onda_executivo_tipo_executivo}'
            WHERE 
            onda_executivo_codigo = '${dadosValidados.cod}';
        `;
        
        function set_update_pass() {
            if (updateExecutivo.onda_executivo_password) {
                return `onda_executivo_password = '${hashedPassword}',`;
            } else {
                return ``;
            }
        }

        const results = await executarQuery(query)
            .then(async (res) => {
                await onda_followup.postFollowup({token: token, cod: dadosValidados.cod, event: "Sucesso ao atualizar executivo!"});

                return res;
            })
            .catch((e) => {
                
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar executivo!"});
            });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possível atualizar o executivo!"});
        }

        const getExecutivo = await this.getOneByCod({cod: dadosValidados.cod});

        return getExecutivo;
    }

    static async getOneByCod({cod}) {
        const dadosValidados = await this.validateCod({cod: cod});

        const query = `
        SELECT 
            *
        FROM VW_EXECUTIVO
            WHERE codigo = '${dadosValidados.cod}'
        `;

        const [executivo] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar executivo!"});
        });

        return executivo;
    }

    static async getOneById({id}) {
        const dadosValidados = await this.validateId({id: id});

        const query = `
            SELECT 
              *
            FROM VW_EXECUTIVO
            WHERE id = '${dadosValidados.id}'
        `;

        const [executivo] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar executivo!"});
        });

        return executivo;
    }

    static async getAll() {
        const query = `
            SELECT 
              *
            FROM VW_EXECUTIVO
        `;

        const executivos = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar executivos!"});
        });

        return executivos;
    }
}

export default onda_executivo;
