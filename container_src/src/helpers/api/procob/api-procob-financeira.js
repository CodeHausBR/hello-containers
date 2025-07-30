//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../geral/yup-schema-validate.js";
import setResponse from "../../response/setResponse.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";
//BANCO DE DADOS
import onda_procob_familiares from "../../../mvc/models/mongoose/onda_procob_familiares.js";
import onda_procob_protestos from "../../../mvc/models/mongoose/onda_procob_protestos.js";

//SERVICES

const apiProcobFinanceira = class apiProcobFinanceira {
    static async start(dadosConsulta) {
        const consulta = await apiProcobFinanceira.consultaCredNetProtestoNacionalPeloCpf(dadosConsulta?.locatario?.locatarioCnpjcpf);

        const valoresDivida = apiProcobFinanceira.gerarResumoDividasPefinRefinProtestoNacional(consulta);

        const gerarPlanosLiberados = await apiProcobFinanceira.verificarSeDividaMaiorQueValorLimiteParaLiberarOsPlanos(valoresDivida, regrasAnalise);

        const results = {
            planosLiberados: gerarPlanosLiberados, // utilizado para mostrar os planos nos formulários do front-end
        };

        return results;
    }

    static async consultaCredNetProtestoNacionalPeloCpf(cpfCnpj) {
        const dadosValidados = await this.validarCpfCnpj(cpfCnpj);

        const newCpfCnpj = dadosValidados?.cpfCnpj;

        const retornarHistoricoBanco = await onda_procob_protestos.getOne({documento: newCpfCnpj});

        if (retornarHistoricoBanco) return retornarHistoricoBanco;

        const deveVirDoFormularioDeRegras = "SIM";

        const data = await fetch(`https://api.procob.com/restricao/v1/R0001/${newCpfCnpj}?protestoNacional=${deveVirDoFormularioDeRegras}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic aGFuYS5nYWJyaWVsYUBvbmRhc2VnLmNvbS5icjoyTlBSOUY=",
            },
        });

        const resultProcob = await data.json();

        if (resultProcob?.code == "000") {
            await onda_procob_protestos.post({data: resultProcob, cpfCnpj: newCpfCnpj});
        }

        return await onda_procob_protestos.getOne({documento: newCpfCnpj});
    }

    static async consultaFamiliaresPeloCpf(cpfCnpj) {
        const dadosValidados = await this.validarCpfCnpj(cpfCnpj);

        const newCpfCnpj = dadosValidados?.cpfCnpj;

        const retornarHistoricoBanco = await onda_procob_familiares.getOne({documento: newCpfCnpj});

        if (retornarHistoricoBanco) return retornarHistoricoBanco;

        const data = await fetch(`https://api.procob.com/consultas/v2/L0001/${newCpfCnpj}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic aGFuYS5nYWJyaWVsYUBvbmRhc2VnLmNvbS5icjoyTlBSOUY=",
            },
        });

        const resultProcob = await data.json();

        if (resultProcob?.code == "000") {
            await onda_procob_familiares.post({data: resultProcob, cpfCnpj: newCpfCnpj});
        }

        return await onda_procob_familiares.getOne({documento: newCpfCnpj});
    }

    static async validarCpfCnpj(cpfCnpj) {
        const cpfRegex = /^\d{11}$/;
        const cnpjRegex = /^\d{14}$/;
        const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        const schema = yup.object().shape({
            cpfCnpj: yup
                .string()
                .required("CPF/CNPJ é obrigatório")
                .test("no-special-chars", "Não são permitidos caracteres especiais no cpf ou cnpj, usar de 106.963.789-69 para: 10696378969", function (value) {
                    return !specialCharRegex.test(cpfCnpj);
                })
                .test("cpf-cnpj", "CPF/CNPJ inválido", function (value) {
                    if (!value) return false;

                    // Remove caracteres não numéricos
                    const cleanValue = value.replace(/\D/g, "");

                    if (cleanValue.length === 11) {
                        return cpfRegex.test(cleanValue);
                    } else if (cleanValue.length === 14) {
                        return cnpjRegex.test(cleanValue);
                    }

                    return false;
                })
                .transform((value) => value.replace(/\D/g, ""))
                .trim(),
        });

        return await yupSchemaValidate(schema, {cpfCnpj: cpfCnpj}, {abortEarly: false});
    }

    static async verificarSeDividaMaiorQueValorLimiteParaLiberarOsPlanos(valoresDivida, regrasAnalise) {
        const valorTotalRefinPefin = Reflect.get(valoresDivida, "valorTotalRefinPefin", Number(0));
        const onda_config_limite_de_divida_por_plano = Reflect.get(regrasAnalise, "onda_config_limite_de_divida_por_plano", Array());

        const planosLiberados = [];
        let virificar_se_planos_estao_cadastrados = false;

        for (const plano of onda_config_limite_de_divida_por_plano) {
            const newPlano = {
                plano: plano?.plano,
                ativa: plano?.ativa,
                divida_minima: plano?.divida_minima,
                divida_maxima: plano?.divida_maxima,
                taxa_a_vista: plano?.taxa_a_vista,
                taxa_a_prazo: plano?.taxa_a_prazo,
            };

            if (newPlano?.ativa == false) {
                planosLiberados.push(newPlano);
            } else {
                virificar_se_planos_estao_cadastrados = true;

                const verificarLimiteDividaMaxima = Number(newPlano?.divida_maxima) - Number(valorTotalRefinPefin) > 0;

                newPlano.ativa = Boolean(verificarLimiteDividaMaxima);

                planosLiberados.push(newPlano);
            }
        }

        if (virificar_se_planos_estao_cadastrados == false) {
            await onda_errors.postNotRes({
                classe: "apiProcobFinanceira",
                statico: "verificarSeDividaMaiorQueValorLimiteParaLiberarOsPlanos",
                funcao: "virificar_se_planos_estao_cadastrados",
                status: "500",
                code: "ERROR_CONSULTA",
                type: "error",
                message: "Não existem planos liberados no formulário da análise!",
            });

            return setResponse.WARNING({message: "Não existem planos liberados no formulário da análise!"});
        }

        return planosLiberados;
    }

    static gerarResumoDividasPefinRefinProtestoNacional(data) {
        // Função auxiliar para acessar propriedades aninhadas com segurança
        const get = (obj, path, defaultValue = null) => {
            return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : defaultValue), obj);
        };

        // Função auxiliar para somar valores com tratamento de erro
        const somarValores = (arr) => {
            if (!Array?.isArray(arr)) return 0;
            return arr?.reduce((sum, item) => {
                const valor = get(item, "valor", "0");
                return sum + setParseFloat(valor);
            }, 0);
        };

        function setParseFloat(valor) {
            return Number(parseFloat(valor.replace(/\./g, "")?.replace(",", ".") || 0));
        }

        const content = get(data, "content", {});

        // Calcular totais de PEFIN e REFIN
        const detalhes = get(content, "pendencias_financeiras.conteudo.detalhes", []);
        const pefin = detalhes.find((d) => String(d?.tipo_anotacao)?.toLocaleUpperCase() === "PEFIN") || {};
        const refin = detalhes.find((d) => String(d?.tipo_anotacao)?.toLocaleUpperCase() === "REFIN") || {};
        const totalPefin = Number(somarValores(get(pefin, "pendencias", [])));
        const totalRefin = Number(somarValores(get(refin, "pendencias", [])));

        const ProtestoNacional = setParseFloat(get(content, "protesto_nacional.conteudo.valor", "0"));
        const protestoNacional = setParseFloat(get(content, "protesto_nacional.conteudo.valor", "0"));
        const valorTotalGeral = Number(totalPefin + totalRefin);

        const totalGeralDividasPefinRefinProtestoNacional = ProtestoNacional + valorTotalGeral;

        // Criar objeto de resumo
        const resumo = {
            valorTotalPefin: Number(totalPefin.toFixed(2)),
            valorTotalRefin: Number(totalRefin.toFixed(2)),
            valorTotalRefinPefin: Number(valorTotalGeral.toFixed(2)),
            protestoNacional: Number(protestoNacional),
            totalGeralDividasPefinRefinProtestoNacional: Number(totalGeralDividasPefinRefinProtestoNacional),
        };

        return resumo;
    }

    static async regraParaGerarFormularioDosPlanosNoFrontendComBaseNoValorDaDivida() {}
};

