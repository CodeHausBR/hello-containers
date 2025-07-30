import { DataTypes } from "sequelize";
import db from "../../../db/connMysql.js";
import yup from "yup";

//helpers
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
import onda_followup from "../public/onda_followup.js";
// ligação com o user da imobiliária
//models
import onda_sinistro_item from "./onda_sinistro_item.js";
import onda_cartafianca from "../analise/onda_cartafianca.js";
import onda_tiposinistro from "./onda_tiposinistro.js";

const tableName = "onda_sinistro";

const onda_sinistro = class onda_sinistro {
    static metodo() {
        return db.define(
            tableName,
            {
                onda_sinistro_id: {
                    type: DataTypes.INTEGER(11),
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                onda_sinistro_datacriacao: {
                    type: DataTypes.TIME,
                    allowNull: false,
                },
                onda_sinistro_codigo: {
                    type: DataTypes.STRING(45),
                    allowNull: false,
                },

                onda_sinistro_prazoextrajudicial: {
                    type: DataTypes.TIME,
                },
                onda_sinistro_dataencerramento: {
                    type: DataTypes.TIME,
                },
                onda_sinistro_tiposinistro: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                onda_sinistro_descricao: {
                    type: DataTypes.STRING(500),
                    allowNull: false,
                },
                onda_sinistro_status: {
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                },
                onda_sinistro_contrato: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                },
                onda_sinistro_imob_id: {
                    type: DataTypes.INTEGER(11),
                    primaryKey: true,
                    allowNull: false,
                },
                onda_sinistro_followup: {
                    type: DataTypes.INTEGER(11),
                },
                onda_sinistro_databertura: {
                    type: DataTypes.TIME,
                },
                onda_sinistro_lastupdate: {
                    type: DataTypes.TIME,
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async validatePost({ sinistro = Object() }) {
        const tiposSinistro = await onda_tiposinistro.arrayIdTipoSinistro();

        const schema = yup.object().shape({
            tipoSinistroId: yup
                .number()
                .required("Tipo de sinistro é obrigatório!")
                .test("teste-tiposinistroid", `Tipo de sisnitro de ser: ${tiposSinistro}!`, (value) => {
                    return tiposSinistro.includes(value);
                }),
            descricao: yup.string().max(500, "Descrição não pode ter mais que 500 caracteres!"),
            contrato: yup.string().required().matches(/^OND-/, "O onda_sinistro código deve ser o contrato ex: OND-4564564231-2024"),
        });

        return await yupSchemaValidate(schema, sinistro, { abortEarly: false });
    }

    static async validatePut({ sinistro = Object() }) {
        const schema = yup.object().shape({
            codSinistro: yup.string().matches(/^SN-/, "O código deve ser codSinistro, ex: SN-4564564231-2024").required(),
            sinistroDataEncerramento: yup.string().nullable(),
            sinistroTipoSinistro: yup.string().nullable(),
            sinistroDataAceitePortal: yup.string().nullable(),
            sinistroStatusAssinado: yup.string().nullable(),
            sinistroStatusSinistro: yup.string().nullable(),
            sinistroStatusCobranca: yup.string().nullable(),
            sinistroPendencias: yup.number(),
        });

        return await yupSchemaValidate(schema, sinistro, { abortEarly: false });
    }

    static validateCod(cod = String()) {
        if (!cod) {
            return setResponse.WARNING({
                message: "O código da conta é obrigatório!",
            });
        }
    }

    static async getAllNotResView() {
        const query = `
            SELECT 
                *
            FROM VW_SINISTRO_GERAL AS VW
        `;

        const sinistros = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar sinistros!",
            });
        });

        return sinistros;
    }

    static async buscarSinistroPeloContrato({ codContrato }) {
        const schema = yup.object().shape({
            contrato: yup.string().required().matches(/^OND-/, "buscarSinistroPeloContrato O código deve ser o contrato ex: OND-4564564231-2024"),
        });

        const dadosBody = await yupSchemaValidate(schema, { contrato: codContrato }, { abortEarly: false });

        const query = `
            SELECT 
                *,
                DATE_FORMAT(VW.sinistroDataCriacao, '%d/%m/%Y %H:%i') AS sinistroDataCriacao, 
                DATE_FORMAT(VW.sinistroDataAbertura, '%d/%m/%Y %H:%i') AS sinistroDataAbertura,  
                DATE_FORMAT(VW.sinistroLastUpdate, '%d/%m/%Y %H:%i') AS sinistroLastUpdate  
            FROM VW_SINISTRO_GERAL AS VW
            WHERE VW.sinistroContrato = '${dadosBody?.contrato}'
        `;

        const sinistros = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar sinistros pelo contrato!",
            });
        });

        return sinistros;
    }

    static async getOneNotResByIdView({ id }) {
        const query = `
            SELECT 
                *,
                'new' AS evento
            FROM VW_SINISTRO_GERAL AS VW
            WHERE VW.id = ${id}
        `;

        const [sinistro] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar sinistro!",
            });
        });

        return sinistro;
    }

    static async getOneNotResByCodView({ cod, configImobiliaria = null }) {
        const schema = yup.object().shape({
            codSinistro: yup
                .string()
                .required("cod é obrigatório em getOneNotResByCodView")
                .matches(/^SN-/, "O código em getOneNotResByCodView deve ser o contrato ex: SN-4564564231-2024"),
        });

        const dadosBody = await yupSchemaValidate(schema, { codSinistro: cod }, { abortEarly: false });

        const query = `
            SELECT
                *,
                'update' AS evento,
                DATE_FORMAT(DATE_ADD(VW.sinistroDataAceitePortal, INTERVAL ${configImobiliaria ? configImobiliaria?.prazo_pagamento_sinistros?.padrao : 30
            } DAY), '%Y-%m-%d') AS sinistroDataAceitePortalIntervalo30Dias
            FROM VW_SINISTRO_GERAL AS VW
            WHERE VW.sinistroCodigo = '${dadosBody?.codSinistro}'
        `;

        const [sinistro] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar sinistro!",
            });
        });

        return sinistro || {};
    }

    static async getOneAgrupandoPeloContrato({ codContrato }) {
        const schema = yup.object().shape({
            contrato: yup
                .string()
                .required("Contrato é obrigatório em getOneAgrupandoPeloContrato")
                .matches(/^OND-/, "O getOneAgrupandoPeloContrato código deve ser o contrato ex: OND-4564564231-2024"),
        });

        const dadosBody = await yupSchemaValidate(schema, { contrato: codContrato }, { abortEarly: false });

        const query = `
            SELECT
                * 
            FROM VW_SINISTRO_GERAL AS VW
            WHERE VW.sinistroContrato = '${dadosBody?.contrato}'
            LIMIT 1
        `;

        const [sinistro] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar sinistro!",
            });
        });

        return sinistro || {};
    }

    static async postSinistro({ dadosBody = Object(), cartaFianca = Object(), token = Object() }) {
        const dadosValidados = await this.validatePost({ sinistro: dadosBody });
        const query = `
            INSERT INTO onda_sinistro (
                onda_sinistro_codigo, 
                onda_sinistro_tiposinistro, 
                onda_sinistro_descricao, 
                onda_sinistro_contrato,
                onda_sinistro_id_contrato,
                onda_sinistro_datacriacao
            ) VALUES (
                '${gerarCondigoSetores("SN")}',
                '${dadosValidados?.tipoSinistroId}',
                '${dadosValidados?.descricao}',
                '${dadosValidados?.contrato}',
                '${cartaFianca?.id}',
                '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'

            );
        `;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cadastrar sinistro!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possivel cadastrar o sinistro !",
            });
        }

        const sinistro = await this.getOneNotResByIdView({ id: results?.insertId });

        await onda_followup.postFollowup({
            token: token,
            cod: sinistro?.sinistroCodigo,
            event: "*Sinistro cadastrado com sucesso!",
        });
        await onda_followup.postFollowup({
            token: token,
            cod: `TLI-${sinistro?.sinistroCodigo}`,
            event: "🤖 *Sinistro cadastrado 🆗",
        });

        await onda_followup.postFollowup({
            token: token,
            cod: dadosValidados?.contrato,
            event: `*Sinistro cadastrado ${sinistro?.sinistroCodigo} no contrato ${dadosValidados?.contrato}`,
        });
        await onda_followup.postFollowup({
            token: token,
            cod: `TLI-${dadosValidados?.contrato}`,
            event: `🤖 *Sinistro ${sinistro?.sinistroCodigo} cadastrado 🆗`,
        });

        return sinistro;
    }

    static async atualizarStatusSinistro(dadosValidados) {
        const query = `                    
            UPDATE onda_sinistro AS SI
                SET 
                    SI.onda_sinistro_status_sinistro = ${dadosValidados.status}
            WHERE SI.onda_sinistro_codigo = '${dadosValidados.cod}'
        ;`;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar status sinistro!",
            });
        });

        const newSinistroStatus = await this.getOneNotResByCodView({
            cod: dadosValidados?.cod,
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possivel atualizar o status sinistro!",
                results: newSinistroStatus,
            });
        }

        if (results?.changedRows === 0) {
            return setResponse.WARNING({
                message: "O status sinistro já foi atualizado!",
                results: newSinistroStatus,
            });
        }

        if (results?.changedRows === 0) {
            return setResponse.WARNING({
                message: "O Status do sinistro já foi atualizado!",
                results: newSinistroStatus,
            });
        }
        return newSinistroStatus;
    }

    static async atualizarResponsavelSinistro({ sinistroCod, userID }) {
        const query = `                    
            UPDATE onda_sinistro AS SI
                SET 
                    SI.onda_sinistro_colaborador_id = ${userID}
            WHERE SI.onda_sinistro_codigo = '${sinistroCod}'
        ;`;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar responsavel do Sinistro!",
            });
        });

        const newSinistroStatus = await this.getOneNotResByCodView({
            cod: sinistroCod,
        });

        return newSinistroStatus;
    }

    static async buscarCobrancaPorIdContrato(id) {
        const query = `
            SELECT 
                *,
                'new' AS evento
            FROM VW_SINISTRO_COBRANCA AS VW
            WHERE VW.contratoId = ${id}
        `;

        const cobranca = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar a cobranca!",
            });
        });

        return cobranca;
    }

    static async atualizarStatusCobranca(dadosValidados) {
        const query = `                    
            UPDATE onda_sinistro AS SI
                SET 
                    SI.onda_sinistro_status_cobranca = ${dadosValidados.status}
            WHERE SI.onda_sinistro_codigo = '${dadosValidados.cod}'
        ;`;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar status cobrança!",
            });
        });
        const newSinistroStatus = await this.getOneNotResByCodView({
            cod: dadosValidados?.cod,
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possivel atualizar o status cobrança!",
                results: newSinistroStatus,
            });
        }

        if (results?.changedRows === 0) {
            return setResponse.WARNING({
                message: "O status cobrança já foi atualizado!",
                results: newSinistroStatus,
            });
        }

        if (results?.changedRows === 0) {
            return setResponse.WARNING({
                message: "O Status do cobrança já foi atualizado!",
                results: newSinistroStatus,
            });
        }
        return newSinistroStatus;
    }
    /**
     * Atualiza os dados de um sinistro existente.
     *
     * @param {Object} dadosBody - Objeto contendo os dados do sinistro a serem atualizados.
     * @param {Object} token - Objeto contendo os novos dados do sinistro.
     * @param {String} cod - SN-12312312312-2024
     * @returns {Promise<Object>} - Uma promessa que resolve com o objeto do sinistro atualizado,
     * @throws {Error} - Lança um erro se houver algum problema na atualização do sinistro.
     */
    static async putSinistro({ dadosBody = Object(), token = Object() }) {
        try {
            const dadosValidados = await this.validatePut({ sinistro: dadosBody });

            const fields = {
                sinistroTipoSinistro: { column: "onda_sinistro_tiposinistro", type: "string" },
                sinistroDataAceitePortal: { column: "onda_sinistro_dataceiteportal", type: "string" },
                sinistroDataEncerramento: { column: "onda_sinistro_dataencerramento", type: "string" },
                sinistroStatusAssinado: { column: "onda_sinistro_status_assinado", type: "string" },
                sinistroStatusSinistro: { column: "onda_sinistro_status_sinistro", type: "string" },
                sinistroStatusCobranca: { column: "onda_sinistro_status_cobranca", type: "string" },
                sinistroPendencias: { column: "onda_sinistro_pendencias", type: "number" },
            };

            const setClauses = [`onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'`];

            for (const [key, { column, type }] of Object.entries(fields)) {
                if (dadosValidados[key] !== undefined) {
                    if (type === "string") {
                        setClauses.push(`${column} = ${dadosValidados[key] === null ? "NULL" : `'${dadosValidados[key]}'`}`);
                    } else if (type === "number") {
                        setClauses.push(`${column} = ${dadosValidados[key]}`);
                    }
                }
            }

            const setClause = setClauses.join(", ");

            const query = `
            UPDATE onda_sinistro
            SET ${setClause}
            WHERE onda_sinistro_codigo = '${dadosValidados.codSinistro}'
        `;

            const results = await executarQuery(query).catch((err) => {
                return setResponse.DATABASE_ERROR({
                    message: `Erro ao atualizar sinistro!  `,
                });
            });

            if (results?.affectedRows === 0) {
                return setResponse.WARNING({
                    message: "Não foi possível atualizar o sinistro !",
                });
            }

            const sinistroAtualizado = await this.getOneNotResByCodView({ cod: dadosValidados?.codSinistro });

            await onda_followup.postFollowup({
                token: token,
                cod: sinistroAtualizado?.sinistroCodigo,
                event: "*Sinistro atualizado com sucesso!",
            });
            // await onda_followup.postFollowup({
            //     token: token,
            //     cod: `TLI-${sinistroAtualizado?.sinistroCodigo}`,
            //     event: "Sinistro atualizado",
            // });

            return sinistroAtualizado;
        } catch (error) {
            return setResponse.DATABASE_ERROR({
                message: `Erro ao atualizar sinistro!  `,
            });
        }
    }

    static async getAllNotResViewNoFormat() {
        const query = `
            SELECT * FROM VW_SINISTRO_GERAL 
        `;

        const sinistros = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar sinistros!",
            });
        });

        return sinistros;
    }

    static async verificarSeSinistroJaFoiCadastradoNoFinanceiro({ sinistro }) {
        const query1 = `
            SELECT 
                *
            FROM onda_contas 
            WHERE onda_conta_sinistro_cod = '${sinistro?.sinistroCodigo}'
        `;

        const verificarSeTemPagamento = await executarQuery(query1).catch(() => {
            return setResponse.DATABASE_ERROR({ message: "Erro ao verificar se tem pagameto cadastrado!" });
        });
        if (verificarSeTemPagamento.length > 0) {
            return setResponse.WARNING({ message: "Pagamento deste sinistro já foi cadastrado!" });
        }
    }
};

export default onda_sinistro;
