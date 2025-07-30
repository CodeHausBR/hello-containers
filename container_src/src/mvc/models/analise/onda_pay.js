import {DataTypes, Op} from "sequelize";
import BigNumber from "bignumber.js";
import db from "../../../db/connMysql.js";
import yup, {object} from "yup";
//MODELS
import onda_errors from "../public/onda_errors.js";
import VW_PAY from "../../models/mongoose/VW_PAY.js";
import onda_followup from "../../models/public/onda_followup.js";
//HELPERS
import helpersControllerAsaas from "../../../helpers/bancos/asaas/controller/helpersControllerAsaas.js";
import setResponse from "../../../helpers/response/setResponse.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//UTILS
import validate from "../../utils/formatar/validate.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import executarQueryComRollback from "../../utils/mysql/funcoesQuery/executarQueryComRollback.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import {exec} from "node:child_process";
import {extrairCodigosCobranca} from "../../utils/datas/extract-cod.js";
import onda_cobranca from "../cobranca/onda_cobranca.js";

const tableName = "onda_pay";
const onda_pay = class onda_pay {
    constructor(data = {}) {
        this.onda_pay_id = data.onda_pay_id || null;
        this.onda_pay_cod = data.onda_pay_cod || "";
        this.onda_pay_contrato_id = data.onda_pay_contrato_id || null;
        this.onda_pay_contrato = data.onda_pay_contrato || "";
        this.onda_pay_titular = data.onda_pay_titular || "";
        this.onda_pay_datacriacao = data.onda_pay_datacriacao || new Date();
        this.onda_pay_cpf = data.onda_pay_cpf || "";
        this.onda_pay_cardnumber = data.onda_pay_cardnumber || "";
        this.onda_pay_serialnumber = data.onda_pay_serialnumber || "";
        this.onda_pay_token = data.onda_pay_token || "";
        this.onda_pay_user = data.onda_pay_user || null;
        this.onda_pay_status = data.onda_pay_status || null;
        this.onda_pay_plataforma = data.onda_pay_plataforma || null;
        this.onda_pay_desc = data.onda_pay_desc || "";
        this.onda_pay_valortotal = data.onda_pay_valortotal || 0.0;
        this.onda_pay_parcelas = data.onda_pay_parcelas || 0;
        this.onda_pay_numero_parcela = data.onda_pay_numero_parcela || 0;
        this.onda_pay_valorparcelas = data.onda_pay_valorparcelas || 0.0;
        this.onda_pay_tipopagamento = data.onda_pay_tipopagamento || null;
        this.onda_pay_helpers_tipo_conta_id = data.onda_pay_helpers_tipo_conta_id || null;
        this.onda_pay_cnab_nosso_numero = data.onda_pay_cnab_nosso_numero || "";
        this.onda_pay_cnab_seu_numero = data.onda_pay_cnab_seu_numero || "";
        this.onda_pay_cnab_status_retorno_id = data.onda_pay_cnab_status_retorno_id || "";
        this.onda_pay_cnab_status_retorno = data.onda_pay_cnab_status_retorno || "";
        this.onda_pay_cnab_status_gerado = data.onda_pay_cnab_status_gerado || 0;
        this.onda_pay_datavencimento = data.onda_pay_datavencimento || null;
        this.onda_pay_metadata = data.onda_pay_metadata || "";
        this.onda_pay_datapagamento = data.onda_pay_datapagamento || null;
        this.onda_pay_status_deletado = data.onda_pay_status_deletado || 0;
    }
    /**
     * @deprecated -- Remover para poder deletar o mongoose do projeto
     */
    static metodo(token) {
        return db.define(
            tableName,
            {
                payId: {
                    field: "onda_pay_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("payId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                payCod: {
                    field: "onda_pay_cod",
                    type: DataTypes.STRING(45),
                    unique: true,
                    primaryKey: true,
                    allowNull: false,
                    require: true,
                    defaultValue: gerarCondigoSetores("PAY"),
                    validate: validate.name("payCod").notEmpty().notNull().build(),
                },
                payContrato: {
                    field: "onda_pay_contrato",
                    type: DataTypes.STRING(250),
                    primaryKey: true,
                    allowNull: false,
                    require: true,
                    validate: validate.name("payContrato").notEmpty().notNull().build(),
                },
                payTitular: {
                    field: "onda_pay_titular",
                    type: DataTypes.STRING(250),
                    allowNull: false,
                    require: true,
                    validate: validate.name("payTitular").notEmpty().notNull().build(),
                },
                payDatacriacao: {
                    field: "onda_pay_datacriacao",
                    type: DataTypes.TIME,
                    allowNull: false,
                    require: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("payDatacriacao").notEmpty().notNull().build(),
                },
                payCpf: {
                    field: "onda_pay_cpf",
                    type: DataTypes.STRING(250),
                    allowNull: false,
                    require: true,
                    validate: validate.name("payCpf").notEmpty().notNull().build(),
                },
                payCardnumber: {
                    field: "onda_pay_cardnumber",
                    type: DataTypes.STRING(250),
                    require: true,
                    validate: {
                        customValidator(value) {
                            if (this.payTipopagamento == 2 && value.length == 0) {
                                throw new Error("Quando for cartão de crédito o payCardnumber não pode ser nulo");
                            }
                        },
                    },
                },
                paySerialnumber: {
                    field: "onda_pay_serialnumber",
                    type: DataTypes.STRING(250),
                    require: true,
                    validate: {
                        customValidator(value) {
                            if (this.payTipopagamento == 2 && value.length == 0) {
                                throw new Error("Quando for cartão de crédito o paySerialnumber não pode ser nulo");
                            }
                        },
                    },
                },
                payToken: {
                    field: "onda_pay_token",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    require: false,
                    validate: validate.name("payToken").notEmpty().build(),
                },
                payStatus: {
                    field: "onda_pay_status",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    require: true,
                    validate: validate.name("payStatus").notEmpty().notNull().build(),
                    defaultValue: 504,
                },
                payPlatform: {
                    field: "onda_pay_plataforma",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    require: true,
                    validate: validate.name("payPlatform").notEmpty().notNull().build(),
                },
                payUser: {
                    field: "onda_pay_user",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    require: true,
                    defaultValue: token?.onda_user_id || 60,
                    validate: validate.name("payUser").notEmpty().notNull().build(),
                },
                payTipopagamento: {
                    field: "onda_pay_tipopagamento",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    require: true,
                    validate: validate.name("payTipopagamento").notEmpty().notNull().build(),
                },
                payDesc: {
                    field: "onda_pay_desc",
                    type: DataTypes.TEXT,
                    validate: validate.name("payDesc").build(),
                },
                payParcelas: {
                    field: "onda_pay_parcelas",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    require: true,
                    validate: validate
                        .name("payParcelas")
                        .notEmpty()
                        .notNull()
                        .isIn([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]])
                        .build(),
                },
                payValorparcelas: {
                    field: "onda_pay_valorparcelas",
                    type: DataTypes.DECIMAL(9, 3),
                    allowNull: false,
                    require: true,
                    validate: validate.name("payValorparcelas").notEmpty().isNumeric().notNull().build(),
                },
                payValorTotal: {
                    field: "onda_pay_valortotal",
                    type: DataTypes.DECIMAL(9, 3),
                    allowNull: false,
                    require: true,
                    validate: validate.name("payValorTotal").notEmpty().notNull().isNumeric().build(),
                },
                payHelpersTipoPagamentoId: {
                    field: "onda_pay_helpers_tipo_conta_id",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    require: true,
                    validate: validate.name("payHelpersTipoPagamentoId").notEmpty().notNull().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    /**
     * @deprecated -- Foi refatorado para o COD da conta virar unico para todas as parcelas
     */
    static async verifyExists(id) {
        const [results] = await executarQuery(`
            SELECT * FROM VW_PAY
            WHERE id = '${id}'
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos!"});
        });

        if (!results) {
            return setResponse.WARNING({message: "Pagamento não cadastrado!"});
        }

        return results;
    }

    static async patchNotRes(dadosBody, cod, token) {
        const newPay = {
            payDatacriacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(dadosBody?.payDatacriacao),
            payTitular: dadosBody?.payTitular,
            payCpf: dadosBody?.payCpf,
            payPlatform: dadosBody?.payPlatform,
            payCardnumber: dadosBody?.payCardnumber,
            paySerialnumber: dadosBody?.paySerialnumber,
            payTipopagamento: dadosBody?.payTipopagamento,
            payDesc: dadosBody?.payDesc,
            payParcelas: dadosBody?.payParcelas,
            payValorTotal: dadosBody?.payValorTotal,
            payValorparcelas: Number(dadosBody?.payValorTotal) / Number(dadosBody?.payParcelas),
        };

        const [results] = await onda_pay
            .metodo()
            .update(newPay, {where: {payCod: cod}})
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({message: "Sem alterações para salvar!"});
        }

        return results;
    }
    /**
     * @deprecated -- Foi substituido pelo uso da função postContasAReceberEGerarParcelas
     */
    static async postNotRes(dadosBody, token) {
        const newPay = {
            payDatacriacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            payContrato: dadosBody?.payContrato,
            payTitular: dadosBody?.payTitular,
            payCpf: dadosBody?.payCpf,
            payPlatform: dadosBody?.payPlatform,
            payCardnumber: dadosBody?.payCardnumber,
            paySerialnumber: dadosBody?.paySerialnumber,
            payTipopagamento: dadosBody?.payTipopagamento,
            payDesc: dadosBody?.payDesc,
            payParcelas: dadosBody?.payParcelas,
            payValorTotal: dadosBody?.payValorTotal,
            payValorparcelas: Number(dadosBody?.payValorTotal) / Number(dadosBody?.payParcelas),
            payHelpersTipoPagamentoId: dadosBody?.payHelpersTipoPagamentoId || 241,
        };

        const results = await onda_pay
            .metodo(token)
            .create(newPay)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({message: "Falha ao cadastrar forma pagamento!"});
        }

        return results;
    }

    static async getAllByContrato(cod, tipo) {
        const results = await executarQuery(`
            SELECT * FROM VW_PAY
            WHERE payContrato = '${cod}'
            AND payTipoContaId IN(${(tipo !== "241" && tipo) || `241, 243`})
            ORDER BY id ASC
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos!"});
        });

        return results;
    }
    static async getAllByCobranca(cod) {
        const results = await executarQuery(`
            SELECT * FROM VW_PAY
            WHERE payCodCobranca = '${cod}'
            AND payTipoContaId IN('242')
            ORDER BY id ASC;
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos!"});
        });
        return results;
    }

    static async getAllByCobrancaCod(codigo) {
        const results = await executarQuery(
            `
        SELECT 
            c.*, 
            MAX(CASE WHEN p.payStatus = 513 THEN 1 ELSE 0 END) AS temInadimplente,
            MAX(CASE WHEN p.payStatus = 506 THEN 1 ELSE 0 END) AS temPagamentoConfirmado,
            MAX(CASE WHEN p.payStatus = 504 THEN 1 ELSE 0 END) AS temPagamentoSendoAguardado,
            MAX(CASE WHEN p.payStatus = 512 THEN 1 ELSE 0 END) AS temPagamentoCancelado,
            MIN(p.payVencimento) AS payVencimentoMaisAntigo,
            c.sinistroCobrancaCod AS payCodCobranca,
            CASE 
                WHEN 
                    COUNT(CASE WHEN p.payStatus != 512 THEN 1 ELSE NULL END)
                    = SUM(CASE WHEN p.payStatus = 506 THEN 1 ELSE 0 END)
                    AND ROUND(SUM(CASE WHEN p.payStatus = 506 THEN p.payValorparcelas ELSE 0 END), 2)
                        >= ROUND(MAX(p.payValorTotal), 2)
                THEN 1
                ELSE 0
            END AS pagamentoTotalConfirmado
        FROM VW_SINISTRO_COBRANCA c
            LEFT JOIN VW_PAY p ON p.payCodCobranca = c.sinistroCobrancaCod
            WHERE c.sinistroCobrancaCod = ?
            GROUP BY c.sinistroCobrancaCod
            ORDER BY c.id ASC;
    `,
            codigo
        ).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças!"});
        });
        return results;
    }

    static async getAllByCobrancaConjuntaCod(codigo) {
        const results = await executarQuery(
            `
        SELECT 
            c.*, 
            MAX(CASE WHEN p.payStatus = 513 THEN 1 ELSE 0 END) AS temInadimplente,
            MAX(CASE WHEN p.payStatus = 506 THEN 1 ELSE 0 END) AS temPagamentoConfirmado,
            MAX(CASE WHEN p.payStatus = 504 THEN 1 ELSE 0 END) AS temPagamentoSendoAguardado,
            MAX(CASE WHEN p.payStatus = 512 THEN 1 ELSE 0 END) AS temPagamentoCancelado,
            MIN(p.payVencimento) AS payVencimentoMaisAntigo,
            c.sinistroCobrancaCod AS payCodCobranca 
        FROM VW_SINISTRO_COBRANCA c
            LEFT JOIN VW_PAY p ON p.payCodCobranca = c.sinistroCobrancaPagamentoConjunto
            WHERE c.sinistroCobrancaPagamentoConjunto = ?
		GROUP BY 
            c.id,
            c.sinistroCobrancaCod,
            c.sinistroCobrancaPagamentoConjunto
		ORDER BY c.id ASC;
    `,
            codigo
        ).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças!"});
        });
        return results;
    }

    /**
     * @description -- Função usada para buscar os pagamentos da carta fiança ao gerar anexo1
     * @returns
     */
    static async getAllPagamentosCartaFianca(cod) {
        const results = await executarQuery(`
            SELECT * FROM VW_PAY
            WHERE payContrato = '${cod}'
            AND payTipoContaId = '241'
            GROUP BY payParcelas, payValorTotal
            ORDER BY id ASC
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos!"});
        });

        return results;
    }

    /**
     * @description -- Função usada para buscar os pagamentos da carta fiança ao gerar anexo1
     * @returns
     */
    static async getAllPagamentosCartaFiancaNoGroup(cod) {
        const results = await executarQuery(`
            SELECT * FROM VW_PAY
            WHERE payContrato = '${cod}'
            AND payTipoContaId = '241'
            ORDER BY id ASC
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos!"});
        });

        return results;
    }

    static async get_pagamentos_pelo_cod_tipo(cod, tipo) {
        const results = await executarQuery(`
            SELECT * FROM onda_pay
            WHERE onda_pay_contrato = '${cod}'
            AND onda_pay_helpers_tipo_conta_id = '${tipo || 241}'
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos na tabela!"});
        });

        return results;
    }

    /**
     * @deprecated Esta função não deve mais ser usada. Use `softDeletePagamento` no lugar.
     */
    static async deletarPagamento(id, token, payment) {
        const itensAtualizados = await this.getAllPaymentsById({ids: [id]});
        const result = await onda_pay
            .metodo()
            .destroy({where: {payId: id}})
            .catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao excluir pagamento!"});
            });

        if (result === 0) {
            return setResponse.WARNING({message: "Pagamento já foi deletado!"});
        }

        await onda_followup.postFollowup({token: token, cod: `PAY-${payment?.payTipoContaId}-${payment?.payContrato}`, event: `*Sucesso ao deletar pagamento`});

        await VW_PAY.delete(itensAtualizados);
    }

    static async softDeletePagamento(id) {
        const results = await executarQuery(`
            UPDATE onda_pay
            SET onda_pay_status_deletado = 1
            WHERE onda_pay_id = '${id}'
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro deletar pagamento!"});
        });

        return results;
    }

    static async buscarOqueFoiRecebidoDosSinistrosPeloContrato({codContrato}) {
        const schema = yup.object().shape({
            contrato: yup.string().required().matches(/^OND-/, "buscarOqueFoiRecebidoDosSinistrosPeloContrato O código deve ser o contrato ex: OND-4564564231-2024"),
        });

        const dadosBody = await yupSchemaValidate(schema, {contrato: codContrato}, {abortEarly: false});

        const [results] = await executarQuery(`
            SELECT 
               COALESCE(SUM(payValorTotal), 0) AS totalRecebidoCobrancaSinistro
            FROM VW_PAY
            WHERE payContrato = '${dadosBody?.contrato}'
            AND payTipoContaId = 242
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos!"});
        });

        return results;
    }

    static async postContasAReceberEGerarParcelas({pay = Object(), token, cartaFianca, boletoAsaas = Object()}) {
        try {
            if (boletoAsaas?.error == true) return [];
            if (!pay) return [];
            const horaDeCadastro = getDataHorarioAtual.YYYY_MM_DD_00_00_00();

            const valorTotal = new BigNumber(pay.payValorTotal);
            const numParcelas = new BigNumber(pay.payParcelas);
            const parcelas = [];

            // Calcula valor base da parcela
            const valorParcela = valorTotal.dividedBy(numParcelas).decimalPlaces(2);

            // Gera array com valores das parcelas
            for (let i = 0; i < pay.payParcelas - 1; i++) {
                parcelas.push(valorParcela);
            }

            const arrayBoletosInvertido = boletoAsaas?.data?.reverse() || [];

            // Última parcela recebe o restante
            const somaParcelasAnteriores = parcelas.reduce((acc, curr) => acc.plus(curr), new BigNumber(0));
            const ultimaParcela = valorTotal.minus(somaParcelasAnteriores).decimalPlaces(2);
            parcelas.push(ultimaParcela);
            let sql = `INSERT INTO onda_pay (
                onda_pay_cod,
                onda_pay_contrato_id,
                onda_pay_contrato,
                onda_pay_titular,
                onda_pay_datacriacao,  
                onda_pay_cpf, 
                onda_pay_cardnumber, 
                onda_pay_serialnumber, 
                onda_pay_user, 
                onda_pay_status, 
                onda_pay_plataforma, 
                onda_pay_desc,  
                onda_pay_valortotal, 
                onda_pay_parcelas,
                onda_pay_numero_parcela, 
                onda_pay_valorparcelas, 
                onda_pay_tipopagamento, 
                onda_pay_helpers_tipo_conta_id,
                onda_pay_datavencimento,
                onda_pay_datapagamento,
                onda_pay_metadata,
                onda_pay_assas_payment_id,
                onda_pay_asaas_url_boleto,
                onda_pay_asaas_installment,
                onda_pay_asaas_url_invoice,
                onda_pay_cod_cobranca
                ) VALUES `;

            for (let i = 0; i < pay?.payParcelas; i++) {
                sql += `(
                    '${gerarCondigoSetores("PAY")}',
                    '${cartaFianca?.id}',
                    '${pay.payContrato}',
                    '${pay.payTitular}',
                    '${horaDeCadastro}',
                    '${pay.payCpf}',
                    '${pay.payCardnumber}',
                    '${pay.paySerialnumber}',
                    '${token?.onda_user_id}',
                    '${pay?.payStatusPagamento || 504}',
                    '${pay.payPlatform}',
                    '${pay.payDesc}',
                    '${pay.payValorTotal}',
                    '${pay.payParcelas}',
                    '${i + 1}',
                    '${Object.keys(boletoAsaas)?.length > 0 ? arrayBoletosInvertido?.[i]?.value : parcelas[i].toNumber()}',
                    '${pay.payTipopagamento}',
                    '${pay.payHelpersTipoPagamentoId || 241}',
                    ${Object.keys(boletoAsaas)?.length > 0 ? `'${arrayBoletosInvertido?.[i]?.dueDate}'` : `DATE_ADD('${pay.payDataVencimento}', INTERVAL ${i} MONTH)`},
                    '${pay.payDataPagamento || ""}',
                    '${pay?.payMetaData || ""}',
                    ${Object.keys(boletoAsaas)?.length > 0 ? `'${arrayBoletosInvertido?.[i]?.id}'` : `'${pay?.paymentId}'` || "NULL"},
                    ${Object.keys(boletoAsaas)?.length > 0 ? `'${arrayBoletosInvertido?.[i]?.bankSlipUrl}'` : "NULL"},
                    ${pay?.payInstallments ? `'${pay?.payInstallments}'` : "NULL"},
                    ${pay?.payInvoiceUrl ? `'${arrayBoletosInvertido[i]?.invoiceUrl}'` : "NULL"},
                    ${pay?.payCodCobranca ? `'${pay?.payCodCobranca}'` : "NULL"}
                ),`;
            }
            sql = sql.slice(0, -1) + ";";

            const results = await executarQuery(sql).catch(async (error) => {
                await onda_errors.postNotRes({classe: "onda_pay", statico: "postContasAReceberEGerarParcelas", message: error});
                return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar pagamento"});
            });

            await onda_followup
                .postFollowup({
                    token: token,
                    cod: `PAY-${pay?.payHelpersTipoPagamentoId}-${pay?.payContrato}`,
                    event: `Registro de pagamento de ${pay?.payValorTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    })} em ${pay?.payParcelas}x realizado com sucesso!`,
                })
                .catch((err) => {
                    console.error(err);
                });

            const arrayIdsInseridos = [];

            for (let i = 0; results?.affectedRows > i; i++) {
                if (i == 0) arrayIdsInseridos.push(results.insertId);
                if (i > 0) {
                    const setId = Number(results.insertId) + i;
                    arrayIdsInseridos.push(setId);
                }
            }

            const itensAtualizados = await this.getAllPaymentsById({ids: arrayIdsInseridos});

            await VW_PAY.post(itensAtualizados);

            return results;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao gerar conta a receber"});
        }
    }

    static async gerarParcelasApartirQuesEstaoDentroDoAsaas({token, cartaFianca, boletoAsaas, cod, payParcelas, payValorTotal}) {
        const horaDeCadastro = getDataHorarioAtual.YYYY_MM_DD_00_00_00();

        let sql = `INSERT INTO onda_pay (
        onda_pay_cod, onda_pay_contrato_id, onda_pay_contrato, onda_pay_titular, onda_pay_datacriacao,  
        onda_pay_cpf, onda_pay_cardnumber, onda_pay_serialnumber, onda_pay_user, onda_pay_status, 
        onda_pay_plataforma, onda_pay_desc, onda_pay_valortotal, onda_pay_parcelas, onda_pay_numero_parcela, 
        onda_pay_valorparcelas, onda_pay_tipopagamento, onda_pay_helpers_tipo_conta_id, onda_pay_datavencimento,
        onda_pay_datapagamento, onda_pay_metadata, onda_pay_assas_payment_id, onda_pay_asaas_url_boleto,
        onda_pay_asaas_installment, onda_pay_asaas_url_invoice
    ) VALUES `;

        const parcelas = boletoAsaas.data.reverse();
        for (let i = 0; i < parcelas.length; i++) {
            const boleto = parcelas[i];
            const {titularParcela, docTitular, dueDate, externalReference, value, id, bankSlipUrl, installment, invoiceUrl, statusPayment} = boleto;
            const pay = {
                payContrato: cod || "N/A",
                payTitular: titularParcela || "N/A",
                payCpf: docTitular || "N/A",
                payPlatform: 15,
                payCardnumber: "",
                paySerialnumber: "",
                payStatusPagamento: statusPayment,
                payTipopagamento: 1,
                payDesc:
                    externalReference.slice(0, 7) === "PAY-241"
                        ? `pagamento da carta fiança sincronizado ${externalReference}`
                        : `pagamento do sinistro sincronizado ${externalReference}`,
                payParcelas: payParcelas,
                payValorTotal: payValorTotal,
                payHelpersTipoPagamentoId: externalReference.slice(0, 7) === "PAY-241" ? 241 : 242,
                payDataVencimento: dueDate,
                payMetaData: "",
                payDataPagamento: "",
                bankSlipUrl,
                payInstallments: installment,
                payInvoiceUrl: invoiceUrl,
                paymentId: id,
            };

            sql += `(
            '${gerarCondigoSetores("PAY")}',
            '${cartaFianca?.id}',
            '${pay.payContrato}',
            '${pay.payTitular}',
            '${horaDeCadastro}',
            '${pay.payCpf}',
            '${pay.payCardnumber}',
            '${pay.paySerialnumber}',
            '${token?.onda_user_id}',
            '${pay.payStatusPagamento || 504}',
            '${pay.payPlatform}',
            '${pay.payDesc}',
            '${pay.payValorTotal}',
            '${pay.payParcelas}',
            '${i + 1}',
            '${value}',
            '${pay.payTipopagamento}',
            '${pay.payHelpersTipoPagamentoId || 241}',
            '${dueDate}',
            '${pay.payDataPagamento || "NULL"}',
            '${pay.payMetaData || ""}',
            '${pay.paymentId || "NULL"}',
            '${pay.bankSlipUrl || "NULL"}',
            '${pay.payInstallments || "NULL"}',
            '${pay.payInvoiceUrl || "NULL"}'
        ),`;
        }

        sql = sql.slice(0, -1) + ";";
        const results = await executarQuery(sql).catch(async (error) => {
            await onda_errors.postNotRes({classe: "onda_pay", statico: "gerarParcelas", message: error});
            return setResponse.DATABASE_ERROR({message: "Erro ao inserir parcelas no banco"});
        });

        const arrayIdsInseridos = Array.from({length: results.affectedRows}, (_, i) => results.insertId + i);
        const itensAtualizados = await this.getAllPaymentsById({ids: arrayIdsInseridos});
        await VW_PAY.post(itensAtualizados);
        return results;
    }

    static async getContasAReceber({params}) {
        const {banco, locatario, tipoPagamento, tipoConta, status, statusCnab, dataInicial, dataFinal} = params;

        const gerarSql = () => {
            let sql = `
                SELECT * FROM VW_PAY WHERE 1=1
            `;
            if (dataInicial && dataFinal) {
                sql += ` AND payVencimento BETWEEN '${dataInicial}' AND '${dataFinal}'`;
            }

            if (statusCnab) {
                if (statusCnab == "1") {
                    sql += ` AND payCnabSeuNumero IS NOT NULL AND payTipopagamento = '1'`;
                } else {
                    sql += ` AND payCnabSeuNumero IS NULL AND payTipopagamento = '1'`;
                }
            }
            if (banco) {
                sql += ` AND payPlatformDesc = '${banco}'`;
            }
            if (locatario) {
                sql += ` AND payLocatario = '${locatario}'`;
            }
            if (tipoPagamento) {
                sql += ` AND payTipopagamento = '${tipoPagamento}'`;
            }
            if (tipoConta) {
                sql += ` AND payTipoContaId = '${tipoConta}'`;
            }
            if (status) {
                sql += ` AND payStatus = '${status}'`;
            }

            return sql;
        };

        const pagamentos = await executarQuery(gerarSql()).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pagamentos!"});
        });

        return pagamentos;
    }
    /**
     * @description -- Usada para atualizar de forma dinâmica a tabela onda_pay
     * @param {Array} contasAReceber -- Deve ser um array de objeto onde as keys serão os exatos nomes da colunas no banco de dados. A coluna onda_pay_id é obrigatória!
     * @returns
     */
    static async patchContasAReceber({contasAReceber = Array(), token}) {
        const setUpdateSqlArrayDeContas = [];
        let setSqlUpdContas = "";

        if (contasAReceber?.length == 0) return setSqlUpdContas;

        const idsContasAtualizadas = [];

        contasAReceber?.map(async (contaAReceber) => {
            idsContasAtualizadas.push(contaAReceber?.onda_pay_id);
            let setSqlUpdateDeAcordoComOCampoQueVemDoFront = "";
            Object.keys(contaAReceber).forEach((nomeDaColunaNoBancoDeDados) => {
                if (nomeDaColunaNoBancoDeDados == "onda_pay_id") return;
                setSqlUpdateDeAcordoComOCampoQueVemDoFront += `OP.${nomeDaColunaNoBancoDeDados} = '${contaAReceber?.[nomeDaColunaNoBancoDeDados]}', `;
            });

            setSqlUpdateDeAcordoComOCampoQueVemDoFront = setSqlUpdateDeAcordoComOCampoQueVemDoFront.slice(0, -2);

            setSqlUpdContas = `
                UPDATE onda_pay OP
                SET ${setSqlUpdateDeAcordoComOCampoQueVemDoFront}
                WHERE OP.onda_pay_id = '${contaAReceber?.onda_pay_id}';
            `;

            setUpdateSqlArrayDeContas.push(setSqlUpdContas);
        });

        const results = await executarQueryComRollback.executarQueryRollback({querys: setUpdateSqlArrayDeContas}).catch(async () => {
            await onda_errors.postNotRes({classe: "onda_pay", statico: "patchContasAReceber", message: error});
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar as contas a receber"});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possível atualizar contas a receber"});
        }

        const itensAtualizados = await this.getAllPaymentsById({ids: idsContasAtualizadas});

        await VW_PAY.post(itensAtualizados);

        return;
    }

    static async getAllPaymentsById({ids = Array()}) {
        const query = `
            SELECT * FROM VW_PAY
            WHERE id IN(${ids})
        `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contas a receber pela lista de IDs!"});
        });

        return results;
    }

    static async getAllNossoNumeroByNossoNumero(nossosNumeros = Array()) {
        const query = `
            SELECT DISTINCT payCnabNossoNumero FROM VW_PAY WHERE payCnabNossoNumero IN (${nossosNumeros})
        `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar nosso numero no banco de dados!"});
        });

        return results;
    }

    static async getMaxByNossoNumero() {
        //fixo na plataforma do sicredi, alterar quando entrar outro banco
        const query = `
            SELECT MAX(onda_pay_cnab_nosso_numero) AS ultimoNossoNumero FROM onda_pay WHERE onda_pay_plataforma = 10
        `;

        const [results] = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar nosso numero no banco de dados!"});
        });

        return results;
    }

    static async getAllPendenciasRetorno() {
        const query = `
            SELECT onda_pay_id AS id, onda_pay_cnab_nosso_numero AS nossoNumero 
            FROM onda_pay 
            WHERE onda_pay_pendente_retorno = '1'
        `;

        const results = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar nosso numero com pendencia de retorno no banco de dados!"});
        });

        return results;
    }

    static async getCobrancaConjuntaCod(codigo) {
        const results = await executarQuery(
            `
            SELECT 
                *
            FROM onda_pay 
                WHERE onda_pay_cod_cobranca = ?;
    `,
            codigo
        ).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças!"});
        });
        return results;
    }

    static async atualizar_conta_via_web_hook_assas({cobranca, token}) {
        const asaas = new helpersControllerAsaas({cobranca: cobranca});

        if (asaas.erro_validar_schema.erro == true) {
            await onda_errors.postNotRes({classe: "onda_pay", statico: "atualizar_conta_via_web_hook_assas.erro_validar_schema", message: asaas.erro_validar_schema.message});
        }

        const query = `
        UPDATE onda_pay AS OP
        SET 
        ${set_onda_pay_desc()}
        ${set_onda_pay_status()}
        ${set_onda_pay_datapagamento()}
        WHERE OP.onda_pay_assas_payment_id = "${asaas.cobranca.payment.id}"
        `;

        function set_onda_pay_desc() {
            return `OP.onda_pay_desc = "${asaas.onda_pay_desc}"`;
        }

        function set_onda_pay_status() {
            if (asaas.onda_pay_status !== 0) {
                return `, OP.onda_pay_status = ${asaas.onda_pay_status}`;
            } else {
                return ``;
            }
        }

        function set_onda_pay_datapagamento() {
            // 506	pagamento confirmado
            if (asaas.onda_pay_status == 506) {
                return `, OP.onda_pay_datapagamento = "${asaas.cobranca.payment.clientPaymentDate}"`;
            } else {
                return ``;
            }
        }

        await executarQuery(query)
            .then(async () => {
                await onda_followup.postFollowup({cod: asaas.cobranca.payment.externalReference, event: "🆗" + asaas.onda_pay_desc});

                const [ondaPay] = await executarQuery(`SELECT onda_pay_cod_cobranca FROM onda_pay WHERE onda_pay_assas_payment_id = ?;`, [asaas.cobranca.payment.id]);
                if (ondaPay) {
                    const codCobrancaCompleto = ondaPay.onda_pay_cod_cobranca;
                    const codigosCobranca = extrairCodigosCobranca(codCobrancaCompleto);
                    if (codigosCobranca.length > 1) {
                        const cobrancasConjuntas = await onda_pay.getAllByCobrancaConjuntaCod([codCobrancaCompleto]);

                        for (const cobranca of cobrancasConjuntas) {
                            await this.atualizarStatusCobranca(cobranca, token);
                        }
                    } else {
                        const sinistroCobrancaCod = codigosCobranca[0];
                        const cobrancaIndividual = await onda_pay.getAllByCobrancaCod([sinistroCobrancaCod]);

                        if (cobrancaIndividual && cobrancaIndividual.length > 0) {
                            await this.atualizarStatusCobranca(cobrancaIndividual[0], token);
                        }
                    }
                }
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({cod: asaas.cobranca.payment.externalReference, event: "❌" + asaas.onda_pay_desc});

                await onda_errors.postNotRes({classe: "onda_pay", statico: "atualizar_conta_via_web_hook_assas.executarQuery", message: err});
            });
    }

    static async atualizarStatusCobranca(cobranca, token) {
        const StatusCobranca = {
            CONCLUIDO: 1101,
            CANCELAMENTO_WAVE: 1102,
            CANCELAMENTO_PAGO_IMOB: 1104,
            NEGOCIACAO: 1100,
            ADIMPLENTE: 1107,
            INADIMPLENTE: 1108,
        };
        const {
            temPagamentoConfirmado,
            temPagamentoSendoAguardado,
            temInadimplente,
            temPagamentoCancelado,
            pagamentoTotalConfirmado,
            sinistroCobrancaStatusId,
            sinistroCobrancaCod,
        } = cobranca;

        let novoStatus = sinistroCobrancaStatusId;

        const isCancelamentoValido =
            novoStatus !== StatusCobranca.CONCLUIDO && novoStatus !== StatusCobranca.CANCELAMENTO_WAVE && novoStatus !== StatusCobranca.CANCELAMENTO_PAGO_IMOB;

        if (temPagamentoCancelado === 1 && isCancelamentoValido && pagamentoTotalConfirmado !== 1) {
            novoStatus = StatusCobranca.NEGOCIACAO;
            await onda_followup.postFollowup({
                token: token,
                cod: sinistroCobrancaCod,
                event: "🤖 Status da cobrança alterado para negociação! 🆗",
            });

            const payCodCobranca = cobranca.payCodCobranca;
            onda_cobranca.removerConteudoCobrancaItemPagamentoConjunto(payCodCobranca);
        } else if (
            (temInadimplente === 1 && temPagamentoCancelado !== 1 && temPagamentoCancelado === 0) ||
            (temInadimplente === 1 && temPagamentoCancelado !== 1 && temPagamentoCancelado === 1)
        ) {
            novoStatus = StatusCobranca.INADIMPLENTE;
            await onda_followup.postFollowup({
                token: token,
                cod: sinistroCobrancaCod,
                event: "🤖 Status da cobrança alterado para inadimplente! 🆗",
            });
        } else if (
            (temPagamentoSendoAguardado === 1 && temPagamentoConfirmado === 1 && temPagamentoCancelado === 0) ||
            (temPagamentoSendoAguardado === 1 && temPagamentoConfirmado === 0 && temPagamentoCancelado === 1)
        ) {
            novoStatus = StatusCobranca.ADIMPLENTE;
            await onda_followup.postFollowup({
                token: token,
                cod: sinistroCobrancaCod,
                event: "🤖 Status da cobrança alterado para adimplente! 🆗",
            });
        } else if ((pagamentoTotalConfirmado === 1 && temPagamentoCancelado === 0) || (pagamentoTotalConfirmado === 1 && temPagamentoCancelado === 1)) {
            novoStatus = StatusCobranca.CONCLUIDO;
            await onda_followup.postFollowup({
                token: token,
                cod: sinistroCobrancaCod,
                event: "🤖 Status da cobrança alterado para concluído! 🆗",
            });
        }
        if (novoStatus !== sinistroCobrancaStatusId) {
            await executarQuery(`UPDATE onda_sinistro_cobranca SET onda_sinistro_cobranca_status = ? WHERE onda_sinistro_cobranca_cod = ?;`, [novoStatus, sinistroCobrancaCod]);
        }
    }

    static async buscaValorPagoDaCartaFianca(idContrato) {
        const sql = `
           SELECT 
           SUM(onda_pay_valorparcelas) AS total
           FROM onda_pay
           WHERE onda_pay_contrato_id = ${idContrato} 
           AND onda_pay_helpers_tipo_conta_id = 241
           AND onda_pay_status NOT IN (512, 509, 507)
           AND onda_pay_status_deletado = 0
        `;

        const [result] = await executarQuery(sql).catch(async (err) => {
            await onda_errors.postNotRes({
                classe: "onda_pay",
                statico: "buscaValorPagoDaCartaFianca",
                message: JSON.stringify(err)?.slice(0, 4900),
            });
        });

        if (!result.total) {
            result.total = 0;
        }

        return result;
    }

    static async updateContaAcordoExtrajudicial({pay = {}}) {
        try {
            if (!pay) return [];
            const data = [
                pay?.acordoId,
                pay?.acordoCod,
                pay?.titular,
                pay?.cpf,
                pay?.cardNumber,
                pay?.serialNumber,
                pay?.statusPagamento, // foi trocado de posição
                pay?.plataforma,
                pay?.descricao,
                pay?.valorTotal,
                pay?.totalParcelas,
                pay?.numeroParcela,
                pay?.valorParcela,
                pay?.tipoPagamento,
                pay?.helpersTipoPagamentoId,
                pay?.dataVencimento,
                pay?.dataPagamento,
                pay?.id, // chave usada no WHERE
            ];

            const query = `
                UPDATE onda_pay SET 
                    onda_pay_contrato_id = ?,
                    onda_pay_contrato = ?,
                    onda_pay_titular = ?, 
                    onda_pay_cpf = ?, 
                    onda_pay_cardnumber = ?, 
                    onda_pay_serialnumber = ?, 
                    onda_pay_status = ?, 
                    onda_pay_plataforma = ?, 
                    onda_pay_desc = ?,  
                    onda_pay_valortotal = ?, 
                    onda_pay_parcelas = ?,
                    onda_pay_numero_parcela = ?, 
                    onda_pay_valorparcelas = ?, 
                    onda_pay_tipopagamento = ?, 
                    onda_pay_helpers_tipo_conta_id = ?,
                    onda_pay_datavencimento = ?,
                    onda_pay_datapagamento = ?
                WHERE onda_pay_id = ?
            `;

            const results = await executarQuery(query, data).catch(async (error) => {
                console.log(error);
                return setResponse.DATABASE_ERROR({message: "Erro ao atualizar pagamento de acordo extrajudicial"});
            });
            const itensAtualizado = await this.getAllPaymentsById({ids: [results.insertId || pay?.id]});
            return itensAtualizado[0];
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao atualizar conta de acordo extrajudicial"});
        }
    }
    static async postContaAcordoExtrajudicial({pay = {}, token, cartaFianca}) {
        try {
            if (!pay) return [];
            const horaDeCadastro = getDataHorarioAtual.YYYY_MM_DD_00_00_00();
            const data = [
                gerarCondigoSetores("PAY"),
                pay?.acordoId,
                pay?.acordoCod,
                pay?.titular,
                horaDeCadastro,
                pay?.cpf,
                pay?.cardNumber,
                pay?.serialNumber,
                token?.onda_user_id,
                pay?.statusPagamento,
                pay?.plataforma,
                pay?.descricao,
                pay?.valorTotal,
                pay?.totalParcelas,
                pay?.numeroParcela,
                pay?.valorParcela,
                pay?.tipoPagamento,
                pay?.helpersTipoPagamentoId,
                pay?.dataVencimento,
                pay?.dataPagamento,
                null,
                null,
                null,
                null,
                null,
                null,
            ];

            let sql = `INSERT INTO onda_pay (
                onda_pay_cod,
                onda_pay_contrato_id,
                onda_pay_contrato,
                onda_pay_titular,
                onda_pay_datacriacao,  
                onda_pay_cpf, 
                onda_pay_cardnumber, 
                onda_pay_serialnumber, 
                onda_pay_user, 
                onda_pay_status, 
                onda_pay_plataforma, 
                onda_pay_desc,  
                onda_pay_valortotal, 
                onda_pay_parcelas,
                onda_pay_numero_parcela, 
                onda_pay_valorparcelas, 
                onda_pay_tipopagamento, 
                onda_pay_helpers_tipo_conta_id,
                onda_pay_datavencimento,
                onda_pay_datapagamento,
                onda_pay_metadata,
                onda_pay_assas_payment_id,
                onda_pay_asaas_url_boleto,
                onda_pay_asaas_installment,
                onda_pay_asaas_url_invoice,
                onda_pay_cod_cobranca
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

            const results = await executarQuery(sql, data).catch(async (error) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar pagamento de acordo Extrajudicial"});
            });

            const itensAtualizado = await this.getAllPaymentsById({ids: [results.insertId]});
            return itensAtualizado[0];
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao cadastrar pagamento de acordo Extrajudicial"});
        }
    }
    static async getAcordoByIds({ids}) {
        try {
            const results = await onda_pay.metodo().findAll({
                where: {
                    onda_pay_id: {
                        [Op.in]: ids,
                    },
                },
                raw: true,
            });
            return results;
        } catch (error) {
            throw error;
        }
    }
    static async deleteContaAcordoExtrajudicial({ids = []}) {
        const querys = ids.map(() => "?").join(", ");
        try {
            const query = `
            UPDATE onda_pay SET 
                onda_pay_status_deletado = 1
            WHERE onda_pay_id in (${querys})
        `;
            await executarQuery(query, ids).catch(async (error) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar pagamento"});
            });

            const itensAtualizado = await this.getAcordoByIds({ids});
            return itensAtualizado;
        } catch (error) {
            return setResponse.WARNING({message: "Erro ao gerar conta a receber"});
        }
    }
};

export default onda_pay;
