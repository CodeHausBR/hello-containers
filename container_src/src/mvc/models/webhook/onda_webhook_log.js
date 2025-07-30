import * as yup from "yup";
// helpers
import setResponse from "../../../helpers/response/setResponse.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";

//BANCO DADOS
import onda_helpers from "../public/onda_helpers.js";

class onda_webhook_log {
    static async validate({dadosBody}) {
        const schema = yup.object().shape({
            webhookLog: yup.object().shape({
                onda_webhook_id: yup.number().required("onda_webhook_id é obrigatório"),
                onda_webhook_log_status: yup.string().required("onda_webhook_log_status é obrigatório"),
                onda_webhook_log_tentativa: yup.number().required("onda_webhook_log_tentativa é obrigatório"),
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async cadastrar({dadosBody}) {

        
        const {webhookLog} = await this.validate({dadosBody: dadosBody});

        const newWebhookLog = Object({
            // onda_webhook_log_id: gerarCondigoSetores("WEBHOOK_LOG"),
            onda_webhook_id: webhookLog.onda_webhook_id,
            onda_webhook_log_datacriacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_webhook_log_status: webhookLog.onda_webhook_log_status,
            onda_webhook_log_tentativa: webhookLog.onda_webhook_log_tentativa,
        });

        const query = `
            INSERT INTO onda_webhook_log (
              onda_webhook_id, 
              onda_webhook_log_datacriacao, 
              onda_webhook_log_status, 
              onda_webhook_log_tentativa
            ) VALUES (
              '${newWebhookLog.onda_webhook_id}',
              '${newWebhookLog.onda_webhook_log_datacriacao}',
              '${newWebhookLog.onda_webhook_log_status}',
              '${newWebhookLog.onda_webhook_log_tentativa}'
            );
        `;

        const results = await executarQuery(query).catch((err) => {            
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cadastrar webhook log!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível cadastrar o webhook log!",
            });
        }

        const getNewWebhookLog = await this.getOneById({id: results?.insertId});

        return getNewWebhookLog;
        
    }

    static async atualizar({dadosBody, id}) {
        const {webhookLog} = await this.validate({dadosBody: dadosBody});

        const updateWebhookLog = Object({
            onda_webhook_log_status: webhookLog.onda_webhook_log_status,
            onda_webhook_log_tentativa: webhookLog.onda_webhook_log_tentativa,
        });

        const query = `
            UPDATE onda_webhook_log 
            SET 
              onda_webhook_log_status = '${updateWebhookLog.onda_webhook_log_status}',
              onda_webhook_log_tentativa = '${updateWebhookLog.onda_webhook_log_tentativa}',
              onda_webhook_log_dataupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'
            WHERE 
              onda_webhook_log_id = '${id}';
        `;

        const results = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar webhook log!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível atualizar o webhook log!",
            });
        }

        const getWebhookLog = await this.getOneById({id: id});

        return getWebhookLog;
    }

    static async getOneById({id}) {
        const schema = yup.object().shape({
            id: yup.string().required("id em get webhook log é obrigatório!"),
        });

        const dadosBody = await yupSchemaValidate(schema, {id: id}, {abortEarly: false});

        const query = `
            SELECT 
                *
            FROM onda_webhook_log
            WHERE onda_webhook_log_id = '${dadosBody.id}'
        `;

        const [webhookLog] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar webhook log!",
            });
        });

        return webhookLog;
    }

    static async getOneByWebhookId({webhookId}) {
        const schema = yup.object().shape({
            webhookId: yup.string().required("webhookId em get webhook log é obrigatório!"),
        });

        const dadosBody = await yupSchemaValidate(schema, {webhookId: webhookId}, {abortEarly: false});

        const query = `
            SELECT 
                *
            FROM onda_webhook_log
            WHERE onda_webhook_id = '${dadosBody.webhookId}'
        `;

        const [webhookLog] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar webhook log!",
            });
        });

        return webhookLog;
    }

    static async getAll() {
        const query = `
            SELECT 
                *
            FROM VW_WEBHOOK_LOG
        `;

        const webhookLogs = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar webhook logs!",
            });
        });

        return webhookLogs;
    }


}

export default onda_webhook_log;
