//TYPES
import BigNumber from "bignumber.js";
import {DataTypes} from "sequelize";
import db from "../../../db/connMysql.js";
import yup from "yup";

//HELPERS
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import generateQuery from "../../../helpers/mysql/generate-query.js";
import setResponse from "../../../helpers/response/setResponse.js";
import onda_errors from "../public/onda_errors.js";
//UTILS
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import validate from "../../utils/formatar/validate.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

//MODELS

const tableName = "onda_cartafianca";

const onda_cartafianca = class onda_cartafianca {
    static metodo() {
        return db.define(
            tableName,
            {
                cartafiancaId: {
                    field: "onda_cartafianca_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("cartafiancaId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                cartafiancaLocatario: {
                    field: "onda_cartafianca_locatario",
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    requere: true,
                    validate: validate.name("cartafiancaLocatario").notEmpty().build(),
                },
                cartafiancaAprovado: {
                    field: "onda_cartafianca_aprovado",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 112,
                    validate: validate.name("cartafiancaAprovado").notEmpty().build(),
                },
                cartafiancaValorAPrazo: {
                    field: "onda_cartafianca_valoraprazo",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0.0,
                    validate: validate.name("cartafiancaValorAPrazo").notEmpty().build(),
                },
                cartafiancaParcela: {
                    field: "onda_cartafianca_parcela",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 11,
                    validate: validate.name("cartafiancaParcela").notEmpty().min(1).max(12).build(),
                },
                cartafiancaValorParcela: {
                    field: "onda_cartafianca_valorparcela",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0.0,
                    validate: validate.name("cartafiancaValorParcela").notEmpty().build(),
                },
                cartafiancaValorAdesao: {
                    field: "onda_cartafianca_valoradesao",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0.0,
                    validate: validate.name("cartafiancaValorAdesao").notEmpty().build(),
                },
                cartafiancaStatusAdesao: {
                    field: "onda_cartafianca_statusadesao",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: false,
                    defaultValue: 504,
                    validate: validate.name("cartafiancaStatusAdesao").notEmpty().build(),
                },
                cartafiancaConsultor: {
                    field: "onda_cartafianca_consultor",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    validate: validate.name("cartafiancaConsultor").notEmpty().build(),
                },
                cartafiancaConfigTaxaId: {
                    field: "onda_cartafianca_config_taxa_id",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 1,
                    validate: validate.name("cartafiancaConfigTaxaId").notEmpty().build(),
                },
                cartafiancaSinistro: {
                    field: "onda_cartafianca_sinistro",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                    validate: validate.name("cartafiancaSinistro").notEmpty().build(),
                },
                cartafiancaStatus: {
                    field: "onda_cartafianca_sinistro",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    requere: false,
                    defaultValue: null,
                    validate: validate.name("cartafiancaStatus").notEmpty().build(),
                },
                cartafiancaTipoPagamento: {
                    field: "onda_cartafianca_tipopagamento",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 6,
                    validate: validate.name("cartafiancaTipoPagamento").notEmpty().build(),
                },
                cartafiancaDataAprovacao: {
                    field: "onda_cartafianca_dataaprovacao",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: false,
                    validate: validate.name("cartafiancaDataAprovacao").notEmpty().build(),
                },
                cartafiancaDataRenovacao: {
                    field: "onda_cartafianca_datarenovacao",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: false,
                    validate: validate.name("cartafiancaDataRenovacao").notEmpty().build(),
                },
                cartafiancaContrato: {
                    field: "onda_cartafianca_contrato",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: true,
                    validate: validate.name("cartafiancaContrato").notEmpty().build(),
                },
                cartafiancaCriacao: {
                    field: "onda_cartafianca_criacao",
                    type: DataTypes.TIME,
                    allowNull: false,
                    requere: true,
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    validate: validate.name("cartafiancaCriacao").notEmpty().build(),
                },
                cartafiancaValorAVista: {
                    field: "onda_cartafianca_valoravista",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    validate: validate.name("cartafiancaValorAVista").notEmpty().notNull().build(),
                },
                cartafiancaValorAluguel: {
                    field: "onda_cartafianca_valoraluguel",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    validate: validate.name("cartafiancaValorAluguel").notEmpty().notNull().build(),
                },
                cartafiancaImobiliaria: {
                    field: "onda_cartafianca_imobiliaria",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    validate: validate.name("cartafiancaImobiliaria").notEmpty().build(),
                },

                cartafiancaCobertura: {
                    field: "onda_cartafianca_cobertura",
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    requere: true,
                    defaultValue: "Basic",
                    validate: validate
                        .name("cartafiancaCobertura")
                        .notEmpty()
                        // .isIn([["Basic", "Standard", "Premium"]])
                        .build(),
                },
                cartafiancaLinkPagamento: {
                    field: "onda_cartafianca_linkpagamento",
                    type: DataTypes.STRING(250),
                    defaultValue: "---",
                    validate: validate.name("cartafiancaLinkPagamento").notEmpty().build(),
                },
                cartafiancaLinkZapSign: {
                    field: "onda_cartafianca_linkzapsign",
                    type: DataTypes.STRING(250),
                    defaultValue: "---",
                    validate: validate.name("cartafiancaLinkZapSign").notEmpty().build(),
                },
                cartafiancaDataPgtoAdesao: {
                    field: "onda_cartafianca_datapgtoadesao",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: false,

                    validate: validate.name("cartafiancaDataPgtoAdesao").notEmpty().build(),
                },
                cartafiancaPrevisaoPagamento: {
                    field: "onda_cartafianca_previsaopagamento",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: false,

                    validate: validate.name("cartafiancaPrevisaoPagamento").notEmpty().build(),
                },
                cartafiancaDataPgtoCartaFianca: {
                    field: "onda_cartafianca_datapgtocartafianca",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: false,
                    defaultValue: null,
                    validate: validate.name("cartafiancaDataPgtoCartaFianca").notEmpty().build(),
                },
                cartafiancaDataReprovacao: {
                    field: "onda_cartafianca_datareprovacao",
                    type: DataTypes.TIME,
                    allowNull: true,
                    requere: false,
                    defaultValue: null,
                    validate: validate.name("cartafiancaDataReprovacao").notEmpty().build(),
                },
                cartafiancaStatusPagamento: {
                    field: "onda_cartafianca_statuspagamento",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 504,
                    validate: validate.name("cartafiancaStatusPagamento").notEmpty().build(),
                },
                porcentagemDesconto: {
                    field: "onda_cartafianca_desconto",
                    type: DataTypes.TINYINT,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0.0,
                    validate: validate.name("porcentagemDesconto").notEmpty().build(),
                },
                cartafiancaValorDesconto: {
                    field: "onda_cartafianca_valordesconto",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0.0,
                    validate: validate.name("cartafiancaValorDesconto").notEmpty().build(),
                },
                cartafiancaStatusComercial: {
                    field: "onda_cartafianca_status_comercial",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 998,
                    validate: validate.name("cartafiancaStatusComercial").notEmpty().build(),
                },
                cartafiancaStatusFinanceiro: {
                    field: "onda_cartafianca_status_financeiro",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 998,
                    validate: validate.name("cartafiancaStatusFinanceiro").notEmpty().build(),
                },
                cartafiancaStatusJuridico: {
                    field: "onda_cartafianca_status_juridico",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 998,
                    validate: validate.name("cartafiancaStatusJuridico").notEmpty().build(),
                },
                cartafiancaStatusVistoria: {
                    field: "onda_cartafianca_status_vistoria",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 998,
                    validate: validate.name("cartafiancaStatusVistoria").notEmpty().build(),
                },
                cartafiancaExecutivo: {
                    field: "onda_cartafianca_executivo",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 8,
                    validate: validate.name("cartafiancaExecutivo").notEmpty().build(),
                },
                cartafiancaVistoria: {
                    field: "onda_cartafianca_vistoria",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0,
                    validate: validate
                        .name("cartafiancaVistoria")
                        .isIn([[0, 1]])
                        .notEmpty()
                        .build(),
                },
                cartafiancaPintura: {
                    field: "onda_cartafianca_pintura",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0,
                    validate: validate
                        .name("cartafiancaPintura")
                        .isIn([[0, 1]])
                        .notEmpty()
                        .build(),
                },
                cartafiancaLimpeza: {
                    field: "onda_cartafianca_limpeza",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 0,
                    validate: validate
                        .name("cartafiancaLimpeza")
                        .isIn([[0, 1]])
                        .notEmpty()
                        .build(),
                },
                cartafiancaParceiro: {
                    field: "onda_cartafianca_parceiro",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 1,
                    validate: validate.name("cartafiancaParceiro").notEmpty().build(),
                },
                cartafiancaStatusAnalise: {
                    field: "onda_cartafianca_status_analise",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: true,
                    defaultValue: 112,
                    validate: validate.name("cartafiancaStatusAnalise").notEmpty().build(),
                },
                cartafiancaUser: {
                    field: "onda_cartafianca_user",
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    requere: false,
                    validate: validate.name("cartafiancaUser").notEmpty().build(),
                },
                cartafiancaImovelId: {
                    field: "onda_cartafianca_imovel_id",
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                    validate: validate.name("cartafiancaImovelId").notEmpty().build(),
                },
                cartafiancaColaboradorId: {
                    field: "onda_cartafianca_colaborador_id",
                    type: DataTypes.INTEGER(11),
                    allowNull: true,
                    requere: true,
                    defaultValue: 0,
                    validate: validate.name("cartafiancaColaboradorId").notEmpty().build(),
                },
                cartafiancaFonte: {
                    field: "onda_cartafianca_fonte",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    requere: true,
                    defaultValue: "WhatsApp",
                    validate: validate.name("cartafiancaFonte").notEmpty().build(),
                },
                cartafiancaTaxaIptu: {
                    field: "onda_cartafianca_taxa_iptu",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                cartafiancaTaxaImovel: {
                    field: "onda_cartafianca_taxa_imovel",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                cartafiancaTaxaAgua: {
                    field: "onda_cartafianca_taxa_agua",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                cartafiancaTaxaCondominio: {
                    field: "onda_cartafianca_taxa_condominio",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                cartafiancaTaxaLixo: {
                    field: "onda_cartafianca_taxa_lixo",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                cartafiancaTaxaEnergia: {
                    field: "onda_cartafianca_taxa_energia",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                cartafiancaTaxaGas: {
                    field: "onda_cartafianca_taxa_gas",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                cartafiancaTaxaSeguroIncendio: {
                    field: "onda_cartafianca_taxa_seguro_incendio",
                    type: DataTypes.DOUBLE,
                    allowNull: false,
                    defaultValue: 0,
                },
                parametrosAnaliseId: {
                    field: "onda_cartafianca_parametros_analise_id",
                    type: String,
                },
                dataVencimentoBoletos: {
                    field: "onda_cartafianca_data_vencimento_boletos",
                    type: DataTypes.TIME,
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async validate(dadosBody, token) {
        const results = await onda_cartafianca
            .metodo(token)
            .build(dadosBody)
            .validate()
            .then((response) => {
                return response?.dataValues;
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async verifyExists(cod) {
        const query = `
            SELECT *  
            FROM VW_CARTAFIANCA_GERAL
            WHERE contrato = '${cod}'
            LIMIT 1
        `;
        const [cartaFiancaAntiga] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        });

        if (!cartaFiancaAntiga) {
            return setResponse.WARNING({message: `O contrato: ${cod} não existe!`});
        }

        return cartaFiancaAntiga;
    }
    /**
     * @deprecated -- NÃO UTILIZAR
     */
    // TEM QUE PEGAR A VW  E APLICAR WHERE NO TOKEN :)
    static async getOneNotRes(cod, token) {
        const results = await onda_cartafianca
            .metodo()
            .findOne({
                where: {
                    locatarioCodigo: cod,
                },
            })
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async getOneNotResView(cod) {
        try {
            const schema = yup.object().shape({
                contrato: yup
                    .string()
                    .required("Contrato é obrigatório em getOneNotResView")
                    .matches(/^OND-/, "O getOneNotResView código deve ser o contrato ex: OND-4564564231-2024"),
            });
            const dadosBody = await yupSchemaValidate(schema, {contrato: cod}, {abortEarly: false});

            const taxas = await this.buscarIdDasTaxasQueEstaCartaFiancaUsa(cod);

            //VALOR USADO ADESAO
            const query = `
                SELECT 
                    *,
                    CASE 
                        WHEN VW.renovacao = 0 THEN CONCAT(" + <b>R$", REPLACE(FORMAT(VW.valoradesao, 2),'.',','), "</b> taxa de adesão pago via pix")
                        ELSE ""
                    END AS adicionarTextoAdesao,
                    CASE 
                        WHEN VW.renovacao = 1 THEN 0 
                        ELSE VW.valoradesao * 100 
                    END AS valorAdesaoPagarme,
                    CURRENT_TIMESTAMP() + INTERVAL 30 DAY AS dataVencimentoApartirCriacaoLinkPagarme,
                    CASE 
                        WHEN VW.renovacao = 1 THEN FLOOR(VW.valorprazo * 100)
                        ELSE FLOOR((VW.valoradesao * 100) + (VW.valorprazo * 100))
                    END AS valorPrazoPagarme,
                    FLOOR(VW.valorprazo * 100) AS valorPrazoSemAdesaoPagarme,
                    CASE 
                        WHEN VW.renovacao = 1 THEN FLOOR(VW.valorvista * 100)
                        ELSE FLOOR((VW.valoradesao * 100) + (VW.valorvista * 100))
                    END AS valorAvistaPagarme,
                    FLOOR(VW.valorvista * 100) AS valorAvistaSemAdesaoPagarme,
    
                    DATE_FORMAT(DATE_ADD(LAST_DAY(VW.dataPagamento), INTERVAL 15 DAY), '%Y-%m-15') AS dataPagamentoIntervalo1Mes,
                    DATE_FORMAT(DATE_ADD(VW.dataPagamento, INTERVAL 1 MONTH), '%m') AS dataPagamentoMesProximo,
                    DATE_FORMAT(VW.dataPagamento, '%d/%m/%Y %H:%i') AS dataPagamento,
                    CONCAT(DATE_FORMAT(DATE_ADD(CURRENT_DATE(), INTERVAL 1 MONTH),'%Y-%m-10'),'T03:00:00.000Z') as dataPagamentoIntervalo1MesParaDia10,
                    VW.dataPagamento AS dataPagamentoFormat,
                    CASE 
                        WHEN VW.renovacao = 1 THEN 
                            FLOOR(
                                (VW.valorvista * 100) * 
                                CASE 
                                    WHEN VW.tipopagamentoID = 6 THEN ${Number(taxas.onda_config_porcentagem_pix_mais_boletos)}
                                    WHEN VW.tipopagamentoID = 8 THEN ${Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito)}
                                    ELSE 0 -- Ou um valor padrão, caso necessário
                                END
                            )
                        ELSE 
                            FLOOR(
                                (VW.valoradesao * 100) + 
                                (VW.valorvista * 100) * 
                                CASE 
                                    WHEN VW.tipopagamentoID = 6 THEN ${Number(taxas.onda_config_porcentagem_pix_mais_boletos)}
                                    WHEN VW.tipopagamentoID = 8 THEN ${Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito)}
                                    ELSE 0 -- Ou um valor padrão, caso necessário
                                END
                            )
                    END AS pagamentoPorcentoPix11xBoletoPagarme,
    
                    CASE 
                        WHEN VW.tipopagamentoID = 6 THEN ${Number(taxas.onda_config_porcentagem_pix_mais_boletos)}
                        WHEN VW.tipopagamentoID = 8 THEN ${Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito)}
                        ELSE 0 -- Ou um valor padrão, caso necessário
                    END AS porcentagemPagamento,
                    ${taxas.onda_config_porcentagem_pix_mais_boletos} AS porcentagemPagamentoNoBoleto,
                    ${taxas.onda_config_porcentagem_pix_mais_cartao_credito} AS porcentagemPagamentoNoCredito,
    
                    CASE 
                        WHEN VW.tipopagamentoID = 6 THEN ${1 - Number(taxas.onda_config_porcentagem_pix_mais_boletos)}
                        WHEN VW.tipopagamentoID = 8 THEN ${1 - Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito)}
                        WHEN VW.tipopagamentoID = 9 THEN CAST(1 - (1 / VW.parcelas) AS DECIMAL(20,10))
                        ELSE 1 -- Ou um valor padrão, caso necessário
                    END AS porcentagemPagamentoRestantePagar,
    
                    CASE 
                        WHEN VW.renovacao = 1 THEN 
                            CASE 
                                WHEN VW.tipopagamentoID = 6 THEN ${1 - Number(taxas.onda_config_porcentagem_pix_mais_boletos)} * VW.valorvista
                                WHEN VW.tipopagamentoID = 8 THEN ${1 - Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito)} * VW.valorvista
                                ELSE VW.valorvista -- Ou um valor padrão, caso necessário
                            END
                        ELSE 
                            CASE 
                                WHEN VW.tipopagamentoID = 6 THEN ${1 - Number(taxas.onda_config_porcentagem_pix_mais_boletos)} * VW.valorvista + VW.valoradesao
                                WHEN VW.tipopagamentoID = 8 THEN ${1 - Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito)} * VW.valorvista + VW.valoradesao
                                ELSE VW.valorvista + VW.valoradesao -- Ou um valor padrão, caso necessário
                            END
                    END AS totalPagarAvistaComAdesaoMenosEntrada,
                    CASE 
                        WHEN VW.renovacao = 1 THEN VW.valorvista
                        ELSE VW.valorvista + VW.valoradesao
                    END AS totalPagarAvistaMaisAdesao,
                    VW.criacao AS criacaoNoFormat,
                    
                    CASE
                        WHEN VW.tipopagamentoID = 6 THEN FLOOR(VW.valorvista * 100)
                        WHEN VW.tipopagamentoID = 9 THEN FLOOR(VW.valorprazo * 100)
                        WHEN VW.tipopagamentoID = 8 THEN FLOOR(VW.valorvista * 100)
                        WHEN VW.tipopagamentoID = 4 THEN FLOOR(VW.valorvista * 100)
                        WHEN VW.parcelas > 1 THEN FLOOR(VW.valorprazo * 100)
                        ELSE FLOOR(VW.valorvista * 100)
                    END AS valorCartaFiancaPagarme,
    
                    DATE_FORMAT(VW.criacao, '%d/%m/%Y %H:%i') AS criacao  
                FROM VW_CARTAFIANCA_GERAL AS VW
                WHERE contrato = '${dadosBody?.contrato}'
                LIMIT 1
            `;
            const [results] = await executarQuery(query).catch((e) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
            });

            if (results.tipopagamentoID == 6) {
                results.tipopagamento = `Boleto – ${Number(taxas.onda_config_porcentagem_pix_mais_boletos) * 100}%` + `${results.parcelas}x s/juros`;
            }

            if (results.tipopagamentoID == 8) {
                const porcentagem = new BigNumber(1).minus(new BigNumber(taxas.onda_config_porcentagem_pix_mais_cartao_credito));
                const valorAvista = new BigNumber(results?.valorAvistaSemAdesaoPagarme || 0);
                const restantePagar = porcentagem.times(valorAvista);
                results.restantePagar = restantePagar.integerValue(BigNumber.ROUND_FLOOR).toNumber();

                results.tipopagamento = `Cartão de Crédito – ${Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito) * 100}%` + `${results.parcelas}x s/juros`;
            }

            return results;
        } catch (error) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        }
    }

    static async buscarIdDasTaxasQueEstaCartaFiancaUsa(cod) {
        const schema = yup.object().shape({
            contrato: yup
                .string()
                .required("Contrato é obrigatório em buscarIdDasTaxasQueEstaCartaFiancaUsa")
                .matches(/^OND-/, "O buscarIdDasTaxasQueEstaCartaFiancaUsa código deve ser o contrato ex: OND-4564564231-2024"),
        });
        const dadosBody = await yupSchemaValidate(schema, {contrato: cod}, {abortEarly: false});

        const query = `
            SELECT 
                configTaxaId
            FROM VW_CARTAFIANCA_GERAL 
            WHERE contrato = '${dadosBody?.contrato}'
            LIMIT 1
        `;
        const [cartaFianca] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança 2!"});
        });

        const query2 = `SELECT onda_config_porcentagem_pix_mais_boletos FROM onda_config_taxas WHERE onda_config_id = ${cartaFianca?.configTaxaId}`;

        const [taxa] = await executarQuery(query2).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao consultar taxas!"});
        });

        return {
            onda_config_porcentagem_pix_mais_boletos: taxa?.onda_config_porcentagem_pix_mais_boletos || 0.3,
            onda_config_porcentagem_pix_mais_cartao_credito: taxa?.onda_config_porcentagem_pix_mais_cartao_credito || 0.2,
        };
    }

    /**
     *
     * @deprecated
     */
    static async getOneNotResViewById(id) {
        const schema = yup.object().shape({
            id: yup.string().required("Id é obrigatório em getOneNotResViewById"),
        });

        const dadosBody = await yupSchemaValidate(schema, {id: id}, {abortEarly: false});

        const query = `
            SELECT 
                *,
                VW.valoradesao * 100 AS valorAdesaoPagarme,
                CURRENT_TIMESTAMP() + INTERVAL 30 DAY AS dataVencimentoApartirCriacaoLinkPagarme,
                FLOOR(VW.valorprazo * 100) AS valorPrazoPagarme,
                FLOOR(VW.valorvista * 100) AS valorAvistaPagarme,
                FLOOR(VW.valorvista * 100 * 0.3) AS pagamentoPorcentoPix11xBoletoPagarme,
                DATE_FORMAT(DATE_ADD(LAST_DAY(VW.dataPagamento), INTERVAL 15 DAY), '%Y-%m-15') AS dataPagamentoIntervalo1Mes,
                DATE_FORMAT(DATE_ADD(VW.dataPagamento, INTERVAL 1 MONTH), '%m') AS dataPagamentoMesProximo,
                DATE_FORMAT(VW.dataPagamento, '%d/%m/%Y %H:%i') AS dataPagamento,
                VW.dataPagamento AS dataPagamentoFormat,
                VW.criacao AS criacaoNoFormat,  
                DATE_FORMAT(VW.criacao, '%d/%m/%Y %H:%i') AS criacao  
            FROM VW_CARTAFIANCA_GERAL AS VW
            WHERE id = '${dadosBody?.id}'
            LIMIT 1
        `;
        const [cartaFiancaAntiga] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        });

        return cartaFiancaAntiga;
    }

    static async getOneNotResViewNotFormat(cod) {
        const schema = yup.object().shape({
            contrato: yup.string().required("Contrato é obrigatório em getOneNotResView").matches(/^OND-/, "O getOneNotResView código deve ser o contrato ex: OND-4564564231-2024"),
        });

        const dadosBody = await yupSchemaValidate(schema, {contrato: cod}, {abortEarly: false});

        const query = `
            SELECT 
                *
            FROM VW_CARTAFIANCA_GERAL 
            WHERE contrato = '${dadosBody?.contrato}'
            LIMIT 1
        `;
        const [cartaFiancaAntiga] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança 1!"});
        });

        return cartaFiancaAntiga;
    }

    static async getAllNotResView() {
        const query = `
            SELECT * FROM VW_CARTAFIANCA_GERAL 
        `;
        const allCf = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        });

        return allCf;
    }

    // TEM QUE PEGAR A VW  E APLICAR WHERE NO TOKEN :)
    static async getAllNotRes(token) {
        const results = await onda_cartafianca
            .metodo()
            .findAll()
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async createNotRes(infoAnalise, valoresCartaFianca, locatario, token, paramentroAnalise) {
        const newCartafianca = {
            //chaves
            cartafiancaLocatario: String(locatario?.locatarioCnpjcpf),
            cartafiancaImovelId: infoAnalise?.cartafiancaImovelId || 0,
            cartafiancaImobiliaria: token?.onda_imob_id || infoAnalise?.cartafiancaImobiliaria,
            cartafiancaColaboradorId: token?.onda_colaborador_id || 0,
            //others
            cartafiancaVistoria: infoAnalise?.vistoria,
            cartafiancaPintura: infoAnalise?.pintura,
            cartafiancaLimpeza: infoAnalise?.limpeza,
            cartafiancaSinistro: infoAnalise?.cartafiancaSinistro,
            cartafiancaCobertura: infoAnalise?.cartafiancaCobertura,
            cartafiancaValorAluguel: infoAnalise?.cartafiancaValorAluguel,
            porcentagemDesconto: infoAnalise?.porcentagemDesconto,
            cartafiancaFonte: infoAnalise?.cartafiancaFonte,
            //valores CF calculados
            cartafiancaValorParcela: valoresCartaFianca?.cartafiancaValorParcela,
            cartafiancaConsultor: token?.id || 85,
            cartafiancaUser: token?.id || 85,
            cartafiancaValorAdesao: infoAnalise?.valorRecebidoComissaoImobiliaria,
            cartafiancaValorAVista: valoresCartaFianca?.cartafiancaValorAVista,
            cartafiancaValorAPrazo: valoresCartaFianca?.cartafiancaValorAPrazo,
            cartafiancaParcela: valoresCartaFianca?.cartafiancaParcela || 1,
            cartafiancaConfigTaxaId: valoresCartaFianca?.cartafiancaConfigTaxaId, // DELETAR DO BANCO DEPOIS QUE O NOVO CALCULO ESTIVER PRONTO!!!
            //NOVOS ITENS ADICIONADOS 01/10/2024
            cartafiancaTaxaIptu: infoAnalise?.cartafiancaTaxaIptu,
            cartafiancaTaxaImovel: infoAnalise?.cartafiancaTaxaImovel,
            cartafiancaTaxaAgua: infoAnalise?.cartafiancaTaxaAgua,
            cartafiancaTaxaCondominio: infoAnalise?.cartafiancaTaxaCondominio,
            cartafiancaTaxaLixo: infoAnalise?.cartafiancaTaxaLixo,
            cartafiancaTaxaEnergia: infoAnalise?.cartafiancaTaxaEnergia,
            cartafiancaTaxaSeguroIncendio: infoAnalise?.cartafiancaTaxaSeguroIncendio,
            cartafiancaTaxaGas: infoAnalise?.cartafiancaTaxaGas,
            parametrosAnaliseId: String(paramentroAnalise?._id),
        };

        const retirarVazios = generateQuery.retirarkeysVazias(newCartafianca);

        const results = await onda_cartafianca
            .metodo()
            .create(retirarVazios)
            .catch(async (err) => {
                await onda_errors.postNotRes({classe: "onda_cartafianca", statico: "createNotRes", message: err});
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (results === 0) {
            return setResponse.WARNING({message: "Não foi possivel cadastrar carta fiança!"});
        }

        return results;
    }

    static async patchNotRes(dadosBody, token, cod) {
        const retirarVazios = generateQuery.retirarkeysVazias(dadosBody);

        const [results] = await onda_cartafianca
            .metodo(token)
            .update(retirarVazios, {where: {locatarioCodigo: cod}})
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        return results;
    }

    static async atualizarStatus(status, cod) {
        const query = `                    
            UPDATE onda_cartafianca AS CF
                INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                SET 
                    CF.onda_cartafianca_status_analise = ${status},
                    CF.onda_cartafianca_status_comercial = ${setStatusComercial()}
            WHERE CO.onda_contratos_contrato = '${cod}'
            LIMIT 1;
        `;
        // 111 = aprovada
        // 112 = aguardando análise
        // 109 = reprovada
        // 110 = reprovado para renovação
        // 319 = liberado para negociação
        // 318 = cancelado pela onda
        // 998 = ----
        //  CF.onda_cartafianca_status_comercial = ${setStatusComercial()}
        function setStatusComercial() {
            if (status == 111) return 319;
            if (status == 112) return 998;
            if (status == 109) return 318;
            if (status == 110) return 318;
            if (status == 116) return 318;
            return 998;
        }

        await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atulizar status da carta fiança!", erro: err});
        });

        return;
    }

    static async atualizarStatusExoneracao({status, cod}) {
        const query = `                    
            UPDATE onda_cartafianca AS CF
            SET CF.onda_cartafianca_status_comercial = ?
            WHERE CF.onda_cartafianca_contrato = ?
            LIMIT 1;
        `;

        await executarQuery(query, [status, cod]).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atulizar status de exoneração para a carta fiança!", erro: err});
        });

        return;
    }

    static async atualizarStatusFinanceiro({status, cod}) {
        const query = `                    
            UPDATE onda_cartafianca AS CF
                INNER JOIN onda_contratos AS CO ON CO.onda_contratos_id = CF.onda_cartafianca_id
                SET 
                    CF.onda_cartafianca_status_financeiro = ${status}
            WHERE CO.onda_contratos_contrato = '${cod}'
            LIMIT 1;
        `;

        await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atulizar status da carta fiança!", erro: err});
        });

        return;
    }

    static async veirificarSeEstaReprovadoByCpfCnpj(CpfCnpj) {
        const query = `
            SELECT 
                *
            FROM onda_cartafianca
            WHERE onda_cartafianca_locatario = '${CpfCnpj}'
            AND onda_cartafianca_status_analise IN (109, 110) 
            LIMIT 1
        `;
        const [cartaFiancaAntiga] = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança pelo CpfCnpj!"});
        });

        return cartaFiancaAntiga;
    }

    static async buscarEstadosEAgrupar() {
        const query = `
            SELECT VW.ImobUF AS UF
                FROM VW_CARTAFIANCA_GERAL AS VW
            GROUP BY ImobUF
        `;
        const estadosCadastradosCf = await executarQuery(query).catch((e) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar carta fiança!"});
        });

        return {estadosCadastradosCf: estadosCadastradosCf};
    }
};

export default onda_cartafianca;
