import { DataTypes, Sequelize } from "sequelize";
import db from "../../../db/connMysql.js";

//helpers
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import validate from "../../../mvc/utils/formatar/validate.js";

//services

const tableName = "onda_suporte";

const onda_suporte = class onda_suporte {
    static metodo() {
        return db.define(
            tableName,
            {
                suporteCodigo: {
                    field: "onda_suporte_codigo",
                    type: DataTypes.STRING(45),
                    defaultValue: gerarCondigoSetores("SUPO"),
                    primaryKey: true,
                    allowNull: false,
                    required: true,
                    validate: validate.name("suporteCodigo").notNull().notEmpty().len([0, 45]).build(),
                },
                suporteImobCod: {
                    field: "onda_suporte_imob_cod",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    required: true,
                    validate: validate.name("suporteImobCod").notEmpty().len([0, 45]).build(),
                },
                suporteDataAbertura: {
                    type: DataTypes.TIME,
                    field: "onda_suporte_dataabertura",
                    defaultValue: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
                    allowNull: false,
                    required: true,
                    validate: validate.name("suporteDataAbertura").notNull().notEmpty().isDate().build(),
                },
                suporteTipoSugestao: {
                    field: "onda_suporte_tiposugestao",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    required: true,
                    validate: validate.name("suporteTipoSugestao").notEmpty().len([0, 45]).build(),
                },
                suporteSetor: {
                    field: "onda_suporte_setor",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    required: true,
                    validate: validate.name("suporteSetor").notNull().notEmpty().len([0, 45]).build(),
                },
                suporteTipoProblema: {
                    field: "onda_suporte_tipoproblema",
                    type: DataTypes.STRING(45),
                    allowNull: false,
                    required: true,
                    validate: validate.name("suporteTipoProblema").notNull().notEmpty().len([0, 45]).build(),
                },
                suporteStatus: {
                    field: "onda_suporte_status",
                    type: DataTypes.INTEGER(11),
                    allowNull: false,
                    required: true,
                    defaultValue: 1200,
                    validate: validate.name("suporteStatus").notNull().isInt().notEmpty().isNumeric().build(),
                },
                suporteDescricao: {
                    field: "onda_suporte_descricao",
                    type: DataTypes.STRING(250),
                    allowNull: false,
                    required: true,
                    validate: validate.name("suporteDescricao").len([0, 250]).build(),
                },

                suporteDataEncerramento: {
                    field: "onda_suporte_dataencerramento",
                    type: DataTypes.TIME,
                    allowNull: true,
                    required: false,
                    defaultValue: null,
                    validate: validate.name("suporteDataEncerramento").isDate().build(),
                },
                suporteRetorno: {
                    field: "onda_suporte_retorno",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: false,
                    defaultValue: null,
                    validate: validate.name("suporteRetorno").len([0, 1000]).build()
                },
                suporteDetalhe: {
                    field: "onda_suporte_detalhe",
                    type: DataTypes.STRING(250),
                    allowNull: false,
                    required: false,
                    defaultValue: null,
                    validate: validate.name("suporteDetalhe").notNull().notEmpty().len([1, 1000]).build(),
                },
                suportePrioridade: {
                    field: "onda_suporte_prioridade",
                    type: DataTypes.STRING(250),
                    allowNull: true,
                    required: false,
                    validate: validate.name("suportePrioridade").isIn(["Alta, Média, Baixa"]).build(),
                },
                suportePlataforma: {
                    field: "onda_suporte_plataforma",
                    type: DataTypes.STRING(250),
                    allowNull: false,
                    required: true,
                    validate: validate.name("suportePlataforma").isIn(["Wave, Portal, Mobile, Dashboard, Outros..., Hardware / Windows / Impressora /Email"]).build(),
                },
                suporteResponsavel: {
                    field: "onda_suporte_responsavel",
                    type: DataTypes.STRING(45),
                    allowNull: true,
                    required: false,
                    validate: validate.name("suporteResponavel").notEmpty().len([0, 45]).build(),
                },
                suporteAtivo: {
                    field: "onda_suporte_ativo",
                    type: DataTypes.TINYINT(1),
                    allowNull: true,
                    required: false,
                    validate: {
                        customValidator(value) {
                            if (![0, 1, null].includes(value)) {
                                throw new Error("suporteAtivo deve estar em 0,1 ou null");
                            }
                        }
                    }
                }
            },
            {
                tableName: tableName,
                timestamps: false,
            }
        );
    }

    static async getAllNotRes() {
        const results = await executarQuery(`
        SELECT 
        *,
        DATE_FORMAT(CONVERT_TZ(VW_SUPORTE_GERAL.suporteDataAbertura, '+00:00', '-03:00'), '%d/%m/%Y %H:%i:%s') AS suporteDataAberturaFormatada,
        DATE_FORMAT(CONVERT_TZ(VW_SUPORTE_GERAL.suporteDataEncerramento, '+00:00', '-03:00'), '%d/%m/%Y %H:%i:%s') AS suporteDataEncerramentoFormatada,
        DATE_FORMAT(CONVERT_TZ(VW_SUPORTE_GERAL.suporteDataUpdate, '+00:00', '-03:00'), '%d/%m/%Y %H:%i:%s') AS suporteDataUpdateFormatada
    FROM VW_SUPORTE_GERAL
        `).catch(() => {
            return setResponse.DATABASE_ERROR({ message: "Erro buscar suportes!" });
        });

        return results;
    }

    static erroValidate(err) {
        console.error("Erro de validação no Sequelize:", err);

        if (err.name === "SequelizeValidationError") {
            const messages = err.errors.map(e => e.message);
            return setResponse.SCHEMA_SEQUELIZE({ message: messages.join("; ") });
        }

        return setResponse.DATABASE_ERROR({ message: "Erro ao processar operação no banco", details: err.message });
    }

    static async getOneNotRes(cod) {
        const [results] = await executarQuery(`SELECT * FROM  VW_SUPORTE_GERAL WHERE suporteCodigo = '${cod}'`).catch(() => {
            return setResponse.DATABASE_ERROR({ message: "Erro buscar suportes!" });
        });

        return results;
    }

    static async createNotRes(suporte) {
        const resultsUser = await onda_suporte
            .metodo()
            .create(suporte)
            .catch((err) => {
                return setResponse.SCHEMA_SEQUELIZE(err);
            });

        if (resultsUser.length === 0) {
            return setResponse.WARNING({ message: "Não foi possivel cadastrar suporte!" });
        }

        const newSuporte = await onda_suporte.getOneNotRes(resultsUser?.suporteCodigo);

        return newSuporte;
    }

    static async patchNotRes(suporte, cod) {
        const dados = suporte;
        delete dados.suporteCodigo;
        delete dados.suporteImobCod;
        delete dados.suporteDataAbertura;

        const model = onda_suporte.metodo();

        const results = await model
            .update(dados, { where: { suporteCodigo: cod } })
            .catch((err) => {
                return onda_suporte.erroValidate(err); // Aqui funciona, pois `onda_suporte` ainda é a classe
            });

        const newSuporte = await onda_suporte.getOneNotRes(cod);

        if (results[0] == 0) {
            return setResponse.WARNING({ message: "Sem atualizações para salvar!", results: newSuporte });
        }

        return newSuporte;
    }

};

export default onda_suporte;
