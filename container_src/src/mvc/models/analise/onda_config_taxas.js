import {DataTypes} from "sequelize";
import * as yup from "yup";
import db from "../../../db/connMysql.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";

//UTILS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

//MODELS
import onda_parametros_carta_fianca from "../mongoose/onda_parametros_carta_fianca.js";

const tableName = "onda_config_taxas";

const onda_config_taxas = class onda_config_taxas {
    static metodo() {
        return db.define(
            tableName,
            {
                configId: {
                    type: DataTypes.INTEGER,
                    field: "onda_config_id",
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                    validate: validate.name("configId").notNull().notEmpty().isInt().isNumeric().build(),
                },
                configTaxaBasicVista: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaBasicVista",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaBasicVista").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaBasicPrazo: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaBasicPrazo",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaBasicPrazo").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaStandardVista: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaStandardVista",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaStandardVista").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaStandardPrazo: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaStandardPrazo",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaStandardPrazo").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaPremiumVista: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaPremiumVista",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaPremiumVista").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaPremiumPrazo: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaPremiumPrazo",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaPremiumPrazo").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaBasicDesconto: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaBasicDesconto",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaBasicDesconto").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaStandardDesconto: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaStandardDesconto",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaStandardDesconto").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaPremiumDesconto: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaPremiumDesconto",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaPremiumDesconto").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaPintura: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaPintura",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaPintura").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaLimpezaExterna: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaLimpezaExterna",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaLimpezaExterna").notEmpty().isNumeric().notNull().build(),
                },
                configTaxaVistoria: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_TaxaVistoria",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configTaxaVistoria").notEmpty().isNumeric().notNull().build(),
                },
                configAdesaoMinima: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_AdesaoMinima",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configAdesaoMinima").notEmpty().isNumeric().notNull().build(),
                },
                configAdesaoMaxima: {
                    type: DataTypes.DECIMAL(9, 2),
                    field: "onda_config_AdesaoMaxima",
                    allowNull: false,
                    requere: true,
                    validate: validate.name("configAdesaoMaxima").notEmpty().isNumeric().notNull().build(),
                },
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async validate({data}) {
        const schema = yup.object().shape({
            // descontos e taxas avista e prazo
            onda_config_TaxaBasicVista: yup.number().min(0).max(100).required('O campo "onda_config_TaxaBasicVista" é obrigatório.'),
            onda_config_TaxaBasicPrazo: yup.number().min(0).max(100).required('O campo "onda_config_TaxaBasicPrazo" é obrigatório.'),
            onda_config_TaxaStandardVista: yup.number().min(0).max(100).required('O campo "onda_config_TaxaStandardVista" é obrigatório.'),
            onda_config_TaxaStandardPrazo: yup.number().min(0).max(100).required('O campo "onda_config_TaxaStandardPrazo" é obrigatório.'),
            onda_config_TaxaPremiumVista: yup.number().min(0).max(100).required('O campo "onda_config_TaxaPremiumVista" é obrigatório.'),
            onda_config_TaxaPremiumPrazo: yup.number().min(0).max(100).required('O campo "onda_config_TaxaPremiumPrazo" é obrigatório.'),
            onda_config_TaxaBasicDesconto: yup.number().min(0).max(100).required('O campo "onda_config_TaxaBasicDesconto" é obrigatório.'),
            onda_config_TaxaStandardDesconto: yup.number().min(0).max(100).required('O campo "onda_config_TaxaStandardDesconto" é obrigatório.'),
            onda_config_TaxaPremiumDesconto: yup.number().min(0).max(100).required('O campo "onda_config_TaxaPremiumDesconto" é obrigatório.'),
            //outras taxas
            onda_config_TaxaPintura: yup.number().required('O campo "onda_config_TaxaPintura" é obrigatório.'),
            onda_config_TaxaLimpezaExterna: yup.number().required('O campo "onda_config_TaxaLimpezaExterna" é obrigatório.'),
            onda_config_TaxaVistoria: yup.number().required('O campo "onda_config_TaxaVistoria" é obrigatório.'),
            onda_config_TaxaVistoriaEntradaSaida: yup.number().required('O campo "onda_config_TaxaVistoriaEntradaSaida" é obrigatório.'),
            onda_config_AdesaoMinima: yup.number().required('O campo "onda_config_AdesaoMinima" é obrigatório.'),
            onda_config_AdesaoMaxima: yup.number().required('O campo "onda_config_AdesaoMaxima" é obrigatório.'),
            onda_config_taxacoringa: yup.number().required('O campo "onda_config_taxacoringa" é obrigatório.'),
            onda_config_taxa_meta: yup.number().required('O campo "onda_config_taxa_meta" é obrigatório.'),
            onda_config_taxa_entrada: yup.number().required('O campo "onda_config_taxa_entrada" é obrigatório.'),
            onda_config_valor_minimo_parcelas_boleto: yup.number().required('O campo "onda_config_valor_minimo_parcelas_boleto" é obrigatório.'),
        });

        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    static compararObjetosFormatado(obj1, obj2) {
        const mudancas = [];

        // Mapeamento de nomes bonitos para as chaves
        const nomesBonitos = {
            onda_config_TaxaBasicVista: "Taxa Basic à vista",
            onda_config_TaxaBasicPrazo: "Taxa Basic a prazo",
            onda_config_TaxaStandardVista: "Taxa Standard à vista",
            onda_config_TaxaStandardPrazo: "Taxa Standard a prazo",
            onda_config_TaxaPremiumVista: "Taxa Premium à vista",
            onda_config_TaxaPremiumPrazo: "Taxa Premium a prazo",
            onda_config_TaxaBasicDesconto: "Taxa de desconto Basic",
            onda_config_TaxaStandardDesconto: "Taxa de desconto Standard",
            onda_config_TaxaPremiumDesconto: "Taxa de desconto Premium",
            onda_config_TaxaPintura: "Taxa de pintura",
            onda_config_TaxaLimpezaExterna: "Taxa de limpeza externa",
            onda_config_TaxaVistoria: "Taxa de vistoria",
            onda_config_TaxaVistoriaEntradaSaida: "Taxa de vistoria de entrada/saída",
            onda_config_AdesaoMinima: "Adesão mínima",
            onda_config_AdesaoMaxima: "Adesão máxima",
            onda_config_taxacoringa: "Taxa coringa",
            onda_config_taxa_meta: "Taxa meta",
            onda_config_valor_minimo_parcelas_boleto: "Valor mínimo de parcelas de boleto",
            onda_config_taxa_entrada: "Taxa de entrada",
        };

        // Itera sobre as chaves do primeiro objeto
        for (const key in obj1) {
            if (obj1.hasOwnProperty(key)) {
                // Verifica se o valor mudou no segundo objeto
                if (obj1[key] !== obj2[key]) {
                    const nomeBonito = nomesBonitos[key] || key; // Pega o nome bonito ou a chave original se não existir no mapeamento
                    mudancas.push(`${nomeBonito} alterada de: ${obj1[key]} para: ${obj2[key]}`);
                }
            }
        }

        // Retorna a lista de mudanças como uma string formatada
        return mudancas.join("\n");
    }

    static async buscarUltimaTaxaCadastrada() {
        // const newTaxa = await onda_parametros_carta_fianca.getOneIdFixed();
        // if (newTaxa) {
        //     return newTaxa;
        // }

        const query = `SELECT * FROM onda_config_taxas ORDER BY onda_config_id DESC LIMIT 1`;

        const [taxa] = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao consultar taxas!"});
        });

        if (!taxa) {
            return setResponse.WARNING({message: "Taxa não encontrada!"});
        }

        return taxa;
    }

    static async buscarUltimaTaxaCadastradaFormatada() {
        const query = `SELECT * FROM onda_config_taxas ORDER BY onda_config_id DESC LIMIT 1`;

        const [taxa] = await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao consultar taxas!"});
        });

        if (!taxa) {
            return setResponse.WARNING({message: "Taxa não encontrada!"});
        }

        const coberturaConcatenado = [
            {label: `Premium - Taxa ${arredondar(taxa?.onda_config_TaxaPremiumVista)}% - Cobertura 40x o valor da locação`, name: "onda_cartafianca_cobertura", value: "Premium"},
            {
                label: `Standard - Taxa ${arredondar(taxa?.onda_config_TaxaStandardVista)}% - Cobertura 30x o valor da locação`,
                name: "onda_cartafianca_cobertura",
                value: "Standard",
            },
            {label: `Basic - Taxa ${arredondar(taxa?.onda_config_TaxaBasicVista)}% - Cobertura 20x o valor da locação`, name: "onda_cartafianca_cobertura", value: "Basic"},
        ];

        const cobertura = [
            {label: "Premium", name: "onda_cartafianca_coberturaentradaesaida", value: "Premium"},
            {label: "Standard", name: "onda_cartafianca_coberturaentradaesaida", value: "Standard"},
            {label: "Basic", name: "onda_cartafianca_coberturaentradaesaida", value: "Basic"},
        ];

        function arredondar(num) {
            if (num % 1 === 0) {
                return Math.round(num);
            } else {
                return num;
            }
        }

        const coberturas = {
            cebertura: cobertura,
            coberturaConcatenado: coberturaConcatenado,
        };
        return coberturas;
    }

    static async cadastrarNovasTaxasCartaFianca({data}) {
        const newData = await this.validate({data: data});

        const query = `
            INSERT INTO onda_config_taxas (
                onda_config_TaxaBasicVista, 
                onda_config_TaxaBasicPrazo, 
                onda_config_TaxaStandardVista, 
                onda_config_TaxaStandardPrazo, 
                onda_config_TaxaPremiumVista, 
                onda_config_TaxaPremiumPrazo, 
                onda_config_TaxaBasicDesconto, 
                onda_config_TaxaStandardDesconto, 
                onda_config_TaxaPremiumDesconto, 
                onda_config_TaxaPintura, 
                onda_config_TaxaLimpezaExterna, 
                onda_config_TaxaVistoria, 
                onda_config_TaxaVistoriaEntradaSaida, 
                onda_config_AdesaoMinima, 
                onda_config_AdesaoMaxima, 
                onda_config_taxacoringa, 
                onda_config_taxa_meta, 
                onda_config_taxa_entrada,
                onda_config_valor_minimo_parcelas_boleto
            ) VALUES (
            '${newData?.onda_config_TaxaBasicVista}',
            '${newData?.onda_config_TaxaBasicPrazo}',
            '${newData?.onda_config_TaxaStandardVista}',
            '${newData?.onda_config_TaxaStandardPrazo}',
            '${newData?.onda_config_TaxaPremiumVista}',
            '${newData?.onda_config_TaxaPremiumPrazo}',
            '${newData?.onda_config_TaxaBasicDesconto}',
            '${newData?.onda_config_TaxaStandardDesconto}',
            '${newData?.onda_config_TaxaPremiumDesconto}',
            '${newData?.onda_config_TaxaPintura}',
            '${newData?.onda_config_TaxaLimpezaExterna}',
            '${newData?.onda_config_TaxaVistoria}',
            '${newData?.onda_config_TaxaVistoriaEntradaSaida}',
            '${newData?.onda_config_AdesaoMinima}',
            '${newData?.onda_config_AdesaoMaxima}',
            '${newData?.onda_config_taxacoringa}',
            '${newData?.onda_config_taxa_meta}',
            '${newData?.onda_config_taxa_entrada}',
            '${newData?.onda_config_valor_minimo_parcelas_boleto}'
            );

        `;

        await executarQuery(query).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar novas taxas!"});
        });

        const ultimaTaxaCadastrada = await this.buscarUltimaTaxaCadastrada();

        return ultimaTaxaCadastrada;
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

    static async getOneNotRes() {}

    static async getAllNotRes() {}

    static async patchNotRes() {}
};

export default onda_config_taxas;
