//BIBLIOTECAS
import yup from "yup";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//HELPERS
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import apiProcobFinanceira from "../../../helpers/api/procob/api-procob-financeira.js";
import apiSerpro from "../../../helpers/api/serpro/api-serpro.js";
//BANCO DE DADOS
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
//SERVICES
import servicesPublicQuery from "../../services/public/query/servicesPublicQuery.js";
//WEBSOCKET
import webSocketClient from "../../../helpers/response/web-socket-client.js";
//UTILS
import utilsFormdatar from "../../utils/formatar/formatar.js";
//MODELS
import onda_arquivos_sistema from "../../models/mongoose/onda_arquivos_sistema.js";
import onda_helpers from "../../models/public/onda_helpers.js";
import servicesUsersQuery from "../../services/users/query/servicesUsersQuery.js";

const controllerPublic = class controllerPublic {
    static async status(req, res) {
        try {
            const query = `
                SELECT *  FROM onda_status
                ORDER BY onda_status_descricao  ASC
            `;

            const results = await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
            });

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async followup(req, res) {
        try {
            const codigo = req?.params?.cod;
            if (!codigo) {
                return setResponse.WARNING({message: "Código não enviado"});
            }
            const query = `
                SELECT * FROM VW_FOLLOWUP
                WHERE followupMatrix = '${codigo}'
            `;
            const results = await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar follow-up!"});
            });

            return setResponse.SUCCESS({results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async arquivo(req, res) {
        try {
            const codigo = req?.params?.cod;

            if (!codigo) {
                return setResponse.WARNING({message: "Código não enviado"});
            }

            const query = `
                SELECT 
                    OD.*,
                    OS.onda_status_descricao
                FROM onda_docs AS OD
                JOIN onda_status AS OS ON OD.onda_docs_status = OS.onda_status_id
                WHERE onda_docs_matrix = '${codigo}'
            `;
            const results = await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar follow-up!"});
            });

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async locatario(req, res) {
        try {
            const cpfBody = req?.params?.cpfcnpj;

            const cpfCnpj = cpfBody.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s/g, "");

            if (!cpfCnpj) {
                return setResponse.WARNING({message: "CPF/CNPF inválido!"});
            }

            const query = `
                SELECT 
                    L.locatarioNome,
                    L.locatarioCelular,
                    L.locatarioUf,
                    L.locatarioEmail
                FROM VW_LOCATARIO AS L
                WHERE locatarioCpfCnpj = '${cpfCnpj}'
                LIMIT 1 
            `;

            const resultsByDb = await executarQuery(query).catch((er) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar locatário!"});
            });

            if (resultsByDb.length > 0) {
                return setResponse.SUCCESS({results: resultsByDb});
            }

            // const consulta2 = await apiProcobFinanceira.consultaFamiliaresPeloCpf(cpfCnpj);
            const consulta2 = await apiSerpro.consultaPeloCpf({cpfCnpj, res});

            const locatarioNome = consulta2?.nome || consulta2?.nomeEmpresarial || "";
            const locatarioSituacao = consulta2?.situacao?.descricao || consulta2?.situacaoCadastral?.codigo || "";
            // const locatarioNome = consulta2?.content.nome.conteudo.nome || "";
            // const locatarioEmail = consulta2?.content?.emails?.conteudo?.[0]?.email || "";
            // const locatarioCelularDdd1 = consulta2?.content?.contato_preferencial?.conteudo?.telefone_celular?.ddd || "";
            // const locatarioCelular1 = consulta2?.content?.contato_preferencial?.conteudo?.telefone_celular?.telefone || "";
            // const locatarioCelularDdd2 = consulta2?.content?.pesquisa_telefones?.conteudo?.celular?.[0]?.ddd || "";
            // const locatarioCelular2 = consulta2?.content?.pesquisa_telefones?.conteudo?.celular?.[0]?.telefone || "";

            // const celular1 = () => (locatarioCelular1 && `${locatarioCelularDdd1} ${locatarioCelular1}`) || "";
            // const celular2 = () => (locatarioCelular2 && `${locatarioCelularDdd2} ${locatarioCelular2}`) || "";

            const resultsByApi = [
                {
                    locatarioNome: utilsFormdatar.formatarNomeLocatario(locatarioNome),
                    locatarioSituacao: locatarioSituacao,
                    locatarioCelular: "",
                    locatarioUf: "",
                    locatarioEmail: "",
                },
            ];
            if (locatarioNome?.length > 0) {
                return setResponse.SUCCESS({results: resultsByApi, res: res});
            }

            return setResponse.WARNING({message: "CPF/CNPJ não encontrado!"});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarFollow(req, res) {
        try {
            const {cod, event, codImobiliaria, codColaborador, token} = req?.body;

            if (!cod || !event || !token) {
                return setResponse.WARNING({message: "Dados inválidos!"});
            }

            const query = `
                INSERT INTO onda_followup (
                    onda_followup_matrix, 
                    onda_followup_event, 
                    onda_followup_date, 
                    onda_followup_user,
                    onda_followup_imob_matrix,
                    onda_followup_colab_matrix
                )
                  VALUES (
                    '${cod}', 
                    '${event}', 
                    '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}', 
                    '${token?.id || token?.onda_imob_id}',
                    '${codImobiliaria || ""}',
                    '${codColaborador || ""}'
                );
            `;

            await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar follow-up!"});
            });

            return setResponse.SUCCESS({message: "Follow-up enviado com sucesso!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getAllUsers(req, res) {
        const query = await executarQuery(`
            SELECT * FROM VW_ALL_USERS
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar usuários!"});
        });

        const usuarios = new Object({
            executivos: query.filter((item) => item?.onda_helpers_id == 176),
            imobiliarias: query.filter((item) => item?.onda_helpers_id == 200),
            fornecedor: query.filter((item) => item?.onda_helpers_id == 201),
            parceiros: query.filter((item) => item?.onda_helpers_id == 202),
            colaboradores: query.filter((item) => item?.onda_helpers_id == 204),
            locatarios: query.filter((item) => item?.onda_helpers_id == 203),
        });

        return setResponse.SUCCESS({message: "Sucesso ao buscar todos os usuários!", results: usuarios, res: res});
    }

    static async getHelpers(req, res) {
        try {
            const helpers = await onda_helpers.getAll(req, res);
            return setResponse.SUCCESS({message: "Sucesso ao buscar dados do helpers", results: helpers, res: res});
        } catch (error) {
            return setResponse.DATABASE_ERROR({message: "erro ao buscar dados do helpers"});
        }
    }
    static async updateHelpers(req, res) {
        try {
            const dadosBody = req?.body;

            const helpers = await onda_helpers.putOndaHelpers({dadosBody: dadosBody});

            return setResponse.SUCCESS({message: "Sucesso ao atualizar dados do helpers", results: helpers, res: res});
        } catch (error) {
            return setResponse.DATABASE_ERROR({message: "erro ao atualizar dados do helpers"});
        }
    }

    static async getSummaryWebSocket(req, res) {
        try {
            const ws = new webSocketClient();
            const infoClients = await ws.clientsInfo();

            return setResponse.SUCCESS({message: "Sucesso ao buscar ws!", results: infoClients, res: res});
            //return setResponse.WARNING({message: "Sucesso ao buscar ws!", results: infoClients, res: res});
            // teste DEPLOY
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarLogVisualizacaoPortal(req, res) {
        try {
            const arrayIds = await onda_helpers.buscarArrayIdHelpersStatus();
            const {token, log} = req?.body;
            const {matrix} = req?.params;

            const schemaDadosBody = yup.object().shape({
                matrix: yup.string().required("Matrix é obrigatório!").default(matrix),
                evento: yup.string().required(),
                tipoId: yup
                    .number()
                    .required()
                    .nullable()
                    .default(249)
                    .test("", `log.tipoId deve ser: ${arrayIds?.helpers?.ondaLogVisualizacao}!`, (value) => {
                        return arrayIds?.helpers?.ondaLogVisualizacao?.includes(value);
                    }),
                ip: yup.string().nullable().default(null),
                navegador: yup.string().nullable().default(""),
                localizacaoLongitute: yup.string().nullable().default(""),
                localizacaoLatitude: yup.string().nullable().default(""),
            });

            const dadosBody = await yupSchemaValidate(schemaDadosBody, {...log}, {abortEarly: false});

            const userName = token?.onda_imob_nome || token?.onda_user_username || token?.onda_colaborador_name || token?.nome;
            const query = `
                INSERT INTO onda_log_visualizacao (
                    onda_log_visualizacao_matrix, 
                    onda_log_visualizacao_user_tipo,
                    onda_log_visualizacao_user_nome,
                    onda_log_visualizacao_evento,
                    onda_log_visualizacao_tipo_id,
                    onda_log_visualizacao_ip,
                    onda_log_visualizacao_navegador,
                    onda_log_visualizacao_localizacao_latitude,
                    onda_log_visualizacao_localizacao_longitude,
                    onda_log_visualizacao_data
                ) VALUES (
                    '${dadosBody?.matrix}',
                    '${String(token?.type_user)?.toLowerCase()}',
                    '${String(userName)?.toLowerCase()}',
                    '${String(dadosBody?.evento)?.toLowerCase()}',
                    '${String(dadosBody?.tipoId)?.toLowerCase()}',
                    '${String(dadosBody?.ip)?.toLowerCase()}',
                    '${String(dadosBody?.navegador)?.toLowerCase()}',
                    '${String(dadosBody?.localizacaoLatitude)?.toLowerCase()}',
                    '${String(dadosBody?.localizacaoLongitute)?.toLowerCase()}',
                    '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}'
                )
            `;

            await executarQuery(query).catch((e) => {
                return setResponse.WARNING({message: "Erro ao cadastrar log do click no front!"});
            });

            return setResponse.SUCCESS({message: "Sucesso ao buscar ws!", results: [], res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarLogVisualizacaoPortal(req, res) {
        try {
            const {matrix} = req?.params;

            const schema = yup.object().shape({matrix: yup.string()});
            const dadosBody = await yupSchemaValidate(schema, {matrix: matrix}, {abortEarly: false});

            const query = `
                SELECT 
                    *
                FROM VW_LOG_VISUALIZACAO 
                WHERE matrix = '${dadosBody?.matrix}'
            `;

            const [logClick] = await executarQuery(query).catch((e) => {
                return setResponse.WARNING({message: "Erro ao bucar log lick!"});
            });

            const results = {
                logClick: logClick,
            };

            return setResponse.SUCCESS({message: "Sucesso ao buscar log click!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarIdValueTodasTabelasAutoComplete(req, res) {
        try {
            const {tabelas} = req?.body;

            const resultados = {};

            await Promise.all([onda_user(), onda_fornecedor(), onda_imob(), onda_parceiro(), onda_executivo(), onda_tipopagamento(), onda_plataforma()]);

            async function onda_user() {
                if (tabelas?.includes("onda_user")) {
                    const query = `
                        SELECT 
                            onda_user_id as id,
                            onda_user_username as value
                        FROM onda_user
                    `;
                    const result = await executarQuery(query).catch(() => {
                        return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda_user"});
                    });

                    resultados.onda_user = result;
                }
            }

            async function onda_parceiro() {
                if (tabelas?.includes("onda_parceiro")) {
                    const query = `
                        SELECT 
                            onda_parceiro_id as id,
                            onda_parceiro_nome as value
                        FROM onda_parceiro
                    `;
                    const result = await executarQuery(query).catch(() => {
                        return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda_user"});
                    });

                    resultados.onda_parceiro = result;
                }
            }

            async function onda_executivo() {
                if (tabelas?.includes("onda_executivo")) {
                    const query = `
                        SELECT 
                            onda_executivo_id as id,
                            onda_executivo_nome as value
                        FROM onda_executivo
                    `;
                    const result = await executarQuery(query).catch(() => {
                        return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda_user"});
                    });

                    resultados.onda_executivo = result;
                }
            }

            async function onda_fornecedor() {
                if (tabelas?.includes("onda_fornecedor")) {
                    const query = `
                        SELECT 
                            onda_fornecedor_id as id,
                            onda_fornecedor_razao as value
                        FROM onda_fornecedor
                    `;
                    const result = await executarQuery(query).catch(() => {
                        return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda_user"});
                    });

                    resultados.onda_fornecedor = result;
                }
            }

            async function onda_tipopagamento() {
                if (tabelas?.includes("onda_tipopagamento")) {
                    const query = `
                        SELECT 
                            onda_tipopagamento_id as id,
                            onda_tipopagamento_descricao as value
                        FROM onda_tipopagamento
                    `;
                    const result = await executarQuery(query).catch(() => {
                        return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda_tipopagamento"});
                    });

                    resultados.onda_tipopagamento = result;
                }
            }

            async function onda_plataforma() {
                if (tabelas?.includes("onda_plataforma")) {
                    const query = `
                        SELECT 
                            idonda_plataforma_id as id,
                            onda_plataforma_desc as value
                        FROM onda_plataforma
                    `;
                    const result = await executarQuery(query).catch(() => {
                        return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda_plataforma"});
                    });

                    resultados.onda_plataforma = result;
                }
            }

            async function onda_imob() {
                if (tabelas?.includes("onda_imob")) {
                    const query = `
                        SELECT 
                            onda_imob_id as id,
                            onda_imob_nome as value
                        FROM onda_imob
                    `;
                    const result = await executarQuery(query).catch(() => {
                        return setResponse.DATABASE_ERROR({message: "Erro ao buscar onda_user"});
                    });

                    resultados.onda_imob = result;
                }
            }

            return setResponse.SUCCESS({message: "Sucesso ao buscar valores!", results: resultados, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarArquivosSistema(req, res) {
        try {
            const data = req?.body;

            const newArquivo = await onda_arquivos_sistema.create({data: data});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar arquivos para usar no sistema!", results: newArquivo, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarArquivosSistema(req, res) {
        try {
            const newArquivo = await onda_arquivos_sistema.getAll();

            return setResponse.SUCCESS({message: "Sucesso ao buscar arquivos para usar no sistema!", results: newArquivo, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarArquivosSistema(req, res) {
        try {
            const data = req?.body;

            const newArquivo = await onda_arquivos_sistema.update({_id: data?._id, data: data});

            return setResponse.SUCCESS({message: "Sucesso ao atualizar arquivos para usar no sistema!", results: newArquivo, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarSetores(req, res) {
        try {
            const {onda_helpers_setor} = req?.query;

            const resultados = await servicesPublicQuery.buscar_onda_helpers_filtro({onda_helpers_setor: onda_helpers_setor});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar setor do executivo.", results: resultados, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerPublic;
