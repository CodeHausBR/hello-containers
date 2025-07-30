//BIBLIOTECAS
//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import json from "../../../utils/formatar/json.js";
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
//SERVICES
//MODELS
import onda_pagarme_cliente from "../../../models/pagarme/onda_pagarme_cliente.js";
import onda_pagarme_cobranca from "../../../models/pagarme/onda_pagarme_cobranca.js";
import onda_pay from "../../../models/analise/onda_pay.js";
const servicesFinanceiroQuery = class servicesFinanceiroQuery {
    static async atualizarStatusFinanceiro_query(dadosValidados) {
        const query = `                    
            UPDATE onda_cartafianca AS CF
                INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                SET 
                ${datapgtocartafianca()}
                CF.onda_cartafianca_status_financeiro = '${dadosValidados.status}'
            WHERE CO.onda_contratos_contrato = '${dadosValidados.cod}'
        `;

        function datapgtocartafianca() {
            if (["506"].includes(dadosValidados.status)) {
                return `
                    CF.onda_cartafianca_datapgtocartafianca = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
                    CF.onda_cartafianca_statuspagamento = '506',
                    CF.onda_cartafianca_status_comercial = '999',
                `;
            } else {
                return "";
            }
        }

        const results = await executarQuery(query).catch((errr) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status financeiro!"});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar o status!"});
        }

        if (results?.changedRows === 0) {
            const results = await onda_cartafianca.getOneNotResView(dadosValidados?.cod);
            return setResponse.WARNING({message: "O Status já foi atualizado!", results: results});
        }
        return;
    }

    static async buscarArrayStatusFinanceiro_query() {
        const query = `
            SELECT *  FROM onda_status
            WHERE onda_status_setor = 'financeiro'
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

    static async buscarEnderecosDeCobrancaNoPagarme({arrayPagamentos = Array()}) {
        const arrayFormatado = async () => {
            let newArrayPagamentos = [];
            let contratosProcessados = new Set();
            const enderecoFixo = {
                country: "br",
                state: "sc",
                city: "navegantes",
                neighborhood: "centro",
                zip_code: "88370438",
                number: "706",
                street: "av joao sacavem",
            };

            for (const pagamento of arrayPagamentos) {
                if (!pagamento?.address && !contratosProcessados.has(pagamento?.payContrato)) {
                    const id_pagamento = await onda_pagarme_cobranca.getPeloCod({code: pagamento?.payContrato});

                    const cliente = await onda_pagarme_cliente.getOne(id_pagamento?.[0]?.customer?.id);

                    let arrayPagamentosFiltrado = arrayPagamentos.filter((pag) => pag.payContrato === pagamento.payContrato);

                    arrayPagamentosFiltrado.forEach((item) => {
                        newArrayPagamentos.push({...item, address: cliente?.address?.zip_code ? cliente?.address : enderecoFixo});
                    });

                    contratosProcessados.add(pagamento.payContrato);
                }
            }

            contratosProcessados.clear();

            return newArrayPagamentos;
        };

        return await arrayFormatado();
    }

    static async verificaSeERemessaDeCriacaoEAtualizaPagamentosSelecionados({config, bancoID, dataBody, token}) {
        if (config !== 1) return;

        const contasParaAtualizar = new Array();

        for (const pagamento of dataBody?.devedor) {
            contasParaAtualizar.push(
                new Object({
                    onda_pay_id: pagamento?.id,
                    onda_pay_plataforma: bancoID,
                    onda_pay_status: pagamento?.payStatus || 511,
                    onda_pay_cnab_nosso_numero: pagamento?.payCnabNossoNumero,
                    onda_pay_cnab_seu_numero: pagamento?.payCnabSeuNumero,
                    onda_pay_cnab_status_gerado: 1,
                })
            );
        }
        if (!contasParaAtualizar) return;

        await onda_pay.patchContasAReceber({contasAReceber: contasParaAtualizar, token: token});

        return;
    }

    static async montarObjetoParaAtualizarPagamentosComLoteDeRetorno(listaDeNossoNumerosDoArquivoDeRetorno = Array()) {
        this.lista = listaDeNossoNumerosDoArquivoDeRetorno;
        this.listaFormatadaParaPath = Array();
        listaDeNossoNumerosDoArquivoDeRetorno.map((item) => {
            this.listaFormatadaParaPath.push({
                onda_pay_id: item?.id,
                onda_pay_status: item?.retorno?.ocorrenciaDesc?.nossoStatus,
                onda_pay_cnab_status_retorno_id: item?.retorno?.ocorrencia,
                onda_pay_cnab_status_retorno: item?.retorno?.ocorrenciaDesc?.message,
            });
        });

        await onda_pay.patchContasAReceber({contasAReceber: this.listaFormatadaParaPath});

        return;
    }

    static async getOneNotResView({id}) {
        const sql = `
            SELECT * FROM VW_PAY WHERE id = ${id}
        `;

        const [result] = await executarQuery(sql).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Não foi possível localizar conta!"});
        });

        return result;
    }
    static async getOneNotResTable({id}) {
        const sql = `
            SELECT * FROM onda_pay WHERE onda_pay_id = ${id}
        `;

        const [result] = await executarQuery(sql).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Não foi possível localizar conta!"});
        });

        return result;
    }

    static async buscarParcelasDaCartafianca() {
        const sql = `
            SELECT *
            FROM onda_pay
            WHERE onda_pay_helpers_tipo_conta_id = 241`;

        const result = await executarQuery(sql).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Não foi possível localizar conta!"});
        });

        return result;
    }
    static async buscarParcelasDaCartafiancaPorContrato({cod}) {
        const sql = `
            SELECT *
            FROM onda_pay
            WHERE onda_pay_helpers_tipo_conta_id = 241 AND
            onda_pay_contrato = ?`;

        const result = await executarQuery(sql, [cod]).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Não foi possível localizar conta!"});
        });

        return result;
    }
};

export default servicesFinanceiroQuery;
