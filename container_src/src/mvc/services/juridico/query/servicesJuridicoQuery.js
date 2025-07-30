//BIBLIOTECAS

//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import json from "../../../utils/formatar/json.js";
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
import onda_followup from "../../../models/public/onda_followup.js";
import onda_contas from "../../../models/financeiro/onda_contas.js";
//SERVICES
//UTILS
import executarQueryComRollback from "../../../utils/mysql/funcoesQuery/executarQueryComRollback.js";

const servicesJuridicoQuery = class servicesJuridicoQuery {
    static async buscarArrayStatusSinistro_query() {
        const query = `
            SELECT *  FROM onda_status
            WHERE onda_status_setor = 'sinistro'
        `;

        const statusSetorSinistro = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
        });

        if (statusSetorSinistro.length === 0) {
            return setResponse.WARNING({
                message: "Erro ao buscar status pelo setor!",
            });
        }
        const arrayStatus = await json.keyToArrayString(statusSetorSinistro, "onda_status_id");
        return arrayStatus;
    }

    static async tipoSinistroId_query() {
        const statusSetorSinistro = await executarQuery(`SELECT *  FROM onda_tiposinistro`).catch(() => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar tipo sinistro!",
            });
        });

        if (statusSetorSinistro.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar tipo sinistro!"});
        }

        const arrayStatus = await json.keyToArrayString(statusSetorSinistro, "onda_tiposinistro_id");

        return arrayStatus;
    }

    static async getCartaFianca_query(contrato) {
        const query = `
            SELECT *  
            FROM VW_CARTAFIANCA_GERAL
            WHERE contrato = '${contrato}'
        `;
        const [cartaFianca] = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar carta fiança!",
            });
        });

        if (!cartaFianca) {
            return setResponse.WARNING({message: "Carta fiança não encontrada!"});
        }

        return cartaFianca;
    }

    static async atualizarStatusComercialCf({cartaFianca, token}) {
        //316 = onda_status exoneração enviada
        await onda_cartafianca
            .metodo()
            .update({cartafiancaStatusComercial: 316}, {where: {cartafiancaId: cartaFianca.id}})
            .then(async () => {
                await onda_followup.postFollowup({
                    token: token,
                    cod: cartaFianca?.contrato,
                    event: "*Sucesso ao alterar status comercial ao gerar exoneração!",
                });
            })
            .catch(async () => {
                await onda_followup.postFollowup({
                    token: token,
                    cod: cartaFianca?.contrato,
                    event: "*Erro ao alterar status comercial ao gerar exoneração!",
                });
                return setResponse.WARNING({
                    message: "Erro ao alterar status comercial ao gerar exoneração!",
                });
            });
    }

    //USADO NA REGRA AO ACEITAR SINISTRO NO PORTAL
    static async atualizarStatusAceitoSinistroPortal({dadosBody, valoresAprovados, token}) {
        const newStatus = Number(valoresAprovados?.grupos?.totalAprovado) > 0 ? 606 : 605;

        let query = "";
        let queryCobranca = "";
        if (dadosBody?.sinistro?.aceitar === true) {
            query = `
            UPDATE onda_sinistro
            SET 
                onda_sinistro_dataceiteportal = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_sinistro = '${newStatus}',
                onda_sinistro_status_assinado = 1602
            WHERE onda_sinistro_codigo = '${dadosBody?.codSinistro}'
        `;

            queryCobranca = `
        UPDATE onda_sinistro_cobranca
        SET
            onda_sinistro_cobranca_status = 1105
        WHERE onda_sinistro_cobranca_matrix = '${dadosBody?.sinistroCodigo}';
    `;
        }

        if (dadosBody?.sinistro?.aceitar === false) {
            //envia para contestação
            query = `
            UPDATE onda_sinistro
            SET 
                onda_sinistro_datacontestacao = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_sinistro = '612', 
                onda_sinistro_descricao_contestacao = '${dadosBody?.sinistro?.descricao}' 

            WHERE onda_sinistro_codigo = '${dadosBody?.codSinistro}'
        `;
        }

        const results = await executarQuery(query)
            .then(() => {
                onda_followup.postFollowup({
                    token: token,
                    cod: dadosBody?.codSinistro,
                    event: dadosBody?.sinistro?.aceitar ? "*Sinistro assinado no portal!" : "*Sinistro contestado no portal",
                });
                onda_followup.postFollowup({
                    token: token,
                    cod: `TLI-${dadosBody?.codSinistro}`,
                    event: dadosBody?.sinistro?.aceitar ? "🤖 *Sinistro assinado pela imobiliária 🆗" : "🤖 *Sinistro contestado pela imobiliária ⚠️",
                });
            })
            .catch((err) => {
                onda_followup.postFollowup({
                    token: token,
                    cod: dadosBody?.codSinistro,
                    event: "Erro ao atualizar o status do sinistro!",
                });
                return setResponse.DATABASE_ERROR({
                    message: "Erro ao atualizar o status do sinistro!",
                });
            });

        await executarQuery(queryCobranca)
            .then(() => {
                onda_followup.postFollowup({
                    token: token,
                    cod: dadosBody?.codSinistro,
                    event: "🤖 *Sucesso ao cadastrar cobrança no status disponível! 🆗",
                });
            })
            .catch((err) => {
                onda_followup.postFollowup({
                    token: token,
                    cod: dadosBody?.codSinistro,
                    event: "Erro ao atualizar o status da cobrança!",
                });
                return setResponse.DATABASE_ERROR({
                    message: "Erro ao atualizar o status da cobrança!",
                });
            });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível encerrar o sinistro!",
            });
        }

        return;
    }

    static async atualizarStatusCanceladoSinistroWave({dadosBody, codStatusCancelado = "613"}) {
        const querySinistro = `
            UPDATE onda_sinistro
            SET
                onda_sinistro_dataencerramento = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_sinistro = ${codStatusCancelado},
                onda_sinistro_status_assinado = 1600
            WHERE onda_sinistro_codigo = '${dadosBody?.sinistroCodigo}';
        `;

        const queryCobranca = `
            UPDATE onda_sinistro_cobranca
            SET
                onda_sinistro_cobranca_status = '1102'
            WHERE onda_sinistro_cobranca_matrix = '${dadosBody?.sinistroCodigo}';
        `;

        const queryContas = `
            UPDATE onda_contas
            SET onda_conta_status = '1402'
            WHERE onda_conta_sinistro_id = ${dadosBody?.id}
            AND onda_conta_categoria = 206
        `;

        const querys = [querySinistro, queryCobranca, queryContas];

        return await executarQueryComRollback.executarQueryRollback({querys: querys}).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cancelar sinistro!",
            });
        });

        // // Executa a primeira query
        // const resultSinistro = await executarQuery(querySinistro).catch((err) => {
        //     return setResponse.DATABASE_ERROR({message: "Erro ao cancelar sinistro!"});
        // });

        // if (resultSinistro?.affectedRows === 0) {
        //     return setResponse.WARNING({message: "Não foi possível cancelar o sinistro!"});
        // }

        // // Executa a segunda query
        // const resultCobranca = await executarQuery(queryCobranca).catch((err) => {
        //     return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status da cobrança!"});
        // });

        // if (resultCobranca?.affectedRows === 0) {
        //     return setResponse.WARNING({message: "Não foi possível atualizar o status da cobrança!"});
        // }

        // return; //setResponse.SUCCESS({ message: "Sinistrofaz o m zado com sucesso!" });
    }

    static async atualizarStatusCanceladoSinistroPelaCobranca({dadosBody, codStatusCancelado}) {
        const querySinistro = `
            UPDATE onda_sinistro
            SET
                onda_sinistro_dataencerramento = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_sinistro = ${codStatusCancelado},
                onda_sinistro_status_assinado = 1600
            WHERE onda_sinistro_codigo = '${dadosBody?.sinistroCodigo}';
        `;

        const queryContas = `
            UPDATE onda_contas
            SET onda_conta_status = '1402'
            WHERE onda_conta_sinistro_id = ${dadosBody?.id}
            AND onda_conta_categoria = 206
        `;

        const querys = [querySinistro, queryContas];
        return await executarQueryComRollback.executarQueryRollback({querys: querys}).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cancelar sinistro!",
            });
        });
    }

    static async finalizarContestacaoSinistroWave({dadosBody}) {
        const querySinistro = `
            UPDATE onda_sinistro
            SET
                onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_sinistro = '611'
            WHERE onda_sinistro_codigo = '${dadosBody?.codSinistro}';
        `;

        const resultSinistro = await executarQuery(querySinistro).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cancelar sinistro!",
            });
        });

        if (resultSinistro?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível finalizar a contestação do sinistro!",
            });
        }
        return; //setResponse.SUCCESS({ message: "Sinistro atualziado com sucesso!" });
    }

    //reinicia o processo do sinistro após aprovada a contestação.
    static async aprovarContestacaoSinistroWave({dadosBody}) {
        const querySinistro = `
        UPDATE onda_sinistro
        SET
            onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
            onda_sinistro_status_sinistro = '601',
            onda_sinistro_status_assinado = '1600',
            onda_sinistro_dataenviadoaceiteportal = ''
        WHERE onda_sinistro_codigo = '${dadosBody?.codSinistro}';
    `;

        const queryItemSinistro = `
        UPDATE onda_sinistro_item
        SET
            onda_sinistro_item_data_atualizacao = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
            onda_sinistro_item_valor_aprovado = '',
            onda_sinistro_item_status_id = '1500',
            onda_sinistro_item_data_aprovacao = ''
        WHERE onda_sinistro_item_matrix = '${dadosBody?.codSinistro}';
    `;

        // Executa a primeira query
        const resultSinistro = await executarQuery(querySinistro)
            .then(async () => {
                await onda_followup.postFollowup({
                    cod: `${dadosBody?.codSinistro}`,
                    event: "🤖 *Sucesso ao aprovar contestação do sinistro na tabela item sinistro! 🆗",
                });
                await onda_followup.postFollowup({
                    cod: `TLI-${dadosBody?.codSinistro}`,
                    event: "🤖 Contestação do sinistro aprovada 🆗",
                });
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({
                    cod: `${dadosBody?.codSinistro}`,
                    event: "🤖 *Erro ao aprovar contestação do sinistro na tabela sinistro! 🛑",
                });
                return setResponse.DATABASE_ERROR({
                    message: "Erro ao aprovar a contestação!",
                });
            });

        // Verifica se a primeira query afetou linhas
        if (resultSinistro?.affectedRows === 0) {
            await onda_followup.postFollowup({
                cod: `${dadosBody?.codSinistro}`,
                event: "🤖 *Não foi possível aprovar a contestação do sinistro! ⚠️",
            });
            return setResponse.WARNING({
                message: "Não foi possível aprovar a contestação do sinistro!",
            });
        }

        // Executa a segunda query para atualizar o item
        await executarQuery(queryItemSinistro)
            .then(async () => {
                await onda_followup.postFollowup({
                    cod: `${dadosBody?.codSinistro}`,
                    event: "🤖 *Sucesso ao aprovar contestação do sinistro na tabela item sinistro! 🆗",
                });
                await onda_followup.postFollowup({
                    cod: `TLI-${dadosBody?.codSinistro}`,
                    event: "Contestação do sinistro aprovada",
                });
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({
                    cod: `${dadosBody?.codSinistro}`,
                    event: "🤖 *Erro ao aprovar contestação do sinistro na tabela item sinistro! 🛑",
                });
                return setResponse.DATABASE_ERROR({
                    message: "Erro ao atualizar status do item do sinistro",
                });
            });

        // Retorno de sucesso
        return; //setResponse.SUCCESS({ message: "Sinistro atualizado com sucesso!" });
    }

    static async atualizarStatusCanceladoSinistroPortal({dadosBody}) {
        const query = `
            UPDATE onda_sinistro
            SET
                onda_sinistro_dataencerramento = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_sinistro = '608'
            WHERE onda_sinistro_codigo = '${dadosBody?.codSinistro}'
        `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cancelar sinistro!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível cancelar o sinistro!",
            });
        }

        return;
    }

    static async atualizarStatusParaAnaliseSinistro7Dias({sinistro}) {
        const query = `
            UPDATE onda_sinistro
            SET 
                onda_sinistro_databertura = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_sinistro = '602'
            WHERE onda_sinistro_codigo = '${sinistro?.sinistroCodigo}'
        `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao iniciar analise sinistro!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível iniciar analise do sinistro !",
            });
        }

        return;
    }

    static async atualizarStatusSinistroParaEnviadoParaAssinatura({dadosBody}) {
        const query = `
            UPDATE onda_sinistro
            SET 
                onda_sinistro_lastupdate = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_dataenviadoaceiteportal = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                onda_sinistro_status_assinado = '1601',
                onda_sinistro_status_sinistro = '611',
                onda_sinistro_descricao_onda = '${dadosBody?.sinistro?.descOnda}'
            WHERE onda_sinistro_codigo = '${dadosBody?.sinistro?.codSinistro}'
        `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar no encerramento do sinistro!",
            });
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({
                message: "Não foi possível atualizar o encerramento do sinistro !",
            });
        }

        return;
    }

    static async cadastrarPagamentoSinistroAposImobiliariaAceitarNoPortal({token, sinistro, valoresSinistro}) {
        const newConta = new Object({
            contaGestor: 60,
            contaCategoria: 206, // Sinistros encerrados com ônus
            contaCentroCusto: 106, // Sinistro
            contaRecebedor: 200, // imobiliaria
            contaVencimento: sinistro?.sinistroDataAceitePortalIntervalo30Dias,
            contaValor: valoresSinistro?.grupos?.totalAprovado, // valor calculados pegando os itens aceitos no sinistro
            contaAcrescimos: 0,
            contaParcela: 1,
            contaStatus: 1400,
            contaFormaPagamento: 172,
            contaObservacoes: "--",
            contaRecorrenteBoleano: 0,
        });

        const chavesEstrangeiras = {
            onda_conta_contrato_id: sinistro?.sinistroIdContrato,
            onda_conta_sinistro_id: sinistro?.id,
            onda_conta_sinistro_cod: sinistro?.sinistroCodigo,
        };
        await onda_contas.postConta({
            conta: newConta,
            token: token,
            matrix: sinistro?.sinistroContrato,
            chavesEstrangeiras: chavesEstrangeiras,
        });
    }

    static async cadastrarCobrancaApiAtos({cartaFianca, gruposSinistro, cobranca, itensSinistro, sinistro}) {
        const itensSinistroAtos = new Array();

        itensSinistro.map((item) => {
            itensSinistroAtos.push(item?.sinistroItemDescImob);
        });

        const newCobranca = {
            data: {
                type_check: 1,
                devedores: [
                    {
                        razao_social: cartaFianca?.locatario,
                        fantasia: cartaFianca?.locatario,
                        documento: cartaFianca?.cpf,
                        codigo_externo: "",
                        emails: [
                            {
                                email: cartaFianca?.locatarioEmail,
                                principal: true,
                            },
                        ],
                        //   "enderecos": [
                        //     {
                        //       "logradouro": "Av. Brasil",
                        //       "numero": "123",
                        //       "complemento": "Apto 100",
                        //       "bairro": "Centro",
                        //       "cep": "00000-000",
                        //       "cidade": "São Paulo",
                        //       "uf": "SP",
                        //       "principal": true
                        //     }
                        //   ],
                        telefones: [
                            {
                                nome_contato: cartaFianca?.locatario,
                                numero: cartaFianca?.celular,
                                tipo: "MÓVEL",
                            },
                        ],
                        campos_adicionais: [["ABERTURA DE SINISTRO"]],
                        titulos: [
                            {
                                atualizar: false,
                                numero: cobranca?.sinistroCobrancaCod,
                                parcela: "001",
                                especie: sinistro?.descricao,
                                vencimento: cobranca?.dataDeVencimentoDaCobrancaAoCadastrarSinistro,
                                valor: gruposSinistro?.grupos?.totalPendente,
                                data_doc: cobranca?.sinistroCobrancaCriacao,
                                obs: "",
                                campos_adicionais: [itensSinistroAtos],
                            },
                        ],
                    },
                ],
            },
        };

        return newCobranca;
    }

    static async atualizarCobrancaApiAtos({cartaFianca, gruposSinistro, cobranca, itensSinistro, sinistro}) {
        const itensSinistroAtos = new Array();

        itensSinistro.map((item) => {
            itensSinistroAtos.push(item?.sinistroItemDescImob);
        });

        const newCobranca = {
            data: {
                type_check: 1,
                devedores: [
                    {
                        razao_social: cartaFianca?.locatario,
                        fantasia: cartaFianca?.locatario,
                        documento: cartaFianca?.cpf,
                        codigo_externo: "",
                        emails: [
                            {
                                email: cartaFianca?.locatarioEmail,
                                principal: true,
                            },
                        ],
                        //   "enderecos": [
                        //     {
                        //       "logradouro": "Av. Brasil",
                        //       "numero": "123",
                        //       "complemento": "Apto 100",
                        //       "bairro": "Centro",
                        //       "cep": "00000-000",
                        //       "cidade": "São Paulo",
                        //       "uf": "SP",
                        //       "principal": true
                        //     }
                        //   ],
                        telefones: [
                            {
                                nome_contato: cartaFianca?.locatario,
                                numero: cartaFianca?.celular,
                                tipo: "MÓVEL",
                            },
                        ],
                        campos_adicionais: [["ABERTURA DE SINISTRO"]],
                        titulos: [
                            {
                                atualizar: true,
                                numero: cobranca?.sinistroCobrancaCod,
                                parcela: "001",
                                especie: sinistro?.sinistroDescricao,
                                vencimento: cobranca?.dataDeVencimentoDaCobrancaAoCadastrarSinistro,
                                valor: gruposSinistro?.grupos?.totalAprovado,
                                data_doc: cobranca?.sinistroCobrancaCriacao,
                                obs: "",
                                campos_adicionais: [itensSinistroAtos],
                            },
                        ],
                    },
                ],
            },
        };

        return newCobranca;
    }

    static async buscaStatusDaContaAPagarPeloSinistro({sinistro}) {
        const sql = `
            SELECT onda_conta_status
            FROM onda_contas
            WHERE onda_conta_sinistro_id = ${sinistro?.id}
        `;

        const [result] = await executarQuery(sql).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar status de pagamento",
            });
        });

        return result;
    }

    static async buscaStatusDaCobrancaPeloSinistro({sinistro}) {
        const sql = `
            SELECT onda_sinistro_cobranca_status 
            FROM onda_sinistro_cobranca
            WHERE onda_sinistro_cobranca_sinistro_id = ${sinistro?.id}
        `;

        const [result] = await executarQuery(sql).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar status da cobrança",
            });
        });

        return result;
    }

    static async BuscarSinistrosPeloFiltroDinamico(params) {
        // 601	Imobiliária enviou sinistro	sinistro	step 1
        // 602	Em avaliação no periodo de 15 dias	sinistro	step 3
        // 605	encerrado sem ônus	sinistro	step 6
        // 606	encerrado com ônus	sinistro	step 6
        // 611	Aguardando aceite no portal	sinistro	step 4
        // 612	Contestado no portal	sinistro	step 5

        //valores padrão caso nenhum filtro seja aplicado
        const statusFiltro = params.sinistroStatusSinistro ? [params.sinistroStatusSinistro] : [601, 602, 611, 612];

        const sql = `
        SELECT * FROM VW_SINISTRO_GERAL
        WHERE sinistroStatusSinistro IN (${statusFiltro.join(",")})
        `;

        try {
            const sinistros = await executarQuery(sql);

            if (sinistros.length === 0) {
                return setResponse.WARNING({message: "Nenhum sinistro encontrado com o filtro aplicado!"});
            }
            return sinistros;
        } catch (error) {
            console.error("Erro na query:", error);
            return setResponse.DATABASE_ERROR({
                message: "Falha ao buscar sinistros no banco de dados.",
            });
        }
    }

    static async updateStatusContaAcordoextrajudicial({status, acordo, cod}) {
        const query = `
           UPDATE onda_contas
            SET 
                onda_conta_status = ?,
                onda_conta_matrixacordo = ?
            WHERE onda_conta_cod = ?
        `;
        await executarQuery(query, [status, acordo, cod]).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar status da cobrança",
            });
        });
    }

    static async retornarContasAcopladasAoAcordoExtrajudicial({status, codAcordo}) {
        const query = `
        UPDATE onda_contas 
        SET 
            onda_conta_status = ?
        WHERE onda_conta_matrixacordo = ?;
        `;
        await executarQuery(query, [status, codAcordo]).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao atualizar status da cobrança",
            });
        });
    }

    static async buscarContasAcopladasaoAcordo({codAcordo}) {
        const query = `
        SELECT * FROM onda_contas
        WHERE onda_conta_matrixacordo = ?;
    `;

        const contasAcordos = await executarQuery(query, [codAcordo]).catch((err) => {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar contas vinculadas ao acordo",
            });
        });
        return contasAcordos;
    }
};

export default servicesJuridicoQuery;
