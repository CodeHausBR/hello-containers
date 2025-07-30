//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import onda_followup from "../public/onda_followup.js";
import onda_pay from "../analise/onda_pay.js";
import helpersControllerAsaas from "../../../helpers/bancos/asaas/controller/helpersControllerAsaas.js";

//BANCO DE DADOS

//SERVICES

const onda_sinistro_cobranca = class onda_sinistro_cobranca {
    static async validatePut({dadosBody = Object()}) {
        const schema = yup.object().shape({
            sinistroCobrancaCod: yup.string().required().matches(/^OSC-/, "O código deve ser o cod da cobrança ex: OSC-4564564231-2024"),
            sinistroCobrancaStatusId: yup.number().required(),
            sinistroCobrancaStatusApiCobranca: yup.string().required(),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validatePost({dadosBody = Object()}) {
        const schema = yup.object().shape({
            sinistroCobrancaMatrix: yup.string().required().matches(/^SN-/, "O código deve ser ex: SN-4564564231-2024"),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validatePutColab({dadosBody = Object()}) {
        const schema = yup.object().shape({
            id_colaborador: yup.number().integer().required("O id do colaborador é obrigatório"),
            id_contrato: yup.number().integer().required("O id do contrato é obrigatório"),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async post({token = Object(), sinistro, valor = null}) {
        // verificar se os dados da cobrança estão sendo mandados

        const newItem = {
            sinistroCobrancaMatrix: sinistro?.sinistroCodigo,
        };

        const dadosValidados = await this.validatePost({dadosBody: newItem});

        const query = `
            INSERT INTO onda_sinistro_cobranca (
                onda_sinistro_cobranca_sinistro_id,
                onda_sinistro_cobranca_cartafianca_id,
                onda_sinistro_cobranca_cod,
                onda_sinistro_cobranca_matrix,
                onda_sinistro_cobranca_criacao,
                onda_sinistro_cobranca_valor_final
            ) VALUES (
                '${sinistro?.id}',
                '${sinistro?.sinistroIdContrato}',
                '${gerarCondigoSetores("OSC")}',
                '${dadosValidados?.sinistroCobrancaMatrix}',
                '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                '${valor}'
            );
        `;

        const results = await executarQuery(query).catch(async (err) => {
            await onda_followup.postFollowup({token: token, cod: sinistro?.sinistroCodigo, event: "🤖 *Erro ao inserir nova cobrança!! 🛑"});
            return setResponse.DATABASE_ERROR({message: "Erro ao inserir nova cobrança!"});
        });

        if (!results || results.affectedRows === 0) {
            await onda_followup.postFollowup({token: token, cod: sinistro?.sinistroCodigo, event: "🤖 *Não foi possível inserir a nova cobrança! 🛑"});
            return setResponse.WARNING({message: "Não foi possível inserir a nova cobrança!"});
        }

        await onda_followup.postFollowup({token: token, cod: sinistro?.sinistroCodigo, event: "🤖 Sucesso ao cadastrar cobrança no status 15 dias! 🆗"});
        return await this.getOneCobrancaAgrupadaPelaMatrixNotResView({codSinistro: sinistro?.sinistroCodigo});
    }

    static async postModificado({token = Object(), refId = 0, contrato, refMatrix, valor = null}) {
        // verificar se os dados da cobrança estão sendo mandado
        const matrixCobranca = gerarCondigoSetores("OSC");
        const query = `
            INSERT INTO onda_sinistro_cobranca (
                onda_sinistro_cobranca_sinistro_id,
                onda_sinistro_cobranca_cartafianca_id,
                onda_sinistro_cobranca_cod,
                onda_sinistro_cobranca_matrix,
                onda_sinistro_cobranca_criacao
                onda_sinistro_cobranca_valor_final
            ) VALUES (
                '${refId}',
                '${contrato}',
                '${matrixCobranca}',
                '${refMatrix}',
                '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                '${valor}'
            );
        `;

        const results = await executarQuery(query).catch(async (err) => {
            await onda_followup.postFollowup({token: token, cod: matrixCobranca, event: "🤖 *Erro ao inserir nova cobrança!! 🛑"});
            return setResponse.DATABASE_ERROR({message: "Erro ao inserir nova cobrança!"});
        });

        if (!results || results.affectedRows === 0) {
            await onda_followup.postFollowup({token: token, cod: matrixCobranca, event: "🤖 *Não foi possível inserir a nova cobrança! 🛑"});
            return setResponse.WARNING({message: "Não foi possível inserir a nova cobrança!"});
        }

        await onda_followup.postFollowup({token: token, cod: matrixCobranca, event: "🤖 Sucesso ao cadastrar cobrança no status 15 dias! 🆗"});
        return;
    }

    static async put({dadosBody = Object(), token = Object(), cod = String()}) {
        if (dadosBody?.length == 0) return [];
        const oldCobranca = await this.verificarSeCobrancaExistePeloCodigoSinistro({codSinistro: dadosBody?.sinistroCobrancaMatrix});
        const pagamentoConjunto = dadosBody?.sinistroCobrancaPagamentoConjunto;

        //alterado aqui para correcao de cobran;a conjunta - refatorar
        const cobrancaItem = await onda_pay.getCobrancaConjuntaCod([cod]);

        if (cobrancaItem?.[0]?.onda_pay_assas_payment_id) {
            const warningResponse = await helpersControllerAsaas.buscarUmaCobrancaPeloId({
                id: cobrancaItem[0].onda_pay_assas_payment_id,
                res: res,
            });

            if (warningResponse) {
                return warningResponse;
            }
        }

        const newItem = new Object({
            sinistroCobrancaCod: oldCobranca?.sinistroCobrancaCod,
            sinistroCobrancaStatusApiCobranca: dadosBody?.sinistroCobrancaStatusApiCobranca,
            //sinistroCobrancaValorTotal: dadosBody?.sinistroCobrancaValorTotal,
            sinistroCobrancaStatusId: dadosBody?.sinistroCobrancaStatusId,
        });

        const dadosValidados = await this.validatePut({dadosBody: newItem});

        if (pagamentoConjunto != null) {
            const query = `
                    UPDATE onda_sinistro_cobranca
                    SET 
                        onda_sinistro_cobranca_status = '${dadosValidados.sinistroCobrancaStatusId}',
                        onda_sinistro_cobranca_status_api_cobranca = '${dadosValidados.sinistroCobrancaStatusApiCobranca}',
                        onda_sinistro_cobranca_pagamento_conjunto = NULL
                    WHERE onda_sinistro_cobranca_pagamento_conjunto = '${pagamentoConjunto}'
                `;

            const results = await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar cobranças conjuntas!"});
            });

            await executarQuery(`
                UPDATE onda_pay
                SET 
                    onda_pay_status = 506
                WHERE onda_pay_cod_cobranca = '${pagamentoConjunto}'
                AND onda_pay_status <> 512;
            `).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar cobranças conjuntas!"});
            });

            if (results?.affectedRows === 0) {
                return setResponse.WARNING({message: "Não foi possível atualizar cobranças conjuntas!"});
            }

            return await this.getOneCobrancaAgrupadaPelaMatrixNotResView({
                codSinistro: dadosBody?.sinistroCobrancaMatrix,
            });
        }

        //onda_sinistro_cobranca_data_pagamento = '${dadosValidados?.sinistroCobrancaDataPagamento}',
        const query = `
            UPDATE onda_sinistro_cobranca
            SET 
                onda_sinistro_cobranca_status = '${dadosValidados?.sinistroCobrancaStatusId}',
                onda_sinistro_cobranca_status_api_cobranca = '${dadosValidados?.sinistroCobrancaStatusApiCobranca}'
            WHERE onda_sinistro_cobranca_cod = '${dadosValidados?.sinistroCobrancaCod}' 
        `;
        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status cobrança!"});
        });
        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar cobrança!"});
        }

        return await this.getOneCobrancaAgrupadaPelaMatrixNotResView({codSinistro: dadosBody?.sinistroCobrancaMatrix});
    }

    static async putSinistroCobranca({dadosBody = Object(), token = Object(), cod = String()}) {
        if (dadosBody?.length == 0) return [];

        const oldCobranca = await this.verificarSeCobrancaExistePeloCodigoSinistro({codSinistro: dadosBody?.sinistroCobrancaMatrix});
        const newItem = new Object({
            sinistroCobrancaCod: oldCobranca?.sinistroCobrancaCod,
            sinistroCobrancaStatusApiCobranca: dadosBody?.sinistroCobrancaStatusApiCobranca,
            //sinistroCobrancaValorTotal: dadosBody?.sinistroCobrancaValorTotal,
            sinistroCobrancaStatusId: dadosBody?.newCodStatus,
        });

        const dadosValidados = await this.validatePut({dadosBody: newItem});

        //onda_sinistro_cobranca_data_pagamento = '${dadosValidados?.sinistroCobrancaDataPagamento}',
        const query = `
            UPDATE onda_sinistro_cobranca
            SET 
                onda_sinistro_cobranca_status = '${dadosValidados?.sinistroCobrancaStatusId}',
                onda_sinistro_cobranca_status_api_cobranca = '${dadosValidados?.sinistroCobrancaStatusApiCobranca}'
            WHERE onda_sinistro_cobranca_cod = '${dadosValidados?.sinistroCobrancaCod}' 
        `;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status cobrança!"});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar cobrança!"});
        }

        return await this.getOneCobrancaAgrupadaPelaMatrixNotResView({codSinistro: dadosBody?.sinistroCobrancaMatrix});
    }

    static async getOneCobrancaAgrupadaPelaMatrixNotResView({codSinistro}) {
        const schema = yup.object().shape({
            codSinistro: yup.string().required().matches(/^SN-/, "getOneCobrancaAgrupadaPelaMatrixNotResView O código deve ser o codSinistro ex: SN-4564564231-2024"),
        });

        const dadosBody = await yupSchemaValidate(schema, {codSinistro: codSinistro}, {abortEarly: false});

        const query = `
            SELECT 
                *
            FROM VW_SINISTRO_COBRANCA AS VW
            WHERE VW.sinistroCobrancaMatrix = '${dadosBody?.codSinistro}'
            GROUP BY VW.contrato
            LIMIT 1
        `;

        const [cobrancasAgrupadasPorSinistro] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças!"});
        });

        return cobrancasAgrupadasPorSinistro;
    }

    static async verificarSeCobrancaExistePeloCodigoSinistro({codSinistro}) {
        const cobrancasAgrupadasPorSinistro = await this.getOneCobrancaAgrupadaPelaMatrixNotResView({codSinistro: codSinistro});

        if (!cobrancasAgrupadasPorSinistro) {
            return setResponse.WARNING({message: "Cobrança do sinistro não encontrada!"});
        }

        return cobrancasAgrupadasPorSinistro;
    }

    static async buscaTotalCobracas(search) {
        const query = `
            SELECT COUNT(*) AS total
            FROM VW_SINISTRO_COBRANCA
            WHERE contrato LIKE ? OR 1=1
        `;

        // const totalCobrancas = await executarQuery
    }

    static async buscarTodasAsCobrancasAgrupadasMatrix() {
        // { limit, offset }
        // Query sem flag1106
        // Comentado dia 11/03/2025
        // const query = `
        //     SELECT
        //         *,
        //         DATE_FORMAT(sinistroCobrancaCriacao, '%d/%m/%Y %H:%i') AS sinistroCobrancaCriacaoFormat,
        //         MAX(sinistroCobrancaCriacao) AS sinistroCobrancaCriacao,
        //         DATE_FORMAT(MIN(CASE WHEN contaStatusPagamento = '1400' THEN contaVencimento ELSE NULL END), '%d/%m/%Y') AS ultContaVencimentoFormat,
        //         SUM(itemTotalAprovado) AS valorTotalAprovado
        //     FROM VW_SINISTRO_COBRANCA
        //     GROUP BY contrato
        //     ORDER BY  sinistroCobrancaCriacao ASC, contaVencimentoFormat DESC
        // `;

        // comentado dia 10/04/2025
        // por causa que o select comentado não busca todos os itens da tabela
        // SELECT
        //     *,
        //     DATE_FORMAT(sinistroCobrancaCriacao, '%d/%m/%Y %H:%i') AS sinistroCobrancaCriacaoFormat,
        //     MAX(sinistroCobrancaCriacao) AS sinistroCobrancaCriacao,
        //     DATE_FORMAT(MIN(CASE WHEN contaStatusPagamento = '1400' THEN contaVencimento ELSE NULL END), '%d/%m/%Y') AS ultContaVencimentoFormat,
        //     SUM(itemTotalAprovado) AS valorTotalAprovado,
        //     MAX(CASE WHEN sinistroCobrancaStatusId = 1106 THEN 1 ELSE 0 END) AS flag1106
        // FROM VW_SINISTRO_COBRANCA
        // GROUP BY contrato
        // ORDER BY sinistroCobrancaCriacao ASC, contaVencimentoFormat DESC;

        //         const query = `
        //             SELECT
        //                 V.*,
        //                 DATE_FORMAT(V.sinistroCobrancaCriacao, '%d/%m/%Y %H:%i') AS sinistroCobrancaCriacaoFormat,
        //                 Agg.sinistroCobrancaCriacaoMax,
        //                 Agg.ultContaVencimentoFormat,
        //                 Agg.valorTotalAprovado,
        //                 Agg.flag1106
        //             FROM
        //                 VW_SINISTRO_COBRANCA V
        //             INNER JOIN (
        //                 SELECT id
        //                 FROM VW_SINISTRO_COBRANCA
        //                 ORDER BY sinistroCobrancaCriacao ASC
        //                 LIMIT ${limit} OFFSET ${offset}
        //             ) AS Paged ON V.id = Paged.id
        //             LEFT JOIN (
        //                 SELECT
        //                     contrato,
        //                     MAX(sinistroCobrancaCriacao) AS sinistroCobrancaCriacaoMax,
        //                     DATE_FORMAT(
        //                         MIN(CASE
        //                                 WHEN contaStatusPagamento = '1400'
        //                                 THEN contaVencimento
        //                                 ELSE NULL
        //                             END),
        //                         '%d/%m/%Y'
        //                     ) AS ultContaVencimentoFormat,
        //                     SUM(itemTotalAprovado) AS valorTotalAprovado,
        //                     MAX(CASE
        //                             WHEN sinistroCobrancaStatusId = 1106
        //                             THEN 1
        //                             ELSE 0
        //                         END) AS flag1106
        //                 FROM
        //                     VW_SINISTRO_COBRANCA
        //                 GROUP BY contrato
        //             ) Agg ON V.contrato = Agg.contrato
        //             ORDER BY V.sinistroCobrancaCriacao ASC;
        //   `;
        const query = `
         SELECT 
             V.*,
             DATE_FORMAT(V.sinistroCobrancaCriacao, '%d/%m/%Y %H:%i') AS sinistroCobrancaCriacaoFormat,
             Agg.sinistroCobrancaCriacaoMax,
             Agg.ultContaVencimentoFormat,
             Agg.valorTotalAprovado,
             Agg.flag1106
         FROM 
             VW_SINISTRO_COBRANCA V
         LEFT JOIN (
             SELECT 
                 contrato,
                 MAX(sinistroCobrancaCriacao) AS sinistroCobrancaCriacaoMax,
                 DATE_FORMAT(
                     MIN(CASE 
                             WHEN contaStatusPagamento = '1400' 
                             THEN contaVencimento 
                             ELSE NULL 
                         END), 
                     '%d/%m/%Y'
                 ) AS ultContaVencimentoFormat,
                 SUM(itemTotalAprovado) AS valorTotalAprovado,
                 MAX(CASE 
                         WHEN sinistroCobrancaStatusId = 1106 
                         THEN 1 
                         ELSE 0 
                     END) AS flag1106
             FROM 
                 VW_SINISTRO_COBRANCA
             GROUP BY contrato
         ) Agg ON V.contrato = Agg.contrato
         ORDER BY V.sinistroCobrancaCriacao ASC;
        `;

        const cobrancasAgrupadasPorSinistro = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças agrupadas!"});
        });
        return cobrancasAgrupadasPorSinistro;
    }

    static async getOneCobrancaAgrupadaPeloContratoNotResView({codContrato}) {
        const query = `
            SELECT *
            FROM VW_SINISTRO_COBRANCA vw
            WHERE vw.contrato = '${codContrato}'
        `;
        const cobrancas = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças pelo contrato"});
        });

        return cobrancas;
    }

    static async verificaSePossivelResponsavelCobrancaEhSetorCobranca({dadosBody}) {
        const dadosValidados = await this.validatePutColab({dadosBody: dadosBody});

        const query = `
            SELECT * FROM
            onda_user  WHERE onda_user_id = ${dadosValidados?.id_colaborador};
        `;
        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar colaborador!"});
        });

        if (results[0].onda_user_departamento !== "Cobrança") {
            return setResponse.WARNING({message: "Somente o setor cobrança pode atribuir colaboradores."});
        }

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel buscar colaborador!"});
        }
    }

    static async atualizarColaboradorResposavel({dadosBody}) {
        const dadosValidados = await this.validatePutColab({dadosBody: dadosBody});

        const query = `
            UPDATE onda_sinistro_cobranca
            SET 
                onda_sinistro_cobranca_colaborador_id = ${dadosValidados?.id_colaborador}
            WHERE onda_sinistro_cobranca_cartafianca_id = ${dadosValidados?.id_contrato}
        `;
        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status cobrança!"});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar cobrança!"});
        }

        /*  const response = await buscarCobrancaPorIdContrato(dadosValidados?.id_contrato);
         */

        return;
    }

    static async verificarSeExistePeloIdContrato(idContrato) {
        const query = `
            SELECT 
                onda_sinistro_cobranca_cartafianca_id
            FROM onda_sinistro_cobranca
            WHERE onda_sinistro_cobranca_cartafianca_id = '${idContrato}'
            LIMIT 1
        `;

        const [cobranca] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao consultar conta pelo id do contrato!"});
        });

        if (!cobranca) {
            return setResponse.WARNING({message: "Cobrança não encontratada!"});
        }

        return cobranca;
    }

    static async criarCobrancaUnificada({token, cod, matrixUnificada}) {
        const query = `
            INSERT INTO onda_cobranca_unificada (
                onda_cobranca_unificada_matrix,
                onda_cobranca_unificada_matrix_referencia
            ) VALUES (
                '${matrixUnificada}',
                '${cod}'
            );
        `;
        const results = await executarQuery(query).catch(async (err) => {
            await onda_followup.postFollowup({token: token, cod: cod, event: "🤖 *Erro ao transferir cobrança para nova cobrança unificada!! 🛑"});
            return setResponse.DATABASE_ERROR({message: "Erro ao inserir nova cobrança unificada!"});
        });

        if (!results || results.affectedRows === 0) {
            await onda_followup.postFollowup({token: token, cod: cod, event: "🤖 *Não foi possível transferir cobrança para nova cobrança unificada!! 🛑"});
            return setResponse.WARNING({message: "Não foi possível inserir a nova cobrança unificada!"});
        }

        await onda_followup.postFollowup({token: token, cod: cod, event: "🤖 Sucesso ao transferir cobrança para nova cobrança unificada!! 🆗"});
        return await this.buscarCobranaUnificada({cod: matrixUnificada});
    }

    static async buscarCobranaUnificada({cod}) {
        const query = `
            SELECT 
                *
            FROM onda_cobranca_unificada
            WHERE onda_cobranca_unificada_matrix = ?
            LIMIT 1
        `;
        const results = await executarQuery(query, [cod]).catch(async () => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobrança unificada!"});
        });
        return results;
    }
};

export default onda_sinistro_cobranca;
