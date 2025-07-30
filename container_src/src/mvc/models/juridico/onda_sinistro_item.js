import yup from "yup";

//helpers
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
// ligação com o user da imobiliária
//models
import onda_followup from "../public/onda_followup.js";

const tableName = "onda_sinistro_item";

const onda_sinistro_item = class onda_sinistro_item {
    static async validate({dadosBody = Object()}) {
        const schema = yup.object().shape({
            sinistroItemNome: yup.string(),
            sinistroItemDescImob: yup.string(),
            sinistroItemValorTotal: yup.number().positive("O valor total deve ser positivo"),
            sinistroItemCategoriaId: yup.number().default(100),
            sinistroHelpersItemGrupoId: yup.number(),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async validatePut({dadosBody = Object()}) {
        const schema = yup.object().shape({
            sinistroItemCod: yup.string().required(),
            sinistroItemDataAprovacao: yup.date(),
            sinistroItemDataAtualizacao: yup.date(),
            sinistroItemDescOnda: yup.string(),
            sinistroItemStatusId: yup.number(),
            sinistroItemValor: yup.number(),
            sinistroItemValorAprovado: yup
                .number()
                .required("O campo valor é obrigatório!")
                .test("teste-numero", `O valor aprovado não pode ser maior que R$ ${dadosBody?.sinistroItemValor}!`, function (value) {
                    //if(Number(value) > Number(dadosBody?.sinistroItemValor)) return false
                    // PRECISA GRAR O CALCULO COM A MULTA E  JUROS NO ALUGUEL E COMDOMINIO!
                    return true;
                }),
            sinistroItemVencimentoBoleto: yup.string().nullable(),
        });

        return await yupSchemaValidate(schema, dadosBody, {abortEarly: false});
    }

    static async getOneNotResByMatrixView({codSinistro}) {
        const query = `
            SELECT
                *
            FROM VW_SINISTRO_ITEM 
            WHERE sinistroItemMatrix = '${codSinistro}'
        `;

        const itensSinistro = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar itens sinistro!"});
        });

        return itensSinistro;
    }

    static async quantidadeItensPendenteAnalise({codSinistro}) {
        const query = `
            SELECT
                COUNT(CASE WHEN sinistroItemStatusId = 1500 THEN 1 END) AS quantidadePendenteAnalise
            FROM VW_SINISTRO_ITEM 
            WHERE sinistroItemMatrix = '${codSinistro}'
        `;

        const [itensSinistro] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar itens sinistro!"});
        });

        return itensSinistro;
    }

    static async postSinistroItem({dadosBody = Object(), token = Object(), cod}) {
        if (dadosBody.length == 0) return [];
        for (const item of dadosBody) {
            const dadosValidados = await this.validate({dadosBody: item});

            const newSinistroItem = new Object({
                sinistroItemMatrix: cod,
                sinistroItemNome: dadosValidados?.sinistroItemNome,
                sinistroItemDescImob: dadosValidados?.sinistroItemDescImob,
                sinistroItemValorTotal: dadosValidados?.sinistroItemValorTotal,
                sinistroItemCategoriaId: dadosValidados?.sinistroItemCategoriaId,
                sinistroHelpersItemGrupoId: dadosValidados?.sinistroHelpersItemGrupoId,
            });
            const query = `
                INSERT INTO onda_sinistro_item (
                    onda_sinistro_item_cod, 
                    onda_sinistro_item_matrix, 
                    onda_sinistro_item_nome,
                    onda_sinistro_item_desc_imob,
                    onda_sinistro_item_valor_total,
                    onda_sinistro_item_categoria_id,
                    onda_sinistro_item_data_criacao,
                    onda_sinistro_helpers_item_grupo_id
                ) VALUES (
                    '${gerarCondigoSetores("SNIT")}',
                    '${newSinistroItem?.sinistroItemMatrix}',
                    '${newSinistroItem?.sinistroItemNome}',
                    '${newSinistroItem?.sinistroItemDescImob}',
                    '${newSinistroItem?.sinistroItemValorTotal}',
                    '${newSinistroItem?.sinistroItemCategoriaId}',
                    '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                    '${newSinistroItem?.sinistroHelpersItemGrupoId}'
                );
            `;

            const results = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar itens sinistro!"});
            });

            if (results?.affectedRows === 0) {
                return setResponse.WARNING({message: "Não foi possivel cadastrar o itens sinistro!"});
            }
        }

        return await this.getOneNotResByMatrixView({codSinistro: cod});
    }

    /**
     * Atualiza os dados de um item do sinistro existente.
     *
     * @param {Object} dadosBody - Objeto contendo os dados do sinistro a serem atualizados.
     * @param {Object} token - Objeto contendo os novos dados do sinistro.
     * @returns {Promise<Object>} - Uma promessa que resolve com o objeto do sinistro atualizado,
     * @throws {Error} - Lança um erro se houver algum problema na atualização do sinistro.
     */
    static async putSinistroItem({dadosBody = Object(), token = Object(), cod = String()}) {
        try {
            if (dadosBody.length == 0) {
                return await this.getOneNotResByMatrixView({codSinistro: cod});
            }
            for (const item of dadosBody) {
                const newItem = new Object({
                    sinistroItemCod: item?.sinistroItemCod,
                    sinistroItemStatusId: item?.sinistroItemStatusId,
                    sinistroItemDescOnda: item?.sinistroItemDescOnda,
                    sinistroItemDataAtualizacao: item?.sinistroItemDataAtualizacao,
                    sinistroItemValorAprovado: item?.sinistroItemValorAprovado,
                    sinistroItemDataAprovacao: item?.sinistroItemDataAprovacao,
                    sinistroItemValor: item?.sinistroItemValor,
                    sinistroItemVencimentoBoleto: item?.sinistroItemVencimentoBoleto,
                });

                const dadosValidados = await this.validatePut({dadosBody: newItem});

                const fields = {
                    sinistroItemStatusId: {column: "onda_sinistro_item_status_id", type: "number"},
                    sinistroItemDescOnda: {column: "onda_sinistro_item_desc_onda", type: "string"},
                    sinistroItemValorAprovado: {column: "onda_sinistro_item_valor_aprovado", type: "number"},
                    sinistroItemVencimentoBoleto: {column: "onda_sinistro_item_vencimento_boleto", type: "string"},
                };

                const setClauses = [
                    `onda_sinistro_item_data_atualizacao = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'`,
                    `onda_sinistro_item_data_aprovacao = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'`,
                ];

                for (const [key, {column, type}] of Object.entries(fields)) {
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
                    UPDATE onda_sinistro_item
                    SET ${setClause}
                    WHERE onda_sinistro_item_cod = '${dadosValidados.sinistroItemCod}'
                `;
                const results = await executarQuery(query).catch((err) => {
                    return setResponse.DATABASE_ERROR({
                        message: `Erro ao atualizar itens sinistro! `,
                    });
                });

                if (results?.affectedRows === 0) {
                    return setResponse.WARNING({message: "Não foi possivel atualizar o item sinistro!"});
                }
            }

            const itensSinistro = await this.getOneNotResByMatrixView({codSinistro: cod});

            return itensSinistro;
        } catch (error) {
            return setResponse.DATABASE_ERROR({
                message: `Erro ao atualizar itens sinistro!`,
            });
        }
    }

    static async buscarTotalValoresDosGruposNosItensNoSinistro({cartaFianca, codSinistro}) {
        try {
            const schema = yup.object().shape({
                codSinistro: yup.string().matches(/^SN-/, "buscarTotalValoresDosGruposNosItensNoSinistro O código deve ser o contrato ex: SN-4564564231-2024"),
                contrato: yup
                    .string()
                    .required("Contrato é obrigatório em buscarTotalValoresDosGruposNosItensNoSinistro")
                    .matches(/^OND-/, "buscarTotalValoresDosGruposNosItensNoSinistro O código deve ser o contrato ex: OND-4564564231-2024"),
            });

            const dadosBody = await yupSchemaValidate(schema, {contrato: cartaFianca?.contrato, codSinistro: codSinistro}, {abortEarly: false});

            const query = `
                SELECT 
    
                    SUM(CASE WHEN sinistroItemGrupo1e2 = 1 AND sinistroItemStatusId = 1500 THEN sinistroItemValorAprovado ELSE 0 END) AS pendenteGrupo1, 
                    SUM(CASE WHEN sinistroItemGrupo1e2 = 2 AND sinistroItemStatusId = 1500 THEN sinistroItemValorAprovado ELSE 0 END) AS pendenteGrupo2,
    
                    SUM(CASE WHEN sinistroItemGrupo1e2 = 1 AND sinistroItemStatusId = 1502 THEN sinistroItemValorAprovado ELSE 0 END) AS reprovadoGrupo1, 
                    SUM(CASE WHEN sinistroItemGrupo1e2 = 2 AND sinistroItemStatusId = 1502 THEN sinistroItemValorAprovado ELSE 0 END) AS reprovadoGrupo2,
    
                    SUM(CASE WHEN sinistroItemGrupo1e2 = 1 AND sinistroItemStatusId = 1501 THEN sinistroItemValorAprovado ELSE 0 END) AS aprovadoGrupo1,
                    SUM(CASE WHEN sinistroItemGrupo1e2 = 2 AND sinistroItemStatusId = 1501 THEN sinistroItemValorAprovado ELSE 0 END) AS aprovadoGrupo2,
                        
                    SUM(CASE WHEN sinistroItemStatusId = 1500 THEN sinistroItemValorAprovado ELSE 0 END) AS totalPendente,
                    SUM(CASE WHEN sinistroItemStatusId = 1501 THEN sinistroItemValorAprovado ELSE 0 END) AS totalAprovado,
                    SUM(CASE WHEN sinistroItemStatusId = 1502 THEN sinistroItemValorAprovado ELSE 0 END) AS totalReprovado
                        
                FROM  VW_SINISTRO_ITEM 
                WHERE sinistroItemContrato = '${dadosBody?.contrato}'
                ${filtrarValoresPeloCodSinistro()}
                GROUP BY sinistroItemContrato
            `;

            function filtrarValoresPeloCodSinistro() {
                if (codSinistro) return `AND sinistroItemMatrix = '${codSinistro}'`;
                return ``;
            }

            const [totalAbertoGruposSinistro] = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar itens sinistro para calcular totais!"});
            });

            const grupos = this.gerarValorGrupo1Gupo2({totalAbertoGruposSinistro, cartaFianca});

            return {
                grupos: grupos,
                cartaFianca: cartaFianca,
            };
        } catch (error) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar itens sinistro para calcular totais!"});
        }
    }

    static gerarValorGrupo1Gupo2({totalAbertoGruposSinistro, cartaFianca}) {
        const {valoraluguel, plano} = cartaFianca;

        const planos = String(plano).toLocaleLowerCase();

        const getMultiploGrupo1 = (plano) => {
            switch (plano.toLowerCase()) {
                case "basic":
                    return 17;
                case "standard":
                    return 25;
                case "premium":
                    return 34;
                case "master":
                    return 34;
                case "infinity":
                    return 39;
                default:
                    return 17;
            }
        };

        const getMultiploGrupo2 = (plano) => {
            switch (plano.toLowerCase()) {
                case "basic":
                    return 3;
                case "standard":
                    return 5;
                case "premium":
                    return 6;
                case "master":
                    return 6;
                case "infinity":
                    return 6;
                default:
                    return 3;
            }
        };

        const multiploGrupo1 = getMultiploGrupo1(planos);
        const multiploGrupo2 = getMultiploGrupo2(planos);

        const totalLimiteGrupo1 = valoraluguel * multiploGrupo1;
        const totalLimiteGrupo2 = valoraluguel * multiploGrupo2;

        const TotalDisponivelGrupo1 = Number(totalLimiteGrupo1) - Number(totalAbertoGruposSinistro?.aprovadoGrupo1 || 0);
        const TotalDisponivelGrupo2 = Number(totalLimiteGrupo2) - Number(totalAbertoGruposSinistro?.aprovadoGrupo2 || 0);

        const newObjeto = Object({
            limiteAbertura: totalLimiteGrupo1,
            pendenteGrupo1: Number(totalAbertoGruposSinistro?.pendenteGrupo1),
            pendenteGrupo2: Number(totalAbertoGruposSinistro?.pendenteGrupo2),
            reprovadoGrupo1: Number(totalAbertoGruposSinistro?.reprovadoGrupo1),
            reprovadoGrupo2: Number(totalAbertoGruposSinistro?.reprovadoGrupo2),
            aprovadoGrupo1: Number(totalAbertoGruposSinistro?.aprovadoGrupo1),
            aprovadoGrupo2: Number(totalAbertoGruposSinistro?.aprovadoGrupo2),
            totalPendente: Number(totalAbertoGruposSinistro?.totalPendente),
            totalAprovado: Number(totalAbertoGruposSinistro?.totalAprovado),
            totalReprovado: Number(totalAbertoGruposSinistro?.totalReprovado),
            totalDisponivelGrupo1: TotalDisponivelGrupo1,
            totalDisponivelGrupo2: TotalDisponivelGrupo2,
        });
        return newObjeto;
    }

    static async getAllItensByMatrixArray({sinistros = Array()}) {
        const query = `
            SELECT *
            FROM VW_SINISTRO_ITEM
            WHERE sinistroItemMatrix IN("${sinistros.join('","')}")
        `;

        const results = await executarQuery(query).catch((error) => {
            return setResponse.DATABASE_ERROR("Erro buscar itens do sinistro pela lista de códigos matrix!");
        });

        return results;
    }
};

export default onda_sinistro_item;
