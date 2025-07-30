//BIBLIOTECAS

//HELPERS
import json from "../../../utils/formatar/json.js";
import setResponse from "../../../../helpers/response/setResponse.js";
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
import generateQuery from "../../../../helpers/mysql/generate-query.js";
import api_worker_financeiro from "../../../../helpers/api/worker-financeiro/api_worker_financeiro.js";
//UTILS
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";

//MODELS
import onda_followup from "../../../models/public/onda_followup.js";
import onda_locatario from "../../../models/analise/onda_locatario.js";
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
import onda_cartafianca_encerramento from "../../../models/analise/onda_cartafianca_encerramento.js";

const servicesAnaliseQuery = class servicesAnaliseQuery {
    static async cadastrarCartaFiancaParaAnalise_query(infoAnalise, valoresCartaFianca, locatario, token, paramentroAnalise, bearerToken) {
        const verifyExists = await onda_locatario.metodo().findOne({where: {locatarioCnpjcpf: locatario?.locatarioCnpjcpf.trim()}});

        if (!verifyExists) {
            await onda_locatario.createNotRes(locatario, token);
            const newCartafianca = await onda_cartafianca.createNotRes(infoAnalise, valoresCartaFianca, locatario, token, paramentroAnalise);
            const cartafianca = await bucarCartaFianca_query(newCartafianca?.cartafiancaId);
            await api_worker_financeiro.criar_cliente_worker_financeiro({cartafianca: cartafianca, token: token, bearerToken: bearerToken});
            await onda_followup.postFollowup({cod: cartafianca?.contrato, event: `🤖 *Sucesso ao cadastrar locatário 🆗`});
            await onda_followup.postFollowup({cod: `TLI-${cartafianca?.contrato}`, event: `🤖 *Locatário cadastrado 🆗`});
            await onda_followup.postFollowup({cod: cartafianca?.contrato, event: `🤖 *Sucesso ao cadastrar carta fiança 🆗`});
            await onda_followup.postFollowup({cod: `TLI-${cartafianca?.contrato}`, event: `🤖 *Carta fiança cadastrada 🆗`});
            return cartafianca;
        } else {
            await onda_locatario.patchNotRes(locatario, token, verifyExists?.locatarioCodigo);
            const newCartafianca = await onda_cartafianca.createNotRes(infoAnalise, valoresCartaFianca, locatario, token, paramentroAnalise);
            const cartafianca = await bucarCartaFianca_query(newCartafianca?.cartafiancaId);
            await api_worker_financeiro.atualiza_cliente_worker_financeiro({cartafianca: cartafianca, token: token, bearerToken: bearerToken});
            await onda_followup.postFollowup({cod: cartafianca?.contrato, event: `🤖 *Sucesso ao atualizar locatário 🆗`});
            await onda_followup.postFollowup({cod: `TLI-${cartafianca?.contrato}`, event: `🤖 *Locatário atualizado ℹ️`});
            await onda_followup.postFollowup({cod: cartafianca?.contrato, event: `🤖 *Sucesso ao cadastrar carta fiança 🆗`});
            await onda_followup.postFollowup({cod: `TLI-${cartafianca?.contrato}`, event: `🤖 *Carta fiança cadastrada 🆗`});
            return cartafianca;
        }

        async function bucarCartaFianca_query(id) {
            const query = `
                SELECT 
                    *,    
                    DATE_FORMAT(criacao, '%d/%m/%Y %H:%i') AS criacao
                FROM VW_CARTAFIANCA_GERAL 
                WHERE id = '${id}'
                LIMIT 1
            `;
            const [cartaFiancaAntiga] = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
            });

            if (!cartaFiancaAntiga) {
                return setResponse.WARNING({message: "Carta fiança não encontrada para envir email!"});
            }

            return cartaFiancaAntiga;
        }
    }

    static async verificarImovelDaImobiliaria(dadosValidados) {
        const query = `
            SELECT 
                IM.onda_imovel_imobiliaria,
                IM.onda_imovel_status
                FROM onda_imovel AS IM
                WHERE onda_imovel_id = ${dadosValidados.onda_cartafianca_imovel_id}
        `;

        const [imovel] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imovel para verificar no cadastro da analise!"});
        });

        if (!imovel) {
            return setResponse.WARNING({message: "Imóvel não encontrado, tente novamente!"});
        }

        if (imovel.onda_imovel_imobiliaria !== dadosValidados.onda_imob_id) {
            return setResponse.FORBIDDEN({message: `O imóvel de id: ${dadosValidados.onda_cartafianca_imovel_id}, não pertence a está imobiliária!`});
        }

        if (imovel.onda_imovel_status === 91) {
            return setResponse.WARNING({message: "O imóvel não está disponível para alugar!"});
        }
        return;
    }

    static async atualizarStatusAnalise_query(dadosValidados) {
        const query = `                    
            UPDATE onda_cartafianca AS CF
                INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                SET 
                    ${dataReprovacao()}
                    ${dataAprovacao()}
                    ${dataRenovacao()}
                    CF.onda_cartafianca_status_analise = ${dadosValidados.status}
            WHERE CO.onda_contratos_contrato = '${dadosValidados.cod}'
        ;`;

        function dataReprovacao() {
            if (["109", "110"].includes(dadosValidados.status)) {
                return `
                    CF.onda_cartafianca_datareprovacao = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                    CF.onda_cartafianca_status_comercial = '998',
                `;
            } else {
                return "";
            }
        }

        function dataAprovacao() {
            if (["111"].includes(dadosValidados.status)) {
                return `
                    CF.onda_cartafianca_dataaprovacao = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                    CF.onda_cartafianca_status_comercial = '319',
                `;
            } else {
                return "";
            }
        }

        function dataRenovacao() {
            if (["114"].includes(dadosValidados.status)) {
                return `
                    CF.onda_cartafianca_datarenovacao = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                    CF.onda_cartafianca_status_comercial = '314',
                `;
            } else {
                return "";
            }
        }

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status análise!"});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar o status!"});
        }

        if (results?.changedRows === 0) {
            const results = await onda_cartafianca.getOneNotResView(dadosValidados.cod);
            return setResponse.WARNING({message: "O Status já foi atualizado!", results: results});
        }
        return;
    }

    static async buscarTaxaPeloId_query(taxaId) {
        const query = `SELECT * FROM onda_config_taxas WHERE onda_config_id = ${taxaId}`;

        const [taxa] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao consultar taxas!"});
        });

        if (!taxa) {
            return setResponse.WARNING({message: "Taxa não encontrada!"});
        }

        return taxa;
    }

    static async buscarArrayStatusAnalise_query() {
        const query = `
            SELECT *  FROM onda_status
            WHERE onda_status_setor = 'analise'
        `;

        const statusSetorAnalise = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
        });

        if (statusSetorAnalise.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar status pelo setor!"});
        }
        const arrayStatus = await json.keyToArrayString(statusSetorAnalise, "onda_status_id");
        return arrayStatus;
    }

    static async atualizarDiasRestantes_query() {
        await executarQuery(`
            UPDATE onda_contratos 
                SET onda_contratos_dias = DATEDIFF(onda_contratos_vencimento, CURDATE())
           
            `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar dias restantes!"});
        });
    }

    static async updateCartaFianca_query(dadosQuery, valoresCartaFianca, verifyCartaFiancaExists) {
        //Este update tem que ser feito com o sequelize e retirado as keys que são nulas s strings vazias
        // O objato tem que ser construido lá dentro do validate e fazera  retirada das keys no mesmo
        // fazzer a desconstrução do dadosQuery aqui dentro pois lá no create ele precisa dos dados com as keys do validate

        const query = {
            cartafiancaTaxaIptu: dadosQuery?.cartafiancaTaxaIptu || verifyCartaFiancaExists?.iptu,
            cartafiancaTaxaImovel: dadosQuery?.cartafiancaTaxaImovel || verifyCartaFiancaExists?.taxasImovel,
            cartafiancaTaxaAgua: dadosQuery?.cartafiancaTaxaAgua || verifyCartaFiancaExists?.agua,
            cartafiancaTaxaCondominio: dadosQuery?.cartafiancaTaxaCondominio || verifyCartaFiancaExists?.condominio,
            cartafiancaTaxaLixo: dadosQuery?.cartafiancaTaxaLixo || verifyCartaFiancaExists?.lixo,
            cartafiancaTaxaEnergia: dadosQuery?.cartafiancaTaxaEnergia || verifyCartaFiancaExists?.energia,
            cartafiancaTaxaSeguroIncendio: dadosQuery?.cartafiancaTaxaSeguroIncendio || verifyCartaFiancaExists?.seguroIncendio,
            cartafiancaTaxaGas: dadosQuery?.cartafiancaTaxaGas || verifyCartaFiancaExists?.gas,
            //cahves adicionada
            cartafiancaImovelId: dadosQuery?.cartafiancaImovelId,
            cartafiancaValorAVista: valoresCartaFianca?.cartafiancaValorAVista,
            cartafiancaValorParcela: valoresCartaFianca?.cartafiancaValorParcela,
            cartafiancaValorAPrazo: valoresCartaFianca?.cartafiancaValorAPrazo,
            cartafiancaValorDesconto: valoresCartaFianca?.cartafiancaValorDesconto,
            //Obrigatórios para acalcular a CF
            cartafiancaCobertura: dadosQuery.cartafiancaCobertura,
            porcentagemDesconto: dadosQuery?.porcentagemDesconto,
            //cartafiancaValorAdesao: valoresCartaFianca?.cartafiancaValorAdesao,
            cartafiancaValorAluguel: dadosQuery?.cartafiancaValorAluguel,
            cartafiancaVistoria: dadosQuery.vistoria,
            cartafiancaPintura: dadosQuery.pintura,
            cartafiancaLimpeza: dadosQuery.limpeza,

            // onda_cartafianca_locatario: dadosQuery.locatarioCnpjCpf, não pode att pq va perder a key extrangeira
            cartafiancaColaboradorId: dadosQuery.cartafiancaColaboradorId,
            cartafiancaParceiro: dadosQuery.cartafiancaParceiro,
            cartafiancaExecutivo: dadosQuery.cartafiancaExecutivo,
            cartafiancaConsultor: dadosQuery.cartafiancaConsultor,
            cartafiancaImobiliaria: defineImobiliaria(),

            cartafiancaParcela: defineParcela(),
            cartafiancaTipoPagamento: dadosQuery?.cartafiancaTipoPagamento,
            cartafiancaPrevisaoPagamento: (dadosQuery?.cartafiancaPrevisaoPagamento && getDataHorarioAtual.YYYY_MM_DD_00_00_00()) || null,
            cartafiancaDataPgtoAdesao: setDataPgmt(),
            cartafiancaStatusAdesao: setAdesao(),
            dataVencimentoBoletos: dadosQuery?.dataVencimentoBoletos,
        };

        function defineParcela() {
            if (dadosQuery?.cartafiancaTipoPagamento == 7) return 1;
            return dadosQuery?.cartafiancaParcela;
        }

        function defineImobiliaria() {
            if (dadosQuery?.cartafiancaImobiliaria == verifyCartaFiancaExists?.imobiliariaCod) {
                return dadosQuery?.cartafiancaImobiliaria;
            } else if (verifyCartaFiancaExists?.cfFonte === "Wave") {
                return dadosQuery?.cartafiancaImobiliaria;
            }

            if (verifyCartaFiancaExists?.cfFonte !== "Wave" && dadosQuery?.cartafiancaImobiliaria !== undefined) {
                return setResponse.WARNING({message: "Só pode atualizar a imobiliária se análise foi enviada pelo Wave!"});
            }
            return null;
        }

        function setAdesao() {
            if (verifyCartaFiancaExists?.statusAdesao == 504 && dadosQuery?.cartafiancaStatusAdesao == 506) {
                return 506;
            }
            if (verifyCartaFiancaExists?.statusAdesao == 506 && dadosQuery?.cartafiancaStatusAdesao == 504) {
                return 504;
            }
        }

        function setDataPgmt() {
            if (dadosQuery?.cartafiancaStatusAdesao == 506) {
                return getDataHorarioAtual.YYYY_MM_DD_00_00_00();
            }
            return null;
        }

        if (verifyCartaFiancaExists?.statusAdesao === 506) {
            delete query?.cartafiancaDataPgtoAdesao;
        }

        const dadosfiltrados = generateQuery.retirarkeysNull(query);
        const [results] = await onda_cartafianca
            .metodo()
            .update(dadosfiltrados, {where: {onda_cartafianca_id: verifyCartaFiancaExists?.id}})
            .catch((error) => {
                console.log(error);
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar carta fiança!"});
            });

        return results;
    }

    static async buscarAnexo1_query(contrato) {
        const query = `
            SELECT *  
            FROM VW_DOCS
            WHERE docsMatrix = '${contrato}'
            AND docsTypefileId = 19
        `;

        const query2 = `
            SELECT *  
            FROM VW_DOCS
            WHERE docsMatrix = '${contrato}'
            AND docsTypefileId = 23
        `;

        const query3 = `
            SELECT *  
            FROM VW_DOCS
            WHERE docsMatrix = '${contrato}'
            AND docsTypefileId = 1000
        `;

        const [simulacao, anexo1, exoneracao] = await Promise.all([
            executarQuery(query2).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
            }),
            executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
            }),
            executarQuery(query3).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
            }),
        ]);

        return [anexo1, simulacao, exoneracao];
    }

    static async tiposPagamento_query() {
        const tiposPagamentos = await executarQuery(`SELECT * FROM onda_tipopagamento`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar tipos de pagamentos!"});
        });

        if (tiposPagamentos.length === 0) {
            return setResponse.WARNING({message: "Tipos de pagamentos não encontrados!"});
        }

        return tiposPagamentos;
    }

    static async motivoReprovacao_query(consulta, newCartafianca, token) {
        const query = `
            INSERT INTO onda_reasons (
                onda_reasons_contrato, 
                onda_reasons_user, 
                onda_reasons_descricao, 
                onda_reasons_score, 
                onda_reasons_divida, 
                onda_reasons_juridico, 
                onda_reasons_renda, 
                onda_reasons_motivo, 
                onda_reasons_data
            ) VALUES (
                '${newCartafianca?.contrato}',
                '${token?.onda_user_id}',
                '${consulta?.historico?.descricao}',
                '${consulta?.onda_reasons_score}',
                '${consulta?.onda_reasons_divida}',
                '${consulta?.historico?.juridico}',
                '${consulta?.renda}',
                '${consulta?.historico?.juridico}',
                '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'
            );
        `;

        const results = await executarQuery(query).catch((error) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar motivo reprovação!"});
        });

        if (results?.affectedRows == 0) {
            return setResponse.WARNING({message: "Erro ao cadastrar motivo!"});
        }
        return;
    }

    static async atualizarStatusAnaliseSeRenovacao({infoAnalise, cfAtualizada, token}) {
        if (infoAnalise?.tipoAnalise == "renovacao") {
            const query = `                    
                UPDATE onda_cartafianca AS CF
                    INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                    SET 
                        CF.onda_cartafianca_status_analise = '114', -- aprovado para renovação
                        CF.onda_cartafianca_status_comercial = '314' -- liberado para renovação
                WHERE CO.onda_contratos_contrato = '${cfAtualizada?.contrato}'
            `;

            await executarQuery(query).catch(async (err) => {
                await onda_followup.postFollowup({token: token, cod: cfAtualizada.contrato, event: "Erro ao gerar renovação automática*"});
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar renovação status análise!"});
            });

            await onda_followup.postFollowup({token: token, cod: cfAtualizada.contrato, event: "Sucesso ao gerar renovação automática*"});
            await onda_followup.postFollowup({token: token, cod: `TLI-${cfAtualizada.contrato}`, event: "🤖 *Renovação automática gerada 🆗"});

            return await onda_cartafianca.getOneNotResView(cfAtualizada.contrato);
        } else {
            return cfAtualizada;
        }
    }

    static async atualizarStatusContratoRenovacaoSolicitada({infoAnalise, newCF, cod, token}) {
        if (infoAnalise?.tipoAnalise == "renovacao") {
            const queryUpdateOriginalCF = `                    
                UPDATE onda_cartafianca AS CF
                    INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                    SET 
                        CF.onda_cartafianca_renovacao_solicitada = 1,
                        CF.onda_cartafianca_contrato_posterior = '${newCF?.contrato}'
                WHERE CO.onda_contratos_contrato = '${cod}'
            `;

            const queryUpdateNewCF = `                    
                UPDATE onda_cartafianca AS CF
                    INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                    SET 
                        CF.onda_cartafianca_renovacao = 1,
                        CF.onda_cartafianca_contrato_anterior = '${cod}'
                WHERE CO.onda_contratos_contrato = '${newCF?.contrato}'
            `;

            await executarQuery(queryUpdateOriginalCF).catch(async (err) => {
                await onda_followup.postFollowup({token: token, cod: newCF.contrato, event: "Erro ao gerar renovação automática*"});
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar renovação status análise!"});
            });

            await executarQuery(queryUpdateNewCF).catch(async (err) => {
                await onda_followup.postFollowup({token: token, cod: newCF.contrato, event: "Erro ao gerar renovação automática*"});
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar renovação status análise!"});
            });
        }
    }

    static async buscarTaxaPeloId_query(taxaId) {
        const query = `SELECT * FROM onda_config_taxas WHERE onda_config_id = ${taxaId}`;

        const [taxa] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao consultar taxas!"});
        });

        if (!taxa) {
            return setResponse.WARNING({message: "Taxa não encontrada!"});
        }

        return taxa;
    }

    static async atualizarStatusInadimplencia(cods, status) {
        const placeholders = cods.map(() => "?").join(",");
        const query = `
            UPDATE onda_cartafianca SET
                onda_cartafianca_status_inadimplente = ?
            WHERE onda_cartafianca_contrato IN (${placeholders}) AND
            onda_cartafianca_status_inadimplente <> ?
        `;

        await executarQuery(query, [status, ...cods, status]).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status análise!"});
        });

        // if (results?.affectedRows === 0) {
        //     console.log(cod, results);
        //     return setResponse.WARNING({message: "Não foi possivel atualizar o status!"});
        // }

        // if (results?.changedRows === 0) {
        //     const results = await onda_cartafianca.getOneNotResView(dadosValidados.cod);
        //     return setResponse.WARNING({message: "O Status já foi atualizado!", results: results});
        // }
        return;
    }

    static async atualizarStatusVencimento(cods) {
        const placeholders = cods.map(() => "?").join(",");
        const query = `
            UPDATE onda_cartafianca SET
                onda_cartafianca_status_comercial = ?
            WHERE onda_cartafianca_contrato in (${placeholders})
        `;

        await executarQuery(query, [335, ...cods]).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status contrato para encerrado!"});
        });

        return;
    }

    static async buscarContratoPelaMatrix({cod}) {
        const query = `
                SELECT 
                    *
                FROM onda_cartafianca
                WHERE onda_cartafianca_contrato = ?
                LIMIT 1
            `;
        const result = await executarQuery(query, [cod]).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        });

        return result[0];
    }
    static async buscarContratoViewPelaMatrix({cod}) {
        const query = `
                SELECT 
                    *
                FROM VW_CARTAFIANCA_GERAL
                WHERE contrato = ?
                LIMIT 1
            `;
        const result = await executarQuery(query, [cod]).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        });

        return result[0];
    }

    static async atualizarStatusEncerramentoContratual({data, refund, cod}) {
        const status = data?.distrato ? (refund ? 333 : 334) : refund ? 332 : 331;
        const query = `
            UPDATE onda_cartafianca SET
                onda_cartafianca_status_comercial = ?
            WHERE onda_cartafianca_contrato = ?
        `;

        const results = await executarQuery(query, [status, cod]).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status análise!"});
        });
        return results;
    }

    static async gerarRegistroEncerramentoContrato({data, codLocatario, codContrato, codImobiliaria, total}) {
        const today = new Date(Date.now());
        const bodyData = {
            locatario: codLocatario,
            contrato: codContrato,
            imobiliaria: codImobiliaria,
            dataEntradaImovel: data?.dataEntrada || null,
            dataEntregaChaves: data?.dataCancelamentoFianca || null,
            dataCancelamentoFianca: today,
            tipoEncerramento: data.distrato ? 701 : 702,
            valorTotal: total,
            chaveTransferencia: data.chaveTransferencia,
            motivo: data.motivoDistrato,
        };
        const response = await onda_cartafianca_encerramento.createNotRes({data: bodyData});
        return response.dataValues;
    }
};

export default servicesAnaliseQuery;
