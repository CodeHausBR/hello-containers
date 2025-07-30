//BIBLIOTECAS
import yup from "yup";
import BigNumber from "bignumber.js";
//HELPERS
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import onda_helpers from "../../models/public/onda_helpers.js";
import onda_user from "../users/onda_user.js";
import onda_status from "../public/onda_status.js";
import onda_cartafianca from "../analise/onda_cartafianca.js";
//SERVICES
//MONGOOSE
import VW_CONTAS from "../../models/mongoose/VW_CONTAS.js";
import onda_imob from "../users/onda_imob.js";
import servicesDocumentsQuery from "../../services/documents/querys/servicesQueryDocuments.js";

const onda_contas = class onda_contas {
    static async validate({conta = Object(), token = Object()}) {
        if (Object.entries(token).length === 0) {
            return setResponse.WARNING({message: "Token não enviado!"});
        }

        const [o_helper, o_user, o_status] = await Promise.all([
            onda_helpers.getAllIdSeparadosPorArrayStringSetor(),
            onda_user.getAllIdSeparadosPorArrayCargo(),
            onda_status.getAllIdSeparadosPorArraySetor(),
        ]);

        const schema = yup.object().shape({
            contaGestor: yup
                .number()
                .required("contaGestor é obrigatório!")
                .test("", `contaGestor deve ser um ID: ${o_user?.gestor}!`, (value) => {
                    return o_user?.gestor.includes(value);
                }),
            contaCategoria: yup
                .number()
                .required("contaCategoria é obrigatório!")
                .test("", `contaCategoria deve ser um ID: ${o_helper?.categoriaContasPagar}!`, (value) => {
                    return o_helper?.categoriaContasPagar.includes(value);
                }),
            contaCentroCusto: yup
                .number()
                .required("contaCentroCusto é obrigatório!")
                .test("", `contaCentroCusto deve ser um ID: ${o_helper?.centroCusto}!`, (value) => {
                    return o_helper?.centroCusto.includes(value);
                }),
            contaRecebedor: yup
                .number()
                .required("contaRecebedor é obrigatório!")
                .test("", `contaRecebedor deve ser um ID: ${o_helper?.recebedorContasPagar}!`, (value) => {
                    return o_helper?.recebedorContasPagar.includes(value);
                }),
            contaVencimento: yup.date().required("contaVencimento é obrigatório!"),
            contaValor: yup.number().required("contaValor é obrigatório!"),
            contaAcrescimos: yup.number().required("contaAcrescimos é obrigatório!"),
            contaParcela: yup
                .number()
                .required("contaParcela é obrigatório!")
                .test("teste-qtd-parcela", `contaParcela deve ser um ID: ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}!`, (value) => {
                    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(value);
                })
                .test("teste-recorrente", "Quando for recorrente deve ter somente 1 parcela!", (value) => {
                    if (conta?.contaRecorrenteBoleano == 1 && value != 1) {
                        return false;
                    }
                    return true;
                }),
            contaStatus: yup
                .number()
                .required("contaStatus é obrigatório!")
                .test("", `contaStatus deve ser um ID: ${o_status?.financeiroContasPagar}!`, (value) => {
                    return o_status?.financeiroContasPagar.includes(value);
                }),
            contaFormaPagamento: yup
                .number()
                .required("contaFormaPagamento é obrigatório!")
                .test("", `contaFormaPagamento deve ser um ID: ${o_helper?.formasPagamento}!`, (value) => {
                    return o_helper?.formasPagamento.includes(value);
                }),
            contaObservacoes: yup.string(),
            contaRecorrenteBoleano: yup
                .number()
                .required("Campo contaRecorrenteBoleano é obrigatório")
                .test("", `contaRecorrenteBoleano deve ser 0 ou 1`, (value) => {
                    return [0, 1].includes(value);
                }),
            contaContaRecebedor: yup.number().optional(),
        });

        return await yupSchemaValidate(schema, conta, {abortEarly: false});
    }

    static async validateAnoMes({mes = Number(), ano = Number()}) {
        const objMes = Object({
            mes: mes,
            ano: ano,
        });

        const schema = yup.object().shape({
            mes: yup
                .number()
                .required("mes é obrigatório!")
                .test("", `mes deve ser: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ou 12!`, (value) => {
                    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(value);
                }),
            ano: yup
                .number()
                .required("ano é obrigatório!")
                .test("", `ano deve estar entre 2020 e 3001 é obrigatório!!!`, (value) => {
                    return ano >= 2020 && ano <= 3001;
                }),
        });

        return await yupSchemaValidate(schema, objMes, {abortEarly: false});
    }

    static async getAllNotRes({data}) {
        const {dataInicial, dataFinal, tipoPagamento, contaStatus} = data;

        const montarConsulta = () => {
            let query = `
                SELECT 
                    *                                      
                FROM VW_CONTAS
                WHERE 1=1
            `;

            if (dataInicial && dataFinal) {
                query += `AND contaVencimento BETWEEN '${dataInicial}' AND '${dataFinal}'`;
            }

            if (tipoPagamento) {
                query += ` AND contaCategoria = ${tipoPagamento}`;
            }

            if (contaStatus) {
                query += ` AND contaStatus = ${contaStatus}`;
            }

            return query;
        };

        const contas = await executarQuery(montarConsulta()).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contas!"});
        });

        return contas;
    }

    static async getOneNotRes({cod = String()}) {
        if (!cod.includes("CONT")) {
            return setResponse.WARNING({message: "O código da conta é obrigatório!"});
        }

        const [contaBancaria] = await executarQuery(`
            SELECT * 
                FROM VW_CONTAS 
            WHERE contaCod = '${cod}';
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar conta!"});
        });

        return contaBancaria;
    }

    static async getAllByMatrixNotRes({mes = Number(), ano = Number(), matrix = String()}) {
        const results = await this.validateAnoMes({mes, ano});

        const contaBancaria = await executarQuery(`
            SELECT 
                *,
                CASE WHEN contaStatus != 1401 AND contaVencimento <= CURDATE() THEN 1 ELSE 0 END AS contaVenceuSemPagar

                FROM VW_CONTAS
            WHERE contaRecebedorMatrix = '${matrix}'
            AND MONTH(contaVencimento) = ${results?.mes}
            AND YEAR(contaVencimento) = ${results?.ano}
            ORDER BY contaDataCriacao DESC
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar array contas!"});
        });

        return contaBancaria;
    }

    static async getAllFiltroDinamico({data}) {
        const {contaMatrix, contaCategoria} = data;

        let query = `
            SELECT 
                *,
                CASE WHEN contaStatus != 1401 AND contaVencimento <= CURDATE() THEN 1 ELSE 0 END AS contaVenceuSemPagar
                FROM VW_CONTAS
            WHERE 1=1
        `;

        if (contaMatrix) {
            query += `AND contaMatrix = "${contaMatrix}"`;
        }
        if (contaCategoria) {
            query += ` AND contaCategoria = "${contaCategoria}"`;
        }

        query += ` ORDER BY contaDataCriacao DESC`;

        const contaBancaria = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar array contas!"});
        });

        return contaBancaria;
    }

    static async getAllContasJuntasByAnoMesNotRes({data}) {
        const {dataInicial, dataFinal, tipoPagamento, contaStatus} = data;

        const montarConsulta = () => {
            let query = `
                SELECT 
                    *,
                    SUM(CASE WHEN contaStatus = 1401 THEN contaValorFinal ELSE 0 END) AS totalPagoAteHoje,
                    SUM(CASE WHEN contaStatus != 1402 THEN contaValorFinal ELSE 0 END) AS totalAPagar,
                    SUM(CASE WHEN contaStatus = 1401 THEN 1 ELSE 0 END) AS totalContasPagasMes,
                    SUM(1) AS totalContasMes,
                    MIN(CASE WHEN contaStatus != 1401 THEN contaVencimento ELSE contaVencimento END) AS vencimentoMaisProximo,

                    CASE WHEN contaStatus != 1401 
                    AND  MIN(CASE WHEN contaStatus != 1401 THEN contaVencimento ELSE CURDATE() END) <= CURDATE() THEN 1
                    ELSE 0 END AS contaVenceuSemPagar

                FROM VW_CONTAS
                WHERE 1=1
            `;

            if (dataInicial && dataFinal) {
                query += `AND contaVencimento BETWEEN '${dataInicial}' AND '${dataFinal}'`;
            }

            if (tipoPagamento) {
                query += ` AND contaCategoria = ${tipoPagamento}`;
            }

            if (contaStatus) {
                query += ` AND contaStatus = ${contaStatus}`;
            }

            return query;
        };

        const contaBancaria = await executarQuery(montarConsulta()).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar array contas!"});
        });

        return contaBancaria;
    }

    static async postConta({conta = Object(), token = Object(), matrix = String(), chavesEstrangeiras = Object()}) {
        const results = await this.validate({conta: conta, token: token});

        await this.verifyMatrixXTipoFornecedor({matrix: matrix, contaRecebedor: results?.contaRecebedor});

        const newConta = new Object({
            onda_conta_matrix: matrix,
            onda_conta_datacriacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_conta_usercriacao: token?.onda_user_id || 60,
            onda_conta_gestor: results?.contaGestor,
            onda_conta_categoria: results?.contaCategoria,
            onda_conta_centrocusto: results?.contaCentroCusto,
            onda_conta_recebedor: results?.contaRecebedor,
            onda_conta_vencimento: getDataHorarioAtual.YYYY_MM_DD_00_00_00(results?.contaVencimento),
            onda_conta_valor: results?.contaValor,
            onda_conta_acrescimos: results?.contaAcrescimos,
            onda_conta_valorfinal: Number(results?.contaAcrescimos) + Number(results?.contaValor),
            onda_conta_parcela: results?.contaParcela,
            onda_conta_status: 1400,
            onda_conta_formapagamento: results?.contaFormaPagamento,
            onda_conta_observacoes: results?.contaObservacoes,
            onda_conta_recorrente: results?.contaRecorrenteBoleano,
            onda_conta_contarecebedor: results?.contaContaRecebedor || null,
            //CAMPOS ADICIONADOS PARA ID
            onda_conta_contrato_id: chavesEstrangeiras?.onda_conta_contrato_id || 0,
            onda_conta_sinistro_id: chavesEstrangeiras?.onda_conta_sinistro_id || 0,
            onda_conta_sinistro_cod: chavesEstrangeiras?.onda_conta_sinistro_cod || 0,
        });

        const sql = await this.gerarSqlParcelas({newConta});

        const newContaBancaria = await executarQuery(sql).catch((errr) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar conta!"});
        });

        const [getNewContaCadastrada] = await executarQuery(`SELECT * FROM VW_CONTAS WHERE id = '${newContaBancaria?.insertId}'`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar nova conta!"});
        });

        await VW_CONTAS.post(getNewContaCadastrada);

        return getNewContaCadastrada;
    }

    static async gerarSqlParcelas({newConta = Object()}) {
        let sql = `INSERT INTO onda_contas (
            onda_conta_cod,
            onda_conta_matrix,
            onda_conta_datacriacao,
            onda_conta_usercriacao,
            onda_conta_gestor,
            onda_conta_categoria,
            onda_conta_centrocusto,
            onda_conta_vencimento,
            onda_conta_valor,
            onda_conta_acrescimos,
            onda_conta_valorfinal,
            onda_conta_status,
            onda_conta_formapagamento,
            onda_conta_observacoes,
            onda_conta_total_parcelas,
            onda_conta_parcela,
            onda_conta_recorrente,
            onda_conta_recebedor,
            onda_conta_contarecebedor,
            onda_conta_contrato_id,
            onda_conta_sinistro_id,
            onda_conta_sinistro_cod
        ) VALUES `;

        for (let i = 0; i < newConta.onda_conta_parcela; i++) {
            sql += `
            (   
                '${gerarCondigoSetores("CONT")}',
                '${newConta.onda_conta_matrix}',
                '${newConta.onda_conta_datacriacao}',
                '${newConta.onda_conta_usercriacao}',
                '${newConta.onda_conta_gestor}',
                '${newConta.onda_conta_categoria}',
                '${newConta.onda_conta_centrocusto}',               
                DATE_ADD('${newConta.onda_conta_vencimento}', INTERVAL ${i} MONTH),               
                '${newConta.onda_conta_valor}',
                '${newConta.onda_conta_acrescimos}',
                '${newConta.onda_conta_valorfinal}',
                '${newConta.onda_conta_status}',
                '${newConta.onda_conta_formapagamento}',
                '${newConta.onda_conta_observacoes}',
                '${newConta.onda_conta_parcela}',
                '${i + 1}',
                '${newConta.onda_conta_recorrente}',
                '${newConta.onda_conta_recebedor}',
                ${newConta.onda_conta_contarecebedor},
                '${newConta.onda_conta_contrato_id || 0}',
                '${newConta.onda_conta_sinistro_id || 0}',
                '${newConta.onda_conta_sinistro_cod || 0}'
            ),`;
        }
        sql = sql.slice(0, -1) + ";";

        return sql;
    }

    static async putConta({conta = Object(), oldConta = Object(), cod = String(), token = Object()}) {
        if (!cod.includes("CONT")) {
            return setResponse.WARNING({message: "O código da conta é obrigatório!"});
        }

        const results = await this.validate({conta: conta, token: token});

        await this.verifyMatrixXTipoFornecedor({matrix: oldConta?.contaMatrix, contaRecebedor: results?.contaRecebedor});

        const updateConta = new Object({
            onda_conta_gestor: results?.contaGestor,
            onda_conta_categoria: results?.contaCategoria,
            onda_conta_centrocusto: results?.contaCentroCusto,
            onda_conta_vencimento: getDataHorarioAtual.YYYY_MM_DD_00_00_00(results?.contaVencimento),
            onda_conta_valor: results?.contaValor,
            onda_conta_acrescimos: results?.contaAcrescimos,
            onda_conta_recebedor: results?.contaRecebedor,
            onda_conta_valorfinal: Number(results?.contaValor) + Number(results?.contaAcrescimos),
            onda_conta_parcela: results?.contaParcela,
            onda_conta_status: results?.contaStatus,
            onda_conta_formapagamento: results?.contaFormaPagamento,
            onda_conta_observacoes: results?.contaObservacoes,
            onda_conta_recorrente: results?.contaRecorrenteBoleano,
            onda_conta_datapagamento: gerarDataPagamento({conta: conta, oldConta: oldConta}),
        });

        function gerarDataPagamento({conta: conta, oldConta: oldConta}) {
            if (conta?.contaStatus == 1401 && oldConta?.contaStatus != 1401) {
                return getDataHorarioAtual.YYYY_MM_DD_00_00_00();
            } else {
                return null;
            }
        }

        await this.cadastrarContaRecorrente({conta: conta, oldConta: oldConta, token: token});

        const updates = [];

        for (const key in updateConta) {
            if (updateConta.hasOwnProperty(key) && updateConta[key] !== undefined) {
                const value = typeof updateConta[key] === "string" ? `'${updateConta[key]}'` : updateConta[key];
                updates.push(`${key} = ${value}`);
            }
        }

        const sql = `
            UPDATE onda_contas
                SET ${updates.join(", ")}
            WHERE onda_conta_cod = '${cod}'
            LIMIT 1
        `;

        const updateFornecedor = await executarQuery(sql).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar conta!"});
        });

        if (updateFornecedor?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar conta!"});
        }

        if (updateFornecedor?.changedRows === 0) {
            return setResponse.WARNING({message: "Sem atualizações para salvar!", results: oldConta});
        }

        const contaAtualizada = this.getOneNotRes({cod: cod});

        await VW_CONTAS.post(contaAtualizada);

        return contaAtualizada;
    }

    static async putStatusConta({contas = Array(), token}) {
        if (contas.length <= 0) {
            return setResponse.WARNING({message: "Contas não enviadas para atualização!"});
        }

        const arrayIdsConta = [];
        for (const conta of contas) {
            arrayIdsConta.push(conta?.id);
        }

        const pagamentoEfetuado = 1401;
        const dataAgora = getDataHorarioAtual.YYYY_MM_DD_00_00_00();
        const matrixPagamento = gerarCondigoSetores("PAY-CONT");

        const sql = `
            UPDATE onda_contas
                SET 
                onda_conta_status = 1401,
                onda_conta_datapagamento = '${dataAgora}',
                onda_conta_user_pagamento = '${token.id}',
                onda_conta_matrix_pagamento = '${matrixPagamento}',
                onda_conta_data_update =  '${dataAgora}',
                onda_conta_userupdate = '${dataAgora}'
            WHERE onda_conta_id IN (${arrayIdsConta.join(", ")})
            LIMIT ${contas.length + 1}
        `;

        const updateFornecedor = await executarQuery(sql).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar contas!"});
        });

        if (updateFornecedor?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar contas!"});
        }

        const contasAtualizadas = await this.selectByArrayId({ids: arrayIdsConta});

        for (const conta of contasAtualizadas) {
            await VW_CONTAS.post(conta);
        }

        if (updateFornecedor?.changedRows === 0) {
            return setResponse.WARNING({message: "Sem atualizações para salvar!", results: contasAtualizadas});
        }

        return contasAtualizadas;
    }

    static async putStatusContaAcordo({contas = Array()}) {
        if (contas.length <= 0) {
            return setResponse.WARNING({message: "Contas não enviadas para atualização!"});
        }

        const arrayIdsConta = [];
        for (const conta of contas) {
            arrayIdsConta.push(conta?.id);
        }

        const sql = `
            UPDATE onda_contas
                SET 
                onda_conta_status = 1407,
                onda_conta_datapagamento = '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'
            WHERE onda_conta_id IN (${arrayIdsConta.join(", ")})
            LIMIT ${contas.length + 1}
        `;

        const updateFornecedor = await executarQuery(sql).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar contas!"});
        });

        if (updateFornecedor?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar contas!"});
        }

        const contasAtualizadas = await this.selectByArrayId({ids: arrayIdsConta});

        for (const conta of contasAtualizadas) {
            await VW_CONTAS.post(conta);
        }

        if (updateFornecedor?.changedRows === 0) {
            return setResponse.WARNING({message: "Sem atualizações para salvar!", results: contasAtualizadas});
        }

        return contasAtualizadas;
    }

    static async getArrayDeAnos() {
        const anos = await executarQuery(`
            SELECT DISTINCT YEAR(contaVencimento) AS ano
                FROM  VW_CONTAS
            ORDER BY ano;
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar array de anos!"});
        });

        const arrayStringAnos = [];
        for (const ano of anos) {
            arrayStringAnos.push(String(ano?.ano));
        }

        return {
            tabela_onda_contas: {
                anosDisponiveis: arrayStringAnos,
            },
        };
    }

    static async getContasPagas() {
        let query = `
                SELECT
                *
                FROM VW_CONTAS_PAGAS
            `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contas pagas!"});
        });

        return results;
    }

    static async totalPagoXDevidoByAnoMes({data}) {
        const {dataInicial, dataFinal, tipoPagamento, contaStatus} = data;

        const montarConsulta = () => {
            let query = `
                SELECT 
                    COALESCE(SUM(CASE WHEN VW.contaStatus != 1401 AND VW.contaStatus != 1402 THEN VW.contaValorFinal ELSE 0 END), 0) AS totalPagar,
                    COALESCE(SUM(CASE WHEN VW.contaStatus = 1401 THEN VW.contaValorFinal ELSE 0 END), 0) AS totaPago
                FROM VW_CONTAS AS VW
                WHERE 1=1
            `;

            if (dataInicial && dataFinal) {
                query += `AND contaVencimento BETWEEN '${dataInicial}' AND '${dataFinal}'`;
            }

            if (tipoPagamento) {
                query += ` AND contaCategoria = ${tipoPagamento}`;
            }

            if (contaStatus) {
                query += ` AND contaStatus = ${contaStatus}`;
            }

            return query;
        };

        const query = montarConsulta();
        const [results] = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar conta!"});
        });

        return results;
    }

    static async verifyMatrixXTipoFornecedor({matrix, contaRecebedor}) {
        // 200	Imobiliária  cod: IMOB
        // 201	Fornecedor   cod: FORN
        // 202	Parceiro     cod: PARC
        // 203	Locatário    cod: LOCA
        // 204	Colaborador  cod: COLA
        // 205	Executivo    cod: EXEC

        if (!matrix || !contaRecebedor) {
            return setResponse.WARNING({message: "A contaMatrix e contaRecebedor é obrigatório!"});
        }

        if (matrix.includes("OND") && ![200, 202, 203, 204, 205].includes(contaRecebedor)) {
            return setResponse.WARNING({message: `O código para o contrato deve ser 200, 202, 203, 204 ou 205!`});
        }

        if (matrix.includes("IMOB") && contaRecebedor !== 200) {
            return setResponse.WARNING({message: `O contaRecebedor da imobiliária deve ser 200`});
        }

        if (matrix.includes("FORN") && contaRecebedor !== 201) {
            return setResponse.WARNING({message: `O contaRecebedor do fornecedor deve ser 201`});
        }

        if (matrix.includes("PARC") && contaRecebedor !== 202) {
            return setResponse.WARNING({message: `O contaRecebedor do parceiro deve ser 202`});
        }

        if (matrix.includes("LOCA") && contaRecebedor !== 203) {
            return setResponse.WARNING({message: `O contaRecebedor do locatário deve ser 203`});
        }

        if (matrix.includes("COLA") && contaRecebedor !== 204) {
            return setResponse.WARNING({message: `O contaRecebedor do colaborador deve ser 204`});
        }

        if (matrix.includes("EXEC") && contaRecebedor !== 205) {
            return setResponse.WARNING({message: `O contaRecebedor do executivo deve ser 205`});
        }
    }

    static async cadastrarContaRecorrente({conta, oldConta, token}) {
        if (Number(conta?.contaRecorrenteBoleano) == 0 || Number(conta?.contaStatus) != 1401) {
            return;
        }
        const proximoVencimento = getDataHorarioAtual.GERAR_PROXIMO_VENCIMENTO(conta?.contaVencimento);

        conta.contaVencimento = proximoVencimento;

        const [ano, mes] = proximoVencimento.split("-");

        const verificarSEaAcontaJaFoiCadastradaNoMes = await executarQuery(`
            SELECT * FROM VW_CONTAS
            WHERE contaMatrix = '${oldConta?.contaMatrix}'
            AND MONTH(contaVencimento) = ${mes}
            AND YEAR(contaVencimento) = ${ano}
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao consultar se conta já foi cadastrada!"});
        });

        if (verificarSEaAcontaJaFoiCadastradaNoMes.length == 0) {
            await this.postConta({conta: conta, token: token, matrix: oldConta?.contaMatrix});
        }

        return;
    }

    static async criarRecorrenteById({ids = Array(), token}) {
        const arrayContas = await this.selectByArrayId({ids: ids});

        const filtrarRecorrentes = await arrayContas.filter((item) => item.contaRecorrenteBoleano == 1);

        for (const conta of filtrarRecorrentes) {
            let newDataVencimento = new Date(conta?.onda_conta_vencimento);
            newDataVencimento.setMonth(newDataVencimento.getMonth() + 1);

            const newConta = new Object({
                contaGestor: conta?.onda_conta_gestor,
                contaCategoria: conta?.onda_conta_categoria,
                contaCentroCusto: conta?.onda_conta_centrocusto,
                contaVencimento: newDataVencimento, // aceita no formato UTC também
                contaValor: conta?.onda_conta_valor,
                contaAcrescimos: conta?.onda_conta_acrescimos,
                contaParcela: conta?.onda_conta_parcela, // Aceita do 1 ao 12
                contaStatus: conta?.onda_conta_status,
                contaFormaPagamento: conta?.onda_conta_formapagamento,
                contaRecebedor: conta?.onda_conta_recebedor,
                contaObservacoes: conta?.onda_conta_observacoes,
            });

            await new Promise(async (reject, resolve) => {
                await this.postConta({conta: newConta, token: token, matrix: conta?.contaRecebedorMatrix});
            });
        }
    }

    static async selectByArrayId({ids = Array()}) {
        const contasAtualizadas = await executarQuery(`
            SELECT * FROM VW_CONTAS
            WHERE id IN (${ids.join(", ")})
        `).catch(() => {
            return setResponse.WARNING({message: "Erro ao buscar contas pelo array de ids!"});
        });

        return contasAtualizadas;
    }
    /**
     * @deprecated
     */
    static async gerarComissaoImobiliaria({cod, cartaFianca}) {
        const virificarSeJaCadastrouComissaoNoContrato = await executarQuery(`
            SELECT * FROM onda_contas
            WHERE onda_conta_matrix = '${cod}'
            AND onda_conta_recebedor = 200
            AND onda_conta_categoria = 152
        `);

        if (virificarSeJaCadastrouComissaoNoContrato.length > 0) return;

        // Perguntar se o extorno entra ou não na somatória   AND CT.onda_conta_extorno = 0
        const comissoesGeradasMesAtual = await executarQuery(`
            SELECT CT.* FROM VW_CONTAS AS CT
            WHERE CT.contaRecebedorMatrix = '${cartaFianca?.imobCodigo}'
            AND MONTH(CT.contaVencimento) = '${cartaFianca?.dataPagamentoMesProximo}'
            AND CT.contaRecebedorTipoId = 200
            AND CT.contaCategoria = 152
            AND CT.contaStatus NOT IN (1402, 1401)
            ORDER BY CT.contaDataCriacao ASC
        `);

        const gerarValor = () => {
            //Array começa em 0
            if (comissoesGeradasMesAtual.length <= 4) return 120;
            if (comissoesGeradasMesAtual.length <= 9) return 150;
            if (comissoesGeradasMesAtual.length <= 14) return 180;
            if (comissoesGeradasMesAtual.length >= 15) return 230;
        };

        const newComissao = {
            contaGestor: 71,
            contaCategoria: 152,
            contaCentroCusto: 102,
            contaRecebedor: 200,
            contaVencimento: cartaFianca?.dataPagamentoIntervalo1Mes,
            contaValor: gerarValor(),
            contaAcrescimos: 0,
            contaParcela: 1,
            contaStatus: 1400,
            contaFormaPagamento: 172,
            contaObservacoes: "--",
            contaRecorrenteBoleano: 0,
        };

        const token = {
            onda_user_id: 60,
        };

        const chavesEstrangeiras = {
            onda_conta_contrato_id: cartaFianca?.id,
            onda_conta_sinistro_id: 0,
            onda_conta_sinistro_cod: 0,
        };

        const newComissaoImobiliaria = await this.postConta({conta: newComissao, token: token, matrix: cod, chavesEstrangeiras: chavesEstrangeiras});

        return newComissaoImobiliaria;
    }

    /**
     *
     * @deprecated
     */
    static async gerarComissaoImobiliariaRegra2025({cod, cartaFianca}) {
        try {
            function gerarValorComissao(porcentagemComissao, comissaoCartaFianca) {
                const porcentagem = new BigNumber(porcentagemComissao);
                const comissao = new BigNumber(comissaoCartaFianca);
                const resultado = comissao.multipliedBy(porcentagem).decimalPlaces(2);
                return resultado;
            }
            await servicesDocumentsQuery.solicitarDocumentos_query({cod, typeFileId: 1100});
            const porcentagemComissaoImobiliaria = await onda_imob.buscarPorcentagemComissaoImobiliaria({codImobiliaria: cartaFianca?.imobCodigo});
            const contaValor = gerarValorComissao(Number(porcentagemComissaoImobiliaria?.onda_imob_porcentagem_comissao), Number(cartaFianca?.valoradesao));

            const newComissao = {
                contaGestor: 71,
                contaCategoria: 152,
                contaCentroCusto: 102,
                contaRecebedor: 200,
                contaVencimento: cartaFianca?.dataPagamentoIntervalo1Mes,
                contaValor: contaValor,
                contaAcrescimos: 0,
                contaParcela: 1,
                contaStatus: 1400,
                contaFormaPagamento: 172,
                contaObservacoes: "--",
                contaRecorrenteBoleano: 0,
            };

            const token = {
                onda_user_id: 60,
            };

            const chavesEstrangeiras = {
                onda_conta_contrato_id: cartaFianca?.id,
                onda_conta_sinistro_id: 0,
                onda_conta_sinistro_cod: 0,
            };

            const newComissaoImobiliaria = await this.postConta({conta: newComissao, token: token, matrix: cod, chavesEstrangeiras: chavesEstrangeiras});

            return newComissaoImobiliaria;
        } catch (error) {}
    }
    /**
     * @deprecated
     */
    static async recalcularComissaoImobiliariaEstornoCf({cartaFianca = Object(), status = Boolean()}) {
        // Buscar conta para atualuizar o status da comissão do contratato estornado
        const [buscarComissaoParavalidar] = await executarQuery(`
            SELECT * FROM onda_contas
            WHERE onda_conta_matrix = '${cartaFianca?.contrato}'
            AND onda_conta_status != 1401
            AND onda_conta_recebedor = 200
            AND onda_conta_categoria = 152
            LIMIT 1
        `);

        // 1400	Aguardando pagamento
        // 1401	Pagamento efetuado
        // 1402	Pagamento cancelado
        // 1403	Pagamento em processamento
        // 1404	Pagamento em análise

        if (!buscarComissaoParavalidar) return;

        // Buscar as comissões para poder atualizar o valor a ser pago nas comissões recalculando com os estornos retirados
        const comissoesGeradasNoMesDoEstorno = await executarQuery(`
            SELECT CT.* FROM VW_CONTAS AS CT
            WHERE CT.contaRecebedorMatrix = '${cartaFianca?.imobCodigo}'
            AND MONTH(CT.contaVencimento) = '${cartaFianca?.dataPagamentoMesProximo}'
            AND CT.contaRecebedorTipoId = 200
            AND CT.contaCategoria = 152
            AND CT.contaStatus NOT IN (1402, 1401)
            ORDER BY CT.contaDataCriacao ASC
        `).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos comissão imobiliária!"});
        });

        function gerarValor(i) {
            //Array começa em 0
            if (i <= 4) return 120;
            if (i <= 9) return 150;
            if (i <= 14) return 180;
            if (i >= 15) return 230;
        }

        for (let i = 0; i < comissoesGeradasNoMesDoEstorno.length; i++) {
            const sql = `
                UPDATE onda_contas 
                SET 
                    onda_conta_valor = ${gerarValor(i)},
                    onda_conta_valorfinal = ${gerarValor(i)}
                WHERE onda_conta_cod = '${comissoesGeradasNoMesDoEstorno?.[i]?.contaCod}'
                LIMIT 1
            `;

            await executarQuery(sql).catch((err) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar contas!"});
            });
        }
    }

    static async getAllNotResSemFiltro() {
        const contas = await executarQuery(`
            SELECT * FROM VW_CONTAS
        `).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contas!"});
        });

        return contas;
    }

    static async getAllNotResSemFiltro2() {
        const contas = await executarQuery(`
            SELECT * FROM VW_CONTAS
        `).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contas!"});
        });

        return contas;
    }

    static async getContaByCod({cods = []}) {
        if (!cods) {
            return [];
        }
        const querys = cods.map(() => "?").join(", ");
        const query = ` 
            SELECT *
            FROM VW_CONTAS AS VW
            WHERE VW.contaCod in (${querys})`;

        const result = await executarQuery(query, cods).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar conta!"});
        });
        return result;
    }
};

export default onda_contas;
