import * as yup from "yup";
// helpers
import setResponse from "../../../helpers/response/setResponse.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";

//BANCO DADOS
import onda_helpers from "../../models/public/onda_helpers.js";

//MODELS 
import onda_webhook_log from "./onda_webhook_log.js";

class onda_webhook {
    static async validate({dadosBody}) {
        const arrayIds = await onda_helpers.buscarArrayIdHelpersStatus();

        const schema = yup.object().shape({
            webhook: yup.object().shape({
                matrix: yup.string().max(45, "Matrix deve ter no máximo 45 caracteres").required("Matrix é obrigatório"),
                url: yup.string().max(500, "URL deve ter no máximo 500 caracteres").required("URL é obrigatória"),
                evento: yup
                    .object()
                    .shape({
                        id: yup
                            .number()
                            .required("evento.id do evento é obrigatório")
                            .test("", `evento.id deve ser: ${arrayIds?.helpers?.webhookAtualizacaoCf}!`, (value) => {
                                return arrayIds?.helpers?.webhookAtualizacaoCf?.includes(value);
                            }),
                        value: yup.string().required("value do evento é obrigatório"),
                    })
                    .required("O evento é obrigatório!"),
                status: yup
                    .object()
                    .shape({
                        id: yup
                            .number()
                            .required("status.id do evento é obrigatório")
                            .test("", `status.id deve ser: ${arrayIds?.helpers?.statusPadrao}!`, (value) => {
                                return arrayIds?.helpers?.statusPadrao?.includes(value);
                            }),
                        value: yup.string().required("value do evento é obrigatório"),
                    })
                    .required("O status é obrigatório!"),
            }),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validateCodWebhook({codWebhook}) {
        const schema = yup.object().shape({
            codWebhook: yup
                .string()
                .required("codWebhook é obrigatório!")
                .matches(/^WEBHOOK-/, "O código deve ser o contrato ex: WEBHOOK-4564564231-2024!"),
        });

        const dadosBody = await yupSchemaValidate(schema, {codWebhook: codWebhook}, {abortEarly: false});
        return dadosBody;
    }

    static async cadastrar({dadosBody}) {
        const {webhook} = await this.validate({dadosBody: dadosBody});

        const newWebhook = Object({
            onda_webhook_cod: gerarCondigoSetores("WEBHOOK"),
            onda_webhook_matrix: webhook?.matrix,
            onda_webhook_status_id: webhook?.status?.id,
            onda_webhook_url: webhook?.url,
            onda_webhook_evento_id: webhook?.evento?.id,
            onda_webhook_datacriacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_webhook_tentativas: 0,
        });

        const query = `
            INSERT INTO onda_webhook (
              onda_webhook_cod, 
              onda_webhook_matrix, 
              onda_webhook_status_id, 
              onda_webhook_url, 
              onda_webhook_evento_id, 
              onda_webhook_datacriacao, 
              onda_webhook_tentativas
            ) VALUES (
              '${newWebhook.onda_webhook_cod}',
              '${newWebhook.onda_webhook_matrix}',
              '${newWebhook.onda_webhook_status_id}',
              '${newWebhook.onda_webhook_url}',
              '${newWebhook.onda_webhook_evento_id}',
              '${newWebhook.onda_webhook_datacriacao}',
              '${newWebhook.onda_webhook_tentativas}'
            );
        `;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cadastrar webhook!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível cadastrar o webhook!",
            });
        }

        const getNewWebhook = await this.getOneById({id: results?.insertId});

        return getNewWebhook;
    }

    static async atualizar({dadosBody, codWebhook}) {
        const {webhook} = await this.validate({dadosBody: dadosBody});

        const cod = await this.validateCodWebhook({codWebhook: codWebhook});

        const updateWebhook = Object({
            onda_webhook_status_id: webhook.status?.id,
            onda_webhook_url: webhook.url,
            onda_webhook_evento_id: webhook.evento?.id,
        });

        const query = `
            UPDATE onda_webhook 
            SET 
              onda_webhook_status_id = '${updateWebhook.onda_webhook_status_id}',
              onda_webhook_url = '${updateWebhook.onda_webhook_url}',
              onda_webhook_evento_id = '${updateWebhook.onda_webhook_evento_id}',
              onda_webhook_dataupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'
            WHERE 
              onda_webhook_cod = '${cod.codWebhook}';
        `;

        const results = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar webhook!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível atualizar o webhook!",
            });
        }

        const getWebhook = await this.getOneByCod({codWebhook: cod.codWebhook});

        return getWebhook;
    }

    static async getOneByCod({codWebhook}) {
        const dadosValidados = await this.validateCodWebhook({codWebhook: codWebhook});

        const query = `
            SELECT 
                *
            FROM VW_WEBHOOK
            WHERE cod = '${dadosValidados.codWebhook}'
        `;

        const [webhooks] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar webhook!",
            });
        });

        return webhooks;
    }

    static async getOneById({id}) {
        const schema = yup.object().shape({
            id: yup.string().required("id em get webhook é obrigatório!"),
        });

        const dadosBody = await yupSchemaValidate(schema, {id: id}, {abortEarly: false});

        const query = `
            SELECT 
                *
            FROM VW_WEBHOOK
            WHERE id = '${dadosBody.id}'
        `;

        const [webhooks] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar webhook!",
            });
        });

        return webhooks;
    }

    static async getAll() {
        const query = `
            SELECT 
                *
            FROM VW_WEBHOOK
        `;

        const webhooks = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar webhooks!",
            });
        });

        return webhooks;
    }
    
    static async enviarEventos({data }) {

        const query = ` SELECT * FROM onda_webhook`

        const dataBaseWebhook = await executarQuery(query).catch(() => {
          return  setResponse.DATABASE_ERROR("Erro ao buscar base de webhook")
        })

        const options = {
            method: "POST",
            headers: this.header(),
            body: JSON.stringify({
                status: 200,
                code: "SUCCESS",
                type: "success",
                message: "Sucesso ao receber evento!",
                count: 1,
                results: data
            }) ,    
            redirect: "follow",
        };


        for( let i = 0; i < dataBaseWebhook?.length; i++) {
            const url = dataBaseWebhook?.[i]?.onda_webhook_url
            

            await fetch(`${url}`, options)
                .then(async (response) => {
               
                    const  dadosBody = {
                        webhookLog: {
                            onda_webhook_id: dataBaseWebhook?.[i]?.onda_webhook_id,
                            onda_webhook_log_status: "sucesso",
                            onda_webhook_log_tentativa: 1,
                        }
                    }
                    await onda_webhook_log.cadastrar({dadosBody:dadosBody})
                    
                })
                .catch(async (err) => {
                    const  dadosBody = {
                        webhookLog: {
                            onda_webhook_id: dataBaseWebhook?.[i]?.onda_webhook_id,
                            onda_webhook_log_status: "erro",
                            onda_webhook_log_tentativa: 1,
                        }
                    }
                   await onda_webhook_log.cadastrar({dadosBody: dadosBody})
                });
        
        }

    }

    static header() {
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");
        myHeaders.append("content-type", "application/json");

        return myHeaders;
    }
}

export default onda_webhook;
