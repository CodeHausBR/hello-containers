import BigNumber from "bignumber.js";
//BIBLIOTECAS
import yup from "yup";
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//BANCO DE DADOS
import VW_CARTAFIANCA_GERAL from "../../models/mongoose/VW_CARTAFIANCA_GERAL.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
//SERVICES
import servicesComercialQuery from "../../services/comercial/query/servicesComercialQuery.js";
import servicesComercialValidate from "../../services/comercial/validate/servicesComercialValidate.js";

//WEBSOCKET
import webSocketClient from "../../../helpers/response/web-socket-client.js";

const controllerComercial = class controllerComercial {
    static async status(req, res) {
        try {
            const ws = new webSocketClient();

            const arrayStatus = await servicesComercialQuery.buscarArrayStatusComercial_query();

            const dadosValidados = await servicesComercialValidate.atualizarStatusComercial_validate(req?.params, arrayStatus);

            await servicesComercialQuery.atualizarStatusComercial_query(dadosValidados);

            const cfAtualizada = await onda_cartafianca.getOneNotResView(dadosValidados?.cod);

            ws.enviarParaEspecificos({ws: {item: cfAtualizada, setor: "comercial", follow: {on: false, message: {}}, event: "update"}});

            await VW_CARTAFIANCA_GERAL.post(cfAtualizada);

            return setResponse.SUCCESS({message: "Status comercial atualizado com sucesso!", res: res, results: cfAtualizada});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async contratos(req, res) {
        try {
            const dadosValidados = await servicesComercialValidate.contratos_validate(req?.params);
            const {token} = req?.body;

            const query = `
                    SELECT 
                        VW.id,
                        DATE_FORMAT(VW.criacao, '%d/%m/%Y %H:%i') AS criacao,
                        VW.valorCartaFianca,
                        VW.contrato,
                        VW.locatario,
                        VW.cpf,
                        VW.valoraluguel,
                        VW.imobiliaria,
                        VW.imobiliariaCod,
                        VW.Cidade,
                        VW.valorprazo,
                        VW.statusanalise,
                        VW.statuscomercial,
                        VW.statusfinanceiro,
                        VW.statusVistoriaCod,
                        VW.statusFinanceiroCod,
                        VW.statusComercialCod,
                        VW.statusAnaliseCod,
                        VW.tipopagamento,
                        VW.consultor,
                        VW.executivo,
                        VW.parceiro,
                        VW.plano,
                        VW.valoradesao,
                        VW.vistoria,
                        VW.pintura,
                        VW.statusfinanceiro,
                        VW.statusvistoria,
                        VW.statusjuridico,
                        VW.dataaprovacao,
                        VW.datarenovacao,
                        VW.desconto,
                        VW.valordesconto,
                        VW.previsaoPagamento,
                        VW.cfFonte,
                        DATE_FORMAT(VW.dataPagamento, '%d/%m/%Y %H:%i') AS dataPagamento,
                        VW.payTotalPago,
                        VW.limpeza,
                        VW.renovacao
                    FROM VW_CARTAFIANCA_GERAL AS VW
                    ${gerarFiltroConsulta(dadosValidados)}
                    ${setWhereColaboradorAndImobiliaria()}
                `;

            const results = await executarQuery(query).catch((errr) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Sem contratos cadastrados!"});
            }

            function gerarFiltroConsulta(dadosValidados) {
                if (dadosValidados?.where == "last90Contratos") {
                    return `WHERE criacao >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)`;
                }
                if (dadosValidados?.where == "pertoRenovacao") {
                    return `
                        WHERE contratoVenci <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
                        AND statusAnaliseCod NOT IN (110, 111)
                        AND statusComercialCod IN (506, 999, 998)
                    
                    ;`;
                }
                if (dadosValidados?.where == "allContratos") {
                    return "";
                }

                return "";
            }

            function setWhereColaboradorAndImobiliaria() {
                if (token?.type_user.toUpperCase() === "IMOB_ADM") {
                    return `${generateClausula()} imobiliariaCod = '${token?.onda_imob_id}'`;
                } else if (token?.type_user.toUpperCase() === "COLABORADOR_IMOB") {
                    return `${generateClausula()} colabImobId = '${token?.onda_colaborador_id}'`;
                } else if (token?.type_user.toUpperCase() === "ONDA_PARCEIRO") {
                    return `${generateClausula()} parceiroCod = ${token?.onda_user_id}`;
                } else if (token?.type_user.toUpperCase() === "ONDA_EXECUTIVO") {
                    return `${generateClausula()} executivoCod = ${token?.onda_user_id}`;
                } else if (token?.type_user.toUpperCase() === "ONDA_USER") {
                    return "";
                } else {
                    return "";
                }
            }

            function generateClausula() {
                if (dadosValidados?.where == "allContratos") {
                    return "WHERE";
                } else {
                    return "AND";
                }
            }

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async contratosRenovacao(req, res) {
        try {
            const {token} = req?.body;

            const query = `
                    SELECT 
                        VW.id,
                        DATE_FORMAT(VW.criacao, '%d/%m/%Y %H:%i') AS criacao,
                        VW.valorCartaFianca,
                        VW.contrato,
                        VW.locatario,
                        VW.cpf,
                        VW.valoraluguel,
                        VW.imobiliaria,
                        VW.imobiliariaCod,
                        VW.Cidade,
                        VW.valorprazo,
                        VW.statusanalise,
                        VW.statuscomercial,
                        VW.statusfinanceiro,
                        VW.statusVistoriaCod,
                        VW.statusFinanceiroCod,
                        VW.statusComercialCod,
                        VW.statusAnaliseCod,
                        VW.tipopagamento,
                        VW.consultor,
                        VW.executivo,
                        VW.parceiro,
                        VW.plano,
                        VW.valoradesao,
                        VW.vistoria,
                        VW.pintura,
                        VW.statusfinanceiro,
                        VW.statusvistoria,
                        VW.statusjuridico,
                        VW.dataaprovacao,
                        VW.datarenovacao,
                        VW.desconto,
                        VW.valordesconto,
                        VW.previsaoPagamento,
                        VW.cfFonte,
                        DATE_FORMAT(VW.dataPagamento, '%d/%m/%Y %H:%i') AS dataPagamento,
                        VW.payTotalPago,
                        VW.limpeza,
                        VW.contratoAnterior,
                        VW.contratoPosterior,
                        VW.renovacao
                    FROM VW_CARTAFIANCA_GERAL AS VW
                    WHERE 
                        VW.renovacao = 1
                    ${setWhereColaboradorAndImobiliaria()}
                `;

            const results = await executarQuery(query).catch((errr) => {
                console.log(errr);
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Sem contratos cadastrados!"});
            }

            function setWhereColaboradorAndImobiliaria() {
                if (token?.type_user.toUpperCase() === "IMOB_ADM") {
                    return `AND imobiliariaCod = '${token?.onda_imob_id}'`;
                } else if (token?.type_user.toUpperCase() === "COLABORADOR_IMOB") {
                    return `AND colabImobId = '${token?.onda_colaborador_id}'`;
                } else if (token?.type_user.toUpperCase() === "ONDA_PARCEIRO") {
                    return `AND parceiroCod = ${token?.onda_user_id}`;
                } else if (token?.type_user.toUpperCase() === "ONDA_EXECUTIVO") {
                    return `AND executivoCod = ${token?.onda_user_id}`;
                } else if (token?.type_user.toUpperCase() === "ONDA_USER") {
                    return "";
                } else {
                    return "";
                }
            }

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async contratosSimplificado(req, res) {
        try {
            const {cod} = req.params;

            if (!cod) {
                return setResponse.WARNING({message: "Código da imobiliária não fornecido!"});
            }
            const query = `
                    SELECT 
                            VW.id,
                            VW.contrato,
                            VW.locatario,
                            VW.cpf,
                            VW.imobCodigo,
                            VW.imovelCod,
                            VW.colabCod
                    FROM VW_CARTAFIANCA_GERAL AS VW
                    WHERE  VW.imobCodigo = '${cod}'
                    `;

            const results = await executarQuery(query).catch((errr) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Sem contratos cadastrados!"});
            }

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
    static async contratosFiltro(req, res) {
        try {
            const dadosValidados = await servicesComercialValidate.contratos_validate(req?.params);
            const {filtro, fechados} = req?.params;
            const {token} = req?.body;

            const query = `
                    SELECT 
                        VW.id,
                        DATE_FORMAT(VW.criacao, '%d/%m/%Y %H:%i') AS criacao,
                        VW.valorCartaFianca,
                        VW.contrato,
                        VW.locatario,
                        VW.cpf,
                        VW.valoraluguel,
                        VW.imobiliaria,
                        VW.imobiliariaCod,
                        VW.Cidade,
                        VW.valorprazo,
                        VW.statusanalise,
                        VW.statuscomercial,
                        VW.statusfinanceiro,
                        VW.statusVistoriaCod,
                        VW.statusFinanceiroCod,
                        VW.statusComercialCod,
                        VW.statusAnaliseCod,
                        VW.tipopagamento,
                        VW.consultor,
                        VW.executivo,
                        VW.parceiro,
                        VW.plano,
                        VW.vistoria,
                        VW.pintura,
                        VW.statusfinanceiro,
                        VW.statusvistoria,
                        VW.statusjuridico,
                        VW.dataaprovacao,
                        VW.datarenovacao,
                        VW.desconto,
                        VW.valordesconto,
                        VW.previsaoPagamento,
                        VW.cfFonte,
                        DATE_FORMAT(VW.dataPagamento, '%d/%m/%Y %H:%i') AS dataPagamento,
                        VW.payTotalPago,
                        VW.limpeza,
                        VW.renovacao
                    FROM VW_CARTAFIANCA_GERAL AS VW
                    ${gerarFiltroConsulta(dadosValidados)}
                    ${setWhereColaboradorAndImobiliaria()}
                `;

            const results = await executarQuery(query).catch((errr) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Sem contratos cadastrados!"});
            }

            function gerarFiltroConsulta(dadosValidados) {
                if (dadosValidados?.where == "allContratos") {
                    return generateFiltroUserWhere();
                }

                if (dadosValidados?.where == "last90Contratos") {
                    return `WHERE criacao >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
                            ${generateFiltroUser()}
                        `;
                }
                //WHERE contratoVenci <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
                //AND VW.statusComercialCod IN (506, 999, 998)
                if (dadosValidados?.where == "pertoRenovacao") {
                    return `
                        WHERE DATE_ADD(VW.dataPagamento, INTERVAL 9 MONTH) < CURDATE()
                        AND VW.statusAnaliseCod != 110
                        AND VW.statusAnaliseCod != 111
                        ${generateFiltroUser()}
                    
                    ;`;
                }

                return "";
            }

            function generateFiltroUser() {
                if (filtro == "true") {
                    return `AND consultorCod = '${token?.id}'`;
                }
                return ``;
            }

            function generateFiltroUserWhere() {
                if (filtro == "true") {
                    return `WHERE consultorCod = '${token?.id}'`;
                }
                return ``;
            }

            function generateFiltroFechadosWhere() {
                if (fechados == "true") {
                    return `WHERE statusFinanceiroCod = '${fechados?.id}'`;
                }
                return ``;
            }
            function generateFiltroFechados() {
                if (filtro == "true") {
                    return `WHERE statusFinanceiroCod = '${fechados?.id}'`;
                }
                return ``;
            }

            function setWhereColaboradorAndImobiliaria() {
                if (token?.type_user.toUpperCase() === "IMOB_ADM") {
                    return `${generateClausula()} imobiliariaCod = '${token?.onda_imob_id}'`;
                } else if (token?.type_user.toUpperCase() === "COLABORADOR_IMOB") {
                    return `${generateClausula()} colabImobId = '${token?.onda_colaborador_id}'`;
                } else if (token?.type_user.toUpperCase() === "ONDA_PARCEIRO") {
                    return `${generateClausula()} parceiroCod = ${token?.onda_user_id}`;
                } else if (token?.type_user.toUpperCase() === "ONDA_EXECUTIVO") {
                    return `${generateClausula()} executivoCod = ${token?.onda_user_id}`;
                } else if (token?.type_user.toUpperCase() === "ONDA_USER") {
                    return "";
                } else {
                    return "";
                }
            }

            function generateClausula() {
                if (dadosValidados?.where == "allContratos") {
                    return "WHERE";
                } else {
                    return "AND";
                }
            }

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async contrato(req, res) {
        try {
            const {cod} = req?.params;
            const taxas = await onda_cartafianca.buscarIdDasTaxasQueEstaCartaFiancaUsa(cod);
            const query = `
                SELECT 
                    *,
                    ${taxas.onda_config_porcentagem_pix_mais_boletos} AS porcentagemPagamento,
                    ${taxas.onda_config_porcentagem_pix_mais_boletos} AS porcentagemPagamentoNoBoleto,
                    ${taxas.onda_config_porcentagem_pix_mais_cartao_credito} AS porcentagemPagamentoNoCredito
                FROM VW_CARTAFIANCA_GERAL AS VW
                WHERE VW.contrato = '${cod}'
            `;

            const [results] = await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contrato!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Contrato não encontrado!"});
            }

            if (results.tipopagamentoID == 6) {
                results.tipopagamento = `Boleto – ${Number(taxas.onda_config_porcentagem_pix_mais_boletos) * 100}%` + `${results.parcelas}x s/juros`;
            }

            if (results.tipopagamentoID == 8) {
                // Calcula o valor com precisão usando BigNumber
                const porcentagem = new BigNumber(1).minus(new BigNumber(taxas.onda_config_porcentagem_pix_mais_cartao_credito));
                const valorAvista = new BigNumber(results?.valorAvistaSemAdesaoPagarme || 0);
                const restantePagar = porcentagem.times(valorAvista);
                results.restantePagar = restantePagar.integerValue(BigNumber.ROUND_FLOOR).toNumber();

                results.tipopagamento = `Cartão de Crédito – ${Number(taxas.onda_config_porcentagem_pix_mais_cartao_credito) * 100}%` + `${results.parcelas}x s/juros`;
            }

            return setResponse.SUCCESS({results: [results], res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async imobiliarias(req, res) {
        try {
            const query = `
                SELECT 
                    IG.*,
                    COUNT(CF.onda_cartafianca_imobiliaria) AS num_analises

                FROM VW_IMOB AS IG 
                LEFT JOIN onda_cartafianca AS CF ON IG.id = CF.onda_cartafianca_imobiliaria
                WHERE imobCpfCnpj IS NOT NULL
                GROUP BY IG.imobNome
                ORDER BY num_analises DESC
            `;

            const results = await executarQuery(query).catch((error) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliárias!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Imobiliárias não encontradas!"});
            }

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async parceiros(req, res) {
        try {
            const query = `SELECT * FROM VW_PARCEIRO`;
            const results = await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar parceiros!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Parceiros não encontrados!"});
            }

            return setResponse.SUCCESS({results: results});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarAnalisesImobiliariaApi(req, res) {
        try {
            const {token} = req?.body;

            const query = `        
            SELECT 
                cf.onda_cartafianca_id AS id,
                cf.onda_cartafianca_config_taxa_id AS configTaxaId,
                cf.onda_cartafianca_desconto AS desconto,
                cf.onda_cartafianca_valordesconto AS valordesconto,
                cf.onda_cartafianca_valoradesao AS valoradesao,
                ctr.onda_contratos_contrato AS contrato,
                ctr.onda_contratos_vencimento AS contratoVenci,     
                ctr.onda_contratos_ativo AS contratoAtivo,
                loc.onda_locatario_nome AS locatario,
                loc.onda_locatario_cnpjcpf AS cpf,
                loc.onda_locatario_celular AS celular,
                loc.onda_locatario_email AS locatarioEmail,
                loc.onda_locatario_copart1renda AS copart1Renda,
                loc.onda_locatario_copart2renda AS copart2Renda,
                cf.onda_cartafianca_valoraluguel AS valoraluguel,
                cf.onda_cartafianca_valoraprazo AS valorprazo,
                cf.onda_cartafianca_parcela AS parcelas,
                cf.onda_cartafianca_valorparcela AS valorparcelas,
                cf.onda_cartafianca_valoravista AS valorvista,
                CASE
                    WHEN cf.tipopagamentoID = 6 THEN cf.valorvista
                    WHEN cf.tipopagamentoID = 9 THEN cf.valorprazo
                    WHEN cf.tipopagamentoID = 8 THEN cf.valorvista
                    WHEN cf.tipopagamentoID = 4 THEN cf.valorvista
                    WHEN cf.parcelas > 1 THEN cf.valorprazo
                    ELSE cf.valorvista
                END AS valorCartaFianca,
                
                CASE
                    WHEN cf.tipopagamentoID = 6 THEN FLOOR(cf.valorvista * 100)
                    WHEN cf.tipopagamentoID = 9 THEN FLOOR(cf.valorprazo * 100)
                    WHEN cf.tipopagamentoID = 8 THEN FLOOR(cf.valorvista * 100)
                    WHEN cf.tipopagamentoID = 4 THEN FLOOR(cf.valorvista * 100)
                    WHEN cf.parcelas > 1 THEN FLOOR(cf.valorprazo * 100)
                    ELSE FLOOR(cf.valorvista * 100)
                END AS valorCartaFiancaPagarme,
                cf.onda_cartafianca_cobertura AS plano,
                cf.onda_cartafianca_criacao AS criacao,
                cf.onda_cartafianca_fonte AS cfFonte,
                loc.onda_locatario_copart1 AS coparticipante1,
                loc.onda_locatario_copart1cpf AS cpfcoparticipante1,
                loc.onda_locatario_copart2 AS coparticipante2,
                loc.onda_locatario_copart2cpf AS cpfcoparticipante2,
                loc.onda_locatario_renda AS locatarioRenda,
                st1.onda_status_descricao AS statuscomercial,
                st2.onda_status_descricao AS statusanalise,
                st3.onda_status_descricao AS statusfinanceiro

            FROM
                ((((((((((onda_cartafianca cf
                LEFT JOIN onda_locatario loc ON (loc.onda_locatario_cnpjcpf = cf.onda_cartafianca_locatario))
                LEFT JOIN onda_status st1 ON (cf.onda_cartafianca_status_comercial = st1.onda_status_id))
                LEFT JOIN onda_status st2 ON (cf.onda_cartafianca_status_analise = st2.onda_status_id))
                LEFT JOIN onda_status st3 ON (cf.onda_cartafianca_status_financeiro = st3.onda_status_id))
                LEFT JOIN onda_imob imob ON (cf.onda_cartafianca_imobiliaria = imob.onda_imob_id))
                LEFT JOIN onda_executivo exe ON (imob.onda_imob_executivo = exe.onda_executivo_id))
                LEFT JOIN onda_parceiro par ON (imob.onda_imob_parceiro = par.onda_parceiro_id))
                LEFT JOIN onda_user us ON (cf.onda_cartafianca_consultor = us.onda_user_id))
                LEFT JOIN onda_contratos ctr ON (cf.onda_cartafianca_id = ctr.onda_contratos_id))
                LEFT JOIN onda_imovel imov ON (cf.onda_cartafianca_imovel_id = imov.onda_imovel_id))
            WHERE cf.onda_cartafianca_imobiliaria = '${token?.onda_imob_id}'
            ORDER BY cf.onda_cartafianca_criacao DESC
          `;

            const results = await executarQuery(query).catch((errr) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos imobiliária!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Sem contratos cadastrados!"});
            }

            return setResponse.SUCCESS({results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarArrayIdsAnalisesImobiliariaApi(req, res) {
        try {
            const {token, data} = req?.body;

            const schema = yup.object().shape({
                array_ids: yup.array().of(yup.number().required()).min(1, "array_ids deve ter pelo menos um item").required("array_ids é um campo obrigatório"),
            });

            const dadosValidados = await yupSchemaValidate(schema, data, {abortEarly: false});

            const query = `        
            SELECT 
                cf.onda_cartafianca_id AS id,
                cf.onda_cartafianca_config_taxa_id AS configTaxaId,
                cf.onda_cartafianca_desconto AS desconto,
                cf.onda_cartafianca_valordesconto AS valordesconto,
                cf.onda_cartafianca_valoradesao AS valoradesao,
                ctr.onda_contratos_contrato AS contrato,
                ctr.onda_contratos_vencimento AS contratoVenci,     
                ctr.onda_contratos_ativo AS contratoAtivo,
                loc.onda_locatario_nome AS locatario,
                loc.onda_locatario_cnpjcpf AS cpf,
                loc.onda_locatario_celular AS celular,
                loc.onda_locatario_email AS locatarioEmail,
                loc.onda_locatario_copart1renda AS copart1Renda,
                loc.onda_locatario_copart2renda AS copart2Renda,
                cf.onda_cartafianca_valoraluguel AS valoraluguel,
                cf.onda_cartafianca_valoraprazo AS valorprazo,
                cf.onda_cartafianca_parcela AS parcelas,
                cf.onda_cartafianca_valorparcela AS valorparcelas,
                cf.onda_cartafianca_valoravista AS valorvista,
                CASE
                    WHEN cf.tipopagamentoID = 6 THEN cf.valorvista
                    WHEN cf.tipopagamentoID = 9 THEN cf.valorprazo
                    WHEN cf.tipopagamentoID = 8 THEN cf.valorvista
                    WHEN cf.tipopagamentoID = 4 THEN cf.valorvista
                    WHEN cf.parcelas > 1 THEN cf.valorprazo
                    ELSE cf.valorvista
                END AS valorCartaFianca,
                
                CASE
                    WHEN cf.tipopagamentoID = 6 THEN FLOOR(cf.valorvista * 100)
                    WHEN cf.tipopagamentoID = 9 THEN FLOOR(cf.valorprazo * 100)
                    WHEN cf.tipopagamentoID = 8 THEN FLOOR(cf.valorvista * 100)
                    WHEN cf.tipopagamentoID = 4 THEN FLOOR(cf.valorvista * 100)
                    WHEN cf.parcelas > 1 THEN FLOOR(cf.valorprazo * 100)
                    ELSE FLOOR(cf.valorvista * 100)
                END AS valorCartaFiancaPagarme,
                cf.onda_cartafianca_cobertura AS plano,
                cf.onda_cartafianca_criacao AS criacao,
                cf.onda_cartafianca_fonte AS cfFonte,
                loc.onda_locatario_copart1 AS coparticipante1,
                loc.onda_locatario_copart1cpf AS cpfcoparticipante1,
                loc.onda_locatario_copart2 AS coparticipante2,
                loc.onda_locatario_copart2cpf AS cpfcoparticipante2,
                loc.onda_locatario_renda AS locatarioRenda,
                st1.onda_status_descricao AS statuscomercial,
                st2.onda_status_descricao AS statusanalise,
                st3.onda_status_descricao AS statusfinanceiro

            FROM
                ((((((((((onda_cartafianca cf
                LEFT JOIN onda_locatario loc ON (loc.onda_locatario_cnpjcpf = cf.onda_cartafianca_locatario))
                LEFT JOIN onda_status st1 ON (cf.onda_cartafianca_status_comercial = st1.onda_status_id))
                LEFT JOIN onda_status st2 ON (cf.onda_cartafianca_status_analise = st2.onda_status_id))
                LEFT JOIN onda_status st3 ON (cf.onda_cartafianca_status_financeiro = st3.onda_status_id))
                LEFT JOIN onda_imob imob ON (cf.onda_cartafianca_imobiliaria = imob.onda_imob_id))
                LEFT JOIN onda_executivo exe ON (imob.onda_imob_executivo = exe.onda_executivo_id))
                LEFT JOIN onda_parceiro par ON (imob.onda_imob_parceiro = par.onda_parceiro_id))
                LEFT JOIN onda_user us ON (cf.onda_cartafianca_consultor = us.onda_user_id))
                LEFT JOIN onda_contratos ctr ON (cf.onda_cartafianca_id = ctr.onda_contratos_id))
                LEFT JOIN onda_imovel imov ON (cf.onda_cartafianca_imovel_id = imov.onda_imovel_id))
            WHERE cf.onda_cartafianca_imobiliaria = '${token?.onda_imob_id}'
            AND cf.onda_cartafianca_id IN (${dadosValidados?.array_ids})
            ORDER BY cf.onda_cartafianca_criacao DESC
          `;

            const results = await executarQuery(query).catch((errr) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos imobiliária!"});
            });

            if (results.length === 0) {
                return setResponse.WARNING({message: "Sem contratos cadastrados!"});
            }

            return setResponse.SUCCESS({results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerComercial;