export default apiProcobFinanceira;

const regrasAnalise = {
    onda_config_limite_de_divida_por_plano: [
        {
            id: 1,
            plano: "Basic",
            ativa: true,
            divida_minima: 0,
            divida_maxima: 100,
            taxa_a_vista: 0.8,
            taxa_a_prazo: 0.1,
        },
        {
            id: 1,
            plano: "Standart",
            ativa: true,
            divida_minima: 3000,
            divida_maxima: 8000,
            taxa_a_vista: 0.8,
            taxa_a_prazo: 0.1,
        },
        {
            id: 1,
            plano: "Premium",
            ativa: true,
            divida_minima: 8000,
            divida_maxima: 10000,
            taxa_a_vista: 0.8,
            taxa_a_prazo: 0.1,
        },
        {
            id: 1,
            plano: "Master",
            ativa: true,
            divida_minima: 10000,
            divida_maxima: 13000,
            taxa_a_vista: 0.8,
            taxa_a_prazo: 0.1,
        },
        {
            id: 1,
            plano: "Infinity",
            ativa: true,
            divida_minima: 13000,
            divida_maxima: 17000,
            taxa_a_vista: 0.8,
            taxa_a_prazo: 0.1,
        },
    ],
    onda_config_tipos_de_processo_juridico: [
        {
            id: 1,
            palavra: "Arrombamento",
            ativa: true,
        },
        {
            id: 2,
            palavra: "Assassinato",
            ativa: false,
        },
        {
            id: 3,
            palavra: "Estelionato",
            ativa: true,
        },
        {
            id: 4,
            palavra: "Sequestro",
            ativa: false,
        },
        {
            id: 5,
            palavra: "Homicídio",
            ativa: true,
        },
        {
            id: 6,
            palavra: "Tráfico",
            ativa: false,
        },
        {
            id: 7,
            palavra: "Agressão",
            ativa: true,
        },
    ],
    onda_config_regras_reprovacao_automatica: {
        verificar_black_list: true,
        reprovar_divida_maior_que: 10000,
    },
    onda_config_tetos_para_ativar_analise_manual: {
        teto_em_reais: 9000,
    },
    onda_config_analise_manual_aplicativos: {
        cpf_portal: false,
        cpf_wave: true,
        cnpj_portal: true,
        cnpj_wave: false,
    },
};
