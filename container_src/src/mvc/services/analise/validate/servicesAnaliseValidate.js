//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../../helpers/geral/yup-schema-validate.js";
//BANCO DE DADOS

import setResponse from "../../../../helpers/response/setResponse.js";
//SERVICES
import servicesAnaliseRegras from "../regras/servicesAnaliseRegras.js";
import onda_cartafianca from "../../../models/analise/onda_cartafianca.js";

const servicesAnaliseValidate = class servicesAnaliseValidate {
    static async atualizarStatusAnalise_validate(dadosBody, status) {
        const schema = yup.object().shape({
            status: yup
                .string()
                .test("", `Status do setor ${dadosBody?.setor} está inválido!`, (value) => {
                    return status.includes(value);
                })
                .required(),
            cod: yup.string().required(),
        });

        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async validarDadosPatchComercial(dadosBody) {
        const valorAdicionalSchema = yup.object({
            label: yup.string().required(),
            ativo: yup.boolean().required(),
            valor: yup.number().min(0).required(),
            _id: yup
                .string()
                .matches(/^[0-9a-fA-F]{24}$/, "ID inválido")
                .required(),
        });

        const contractSchema = yup.object({
            ondaConfigValoresAdicionais: yup.array().of(valorAdicionalSchema).required(),
        });

        return await yupSchemaValidate(contractSchema, dadosBody, { abortEarly: false });
    }

    static async motivoReprovacao_validate(dadosBody) {
        const schema = yup.object({
            contrato: yup.string().required(),
            onda_reasons_motivo: yup.string().default("0").required("Por favor, informe o motivo da reprovação*"),
            onda_reasons_score: yup.number().default(0),
            onda_reasons_divida: yup.string().default(""),
            onda_reasons_descricao: yup.string().default(""),
            onda_reasons_juridico: yup
                .object()
                .shape({
                    criminal: yup.boolean().default(false),
                    despejo: yup.boolean().default(false),
                    acaodecobranca: yup.boolean().default(false),
                    documentoforadanormalidade: yup.boolean().default(false),
                })
                .nullable()
                .when("onda_reasons_motivo", {
                    is: "juridico",
                    then: yup.object().required("Campo obrigatório para pagamento com cartão de crédito ou Pix"),
                })
                .when("onda_reasons_motivo", {
                    is: "juridico",
                    then: yup.object().test("at-least-one-selected", "Pelo menos uma opção deve ser selecionada*", (value) => {
                        return value?.criminal || value?.despejo || value?.acaodecobranca || value?.documentoforadanormalidade;
                    }),
                }),
        });

        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async validateExecucaoEncerramentoContrato(dadosBody) {
        const testDateDistrato = (value, parent) => {
            const { distrato } = parent;
            if (distrato) {
                return value != null;
            }
            return true;
        };
        const schema = yup.object().shape({
            chaveTransferencia: yup.string().required("Chave de transferência é obrigatória"),
            distrato: yup.boolean().required("O campo distrato é obrigatório"),
            matrixContrato: yup.string().required("Matriz do contrato é obrigatória"),
            metodoPagamento: yup.string().required("Método de pagamento é obrigatório"),
            motivoDistrato: yup
                .string()
                .nullable()
                .when("distrato", {
                    is: true,
                    then: yup.string().required("Motivo do distrato é obrigatório"),
                    otherwise: yup.string().nullable(),
                }),
            dataCancelamentoFianca: yup
                .date()
                .nullable()
                .test("data-cancelamento-obrigatoria", "Data de cancelamento da fiança é obrigatória quando há distrato", function (value) {
                    return testDateDistrato(value, this.parent);
                }),

            dataDistrato: yup
                .date()
                .nullable()
                .test("data-distrato-obrigatoria", "Data de distrato é obrigatória quando há distrato", function (value) {
                    return testDateDistrato(value, this.parent);
                }),

            dataEntrada: yup
                .date()
                .nullable()
                .test("data-entrada-obrigatoria", "Data de entrada é obrigatória quando há distrato", function (value) {
                    return testDateDistrato(value, this.parent);
                }),
        });
        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async validateGeracaoFormularioEncerramentoContrato(dadosBody) {
        const schema = yup.object().shape({
            matrixContrato: yup.string().required("Matriz do contrato é obrigatória"),
        });
        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async ondaPay_validate(dadosBody) {
        const schema = yup.object({
            contrato: yup.string().required("O Cod do contrato é obrigatório"),
            valorparcelas: yup.number().required("Necessário informar o valor da parcela.*"),
            serialnumber: yup.string(),
            cardnumber: yup.string(),
            desc: yup.string(),
            titular: yup.string(),
            parcelas: yup.number(),
            cpf: yup.string(),
            tipopagamento: yup
                .number()
                .required("Forma de pagamento obrigatória")
                .test("", "Tipo pagamento inválido!", (value) => {
                    return [1, 2, 3, 4].includes(value);
                }),

            plataforma: yup
                .number()
                .required("Plataforma é obrigatória*")
                .test("", "Plataforma pagamento inválida.*", (value) => {
                    return [1, 2, 3, 4, 5, 6, 7, 8].includes(value);
                }),
        });

        const results = await yupSchemaValidate(schema, dadosBody, { abortEarly: false });

        return {
            contrato: results?.contrato,
            valorparcelas: results?.valorparcelas,
            serialnumber: results?.serialnumber,
            cardnumber: results?.cardnumber,
            desc: results?.desc,
            titular: results?.titular,
            parcelas: results?.parcelas,
            cpf: results?.cpf,
            tipopagamento: results?.tipopagamento,
            plataforma: results?.plataforma,
        };
    }

    static async gerarAnexo1_validate(dadosBody) {
        const schema = yup.object({
            tipo: yup
                .string()
                .required("Tipo de anexo obrigatório!")
                .test("", "O tipo deve ser anexo1 ou simulacao", (value) => {
                    return ["anexo1", "simulacao"].includes(value);
                }),
            cod: yup.string().required("Código é obrigatório!"),
            email: yup
                .string()
                .required("Enviar email? é obrigatório!")
                .default("false")
                .test("", "Enviar email? deve ser uma string true ou false", (value) => {
                    return ["true", "false"].includes(value);
                }),
        });

        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async validarDadosEnvioAnalise({ dadosBody }) {
        //const arrayIds = await onda_helpers.buscarArrayIdHelpersStatus();
        function removerCaracteresEspeciaisEEspacos(str) {
            return String(str)
                .replace(/[^0-9]/g, "")
                .replace(/\s/g, "");
        }
        const schema = yup.object().shape({
            infoAnalise: yup.object().shape({
                valorRecebidoComissaoImobiliaria: yup.number().required(),
                tipoAnalise: yup
                    .string()
                    .default("analise")
                    .trim()
                    .lowercase()
                    .test("teste-tipoAnalise", `tipoAnalise de ser: ${["analise", "renovacao"]}!`, (value) => {
                        return ["analise", "renovacao"].includes(value);
                    }),
                apiConsulta: yup.string().required("O campo apiConsulta é obrigatório.").default("Procob"), // Valida se é uma string e se é obrigatório
                cartafiancaImobiliaria: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .notRequired(), // No app da imobiliária, este campo não é necessário
                cartafiancaFonte: yup
                    .string()
                    .required("O campo cartafiancaFonte é obrigatório.")
                    .test("teste-cartafiancaFonte", `cartafiancaFonte de ser: ${["Wave", "Mobile", "Portal", "flex-pro"]}!`, (value) => {
                        return ["Wave", "Portal", "flex-pro", "Mobile"].includes(value);
                    }),
                cartafiancaValorAluguel: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo cartafiancaValorAluguel é obrigatório."),
                cartafiancaParcela: yup
                    .number()
                    .default(1)
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo cartafiancaParcela é obrigatório."),
                porcentagemDesconto: yup
                    .number()
                    .default(0)
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo porcentagemDesconto é obrigatório."),
                cartafiancaCobertura: yup.string().required("O campo cartafiancaCobertura é obrigatório."),
                vistoriaEntradaSaida: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .default(0)
                    .required("O campo vistoriaEntradaSaida é obrigatório."),
                vistoria: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo vistoria é obrigatório."),
                pintura: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo pintura é obrigatório."),
                limpeza: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo limpeza é obrigatório."),
                cartafiancaImovelId: yup.number().transform((value, v) => (v === "" ? 0 : Number(v))),
                //NOVAS TAXAS CADASTRADAS
                cartafiancaTaxaIptu: yup.number().default(0),
                cartafiancaTaxaImovel: yup.number().default(0),
                cartafiancaTaxaAgua: yup.number().default(0),
                cartafiancaTaxaCondominio: yup.number().default(0),
                cartafiancaTaxaLixo: yup.number().default(0),
                cartafiancaTaxaEnergia: yup.number().default(0),
                cartafiancaTaxaSeguroIncendio: yup.number().default(0),
                cartafiancaTaxaGas: yup.number().default(0),
                taxas: yup
                    .array()
                    .of(
                        yup.object().shape({
                            ativo: yup.boolean().required("Status ativo/inativo é obrigatório"),
                            label: yup.string().required("Nome da taxa é obrigatório"),
                            valor: yup.number().typeError("Valor deve ser um número").required("Valor é obrigatório").min(0, "Valor não pode ser negativo"),
                        })
                    )
                    .required(),
            }),
            locatario: yup.object().shape({
                locatarioCnpjcpf: yup
                    .string()
                    .required("O campo locatarioCnpjcpf é obrigatório.")
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),

                locatarioNome: yup.string().required("O campo locatarioNome é obrigatório."),
                locatarioRenda: yup
                    .number()
                    .required("O campo locatarioRenda é obrigatório.")
                    .default(0)
                    .transform((value, v) => (v === "" ? 0 : Number(v))),
                locatarioRg: yup.string(),
                locatarioTelefone: yup.string().transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCelular: yup
                    .string()
                    .required("O campo locatarioCelular é obrigatório.")
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioEmail: yup
                    .string()
                    .email("O email deve ser válido.")
                    .required("O campo locatarioEmail é obrigatório.")
                    .transform((value, v) => String(v)?.toLocaleLowerCase()?.trim()),
                locatarioCep: yup.string(),
                locatarioRua: yup.string(),
                locatarioNumero: yup.number(),
                locatarioBairro: yup.string(),
                locatarioComplemento: yup.string(),
                locatarioCidade: yup.string(),
                locatarioUf: yup.string(),
                locatarioCopart1: yup.string().nullable(),
                locatarioCopart1renda: yup
                    .number()
                    .nullable()
                    .transform((value, v) => (v === "" ? 0 : Number(v))),
                locatarioCopart1cpf: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCopart1rg: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCopart2: yup.string().nullable(),
                locatarioCopart2renda: yup.number().transform((value, v) => (v === "" ? 0 : Number(v))),
                locatarioCopart2cpf: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCopart2rg: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioValoraluguel: yup.number().transform((value, v) => (v === "" ? 0 : Number(v))),
            }),
        });
        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }
    static async validarDadosRenovacao({ dadosBody }) {
        //const arrayIds = await onda_helpers.buscarArrayIdHelpersStatus();
        function removerCaracteresEspeciaisEEspacos(str) {
            return String(str)
                .replace(/[^0-9]/g, "")
                .replace(/\s/g, "");
        }
        const schema = yup.object().shape({
            infoAnalise: yup.object().shape({
                valorRecebidoComissaoImobiliaria: yup.number().required(),
                tipoAnalise: yup
                    .string()
                    .default("analise")
                    .trim()
                    .lowercase()
                    .test("teste-tipoAnalise", `tipoAnalise de ser: ${["analise", "renovacao"]}!`, (value) => {
                        return ["analise", "renovacao"].includes(value);
                    }),
                apiConsulta: yup.string().required("O campo apiConsulta é obrigatório.").default("Procob"), // Valida se é uma string e se é obrigatório
                cartafiancaImobiliaria: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .notRequired(), // No app da imobiliária, este campo não é necessário
                cartafiancaFonte: yup
                    .string()
                    .required("O campo cartafiancaFonte é obrigatório.")
                    .test("teste-cartafiancaFonte", `cartafiancaFonte de ser: ${["Wave", "Mobile", "Portal", "flex-pro"]}!`, (value) => {
                        return ["Wave", "Portal", "flex-pro", "Mobile"].includes(value);
                    }),
                cartafiancaValorAluguel: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo cartafiancaValorAluguel é obrigatório."),
                cartafiancaParcela: yup
                    .number()
                    .default(1)
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo cartafiancaParcela é obrigatório."),
                porcentagemDesconto: yup
                    .number()
                    .default(0)
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo porcentagemDesconto é obrigatório."),
                cartafiancaCobertura: yup.string().required("O campo cartafiancaCobertura é obrigatório."),
                vistoriaEntradaSaida: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .default(0)
                    .required("O campo vistoriaEntradaSaida é obrigatório."),
                vistoria: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo vistoria é obrigatório."),
                pintura: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo pintura é obrigatório."),
                limpeza: yup
                    .number()
                    .transform((value, v) => (v === "" ? 0 : Number(v)))
                    .required("O campo limpeza é obrigatório."),
                cartafiancaImovelId: yup.number().transform((value, v) => (v === "" ? 0 : Number(v))),
                //NOVAS TAXAS CADASTRADAS
                cartafiancaTaxaIptu: yup.number().default(0),
                cartafiancaTaxaImovel: yup.number().default(0),
                cartafiancaTaxaAgua: yup.number().default(0),
                cartafiancaTaxaCondominio: yup.number().default(0),
                cartafiancaTaxaLixo: yup.number().default(0),
                cartafiancaTaxaEnergia: yup.number().default(0),
                cartafiancaTaxaSeguroIncendio: yup.number().default(0),
                cartafiancaTaxaGas: yup.number().default(0),
                taxas: yup
                    .array()
                    .of(
                        yup.object().shape({
                            ativo: yup.boolean().required("Status ativo/inativo é obrigatório"),
                            label: yup.string().required("Nome da taxa é obrigatório"),
                            valor: yup.number().typeError("Valor deve ser um número").required("Valor é obrigatório").min(0, "Valor não pode ser negativo"),
                        })
                    )
                    .required(),
            }),
            locatario: yup.object().shape({
                locatarioCnpjcpf: yup
                    .string()
                    .required("O campo locatarioCnpjcpf é obrigatório.")
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),

                locatarioNome: yup.string().required("O campo locatarioNome é obrigatório."),
                locatarioRenda: yup
                    .number()
                    .required("O campo locatarioRenda é obrigatório.")
                    .default(0)
                    .transform((value, v) => (v === "" ? 0 : Number(v))),
                locatarioRg: yup.string(),
                locatarioTelefone: yup.string().transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCelular: yup
                    .string()
                    .required("O campo locatarioCelular é obrigatório.")
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioEmail: yup
                    .string()
                    .email("O email deve ser válido.")
                    .required("O campo locatarioEmail é obrigatório.")
                    .transform((value, v) => String(v)?.toLocaleLowerCase()?.trim()),
                locatarioCep: yup.string(),
                locatarioRua: yup.string(),
                locatarioNumero: yup.number(),
                locatarioBairro: yup.string(),
                locatarioComplemento: yup.string(),
                locatarioCidade: yup.string(),
                locatarioUf: yup.string(),
                locatarioCopart1: yup.string().nullable(),
                locatarioCopart1renda: yup
                    .number()
                    .nullable()
                    .transform((value, v) => (v === "" ? 0 : Number(v))),
                locatarioCopart1cpf: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCopart1rg: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCopart2: yup.string().nullable(),
                locatarioCopart2renda: yup.number().transform((value, v) => (v === "" ? 0 : Number(v))),
                locatarioCopart2cpf: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioCopart2rg: yup
                    .string()
                    .nullable()
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
                locatarioValoraluguel: yup.number().transform((value, v) => (v === "" ? 0 : Number(v))),
            }),
            cod: yup.string().required("O campo codigo do contrato é obrigatório."),
        });
        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async validarSchemaConcluirEnvioAnalise(infoAnalise, cod) {
        const infoAnaliseSchema = yup.object().shape({
            infoAnalise: yup
                .object()
                .shape({
                    cartafiancaCobertura: yup.string().required("Cobertura é obrigatória"),
                    cod: yup.string().default(cod).required("Cod contrato é obrigatório!").matches(/^OND-/, "O código do contrato deve ser o contrato ex: OND-4564564231-2024"),
                    cartafiancaImovelId: yup.number().nullable(),
                })
                .required("Informações da análise são obrigatórias"),
        });

        return await yupSchemaValidate(infoAnaliseSchema, { infoAnalise: infoAnalise }, { abortEarly: false });
    }

    static async validarCpfLocatarioParaGerarPlanos({ dadosBody }) {
        function removerCaracteresEspeciaisEEspacos(str) {
            return String(str)
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .replace(/\s/g, "");
        }
        const schema = yup.object().shape({
            locatario: yup.object().shape({
                locatarioCnpjcpf: yup
                    .string()
                    .required("O campo locatarioCnpjcpf é obrigatório.")
                    .transform((value, v) => removerCaracteresEspeciaisEEspacos(v)),
            }),
        });
        return await yupSchemaValidate(schema, dadosBody, { abortEarly: false });
    }

    static async validarSeValorMinimoParcelasEstaNaFaixaPermitida(valoresCartaFianca, ultimaTaxaCadastrada) {
        const { onda_config_valor_minimo_parcelas_boleto } = ultimaTaxaCadastrada;

        const dadosCalculados = valoresCartaFianca;

        const {
            cartafiancaValorParcela,
            cartafiancaValorAdesao,
            cartafiancaValorAVista,
            cartafiancaValorAPrazo,
            cartafiancaValorDesconto,
            cartafiancaParcela,
            cartafiancaConfigTaxaId,
        } = dadosCalculados;

        if (Number(cartafiancaValorParcela) <= Number(onda_config_valor_minimo_parcelas_boleto)) {
            const parcelaMaxima = Number(cartafiancaValorAPrazo) / Number(onda_config_valor_minimo_parcelas_boleto);
            const parcelaArredondada = Math.floor(parcelaMaxima);

            return setResponse.WARNING({ message: `A quantidade de parcelas permitida para o plano é: ${parcelaArredondada}x` });
        } else {
            return dadosCalculados;
        }
    }
    static validaDadosParaEncerramentodeContrato({ contrato, locatario, imobiliaria }) {
        if (!contrato) {
            return setResponse.WARNING({
                message: "Dados do contrato não estão presentes.",
            });
        }
        if (!locatario) {
            return setResponse.WARNING({
                message: "Dados do locatário não estão presentes.",
            });
        }
        if (!imobiliaria) {
            return setResponse.WARNING({
                message: "Dados da imobiliária não estão presentes.",
            });
        }
        return;
    }
    static async validaExecucaoExoneracaoCartafianca(data) {
        const schema = yup.object().shape({
            cod: yup.string().required("Código da carta fiança é obrigatório."),
        });

        return await yupSchemaValidate(schema, data, { abortEarly: false });
    }

    static async validaContratoExonerar({ cod }) {
        const contrato = await onda_cartafianca.getOneNotResView(cod);

        if (!contrato) {
            return setResponse.WARNING({
                message: "Contrato não localizado. Verifique se a matrix informada está correto para prosseguir com a exoneração.",
            });
        }

        if ([336].includes(contrato.statusComercialCod)) {
            return setResponse.WARNING({
                message: "Contrato já exonerado. Não é possível realizar nova exoneração neste registro.",
            });
        }

        return null;
    }

    static async validaContratoExonerarNoSetResponse({ cod }) {
        const contrato = await onda_cartafianca.getOneNotResView(cod);
        if (!contrato) {
            return true;
        }


        if (![999].includes(contrato.statusFinanceiroCod) || [331, 332, 333, 334, 335, 336].includes(contrato.statusComercialCod)) {
            return true;
        }

        return null;
    }

    static async filtrarContratosValidosParaExoneracao(contratos = []) {
        const contratosValidados = [];

        for (const cod of contratos) {
            const validacao = await this.validaContratoExonerarNoSetResponse({ cod });
            if (!validacao) {
                contratosValidados.push(cod);
            }
        }
        return contratosValidados;
    }

    static async validaAtualizacaoResponsavelExoneracao(data) {
        const schema = yup.object().shape({
            userId: yup.number().nullable(),
            cod: yup.string().required("O código da exoneração é obrigatório"),
        });

        return await yupSchemaValidate(schema, data, { abortEarly: false });
    }
    static async validaMudancaEtpaExoneracao(data) {
        const schema = yup.object().shape({
            operacao: yup.number().required("O código da operação é obrigatório"),
            cod: yup.string().required("O código da exoneração é obrigatório"),
        });

        return await yupSchemaValidate(schema, data, { abortEarly: false });
    }
    static async validaRequisicaoDesoneracaoContrato(data) {
        const schema = yup.object().shape({
            cod: yup.string().required("O código da exoneração é obrigatório"),
        });

        return await yupSchemaValidate(schema, data, { abortEarly: false });
    }

    static async validaConfirmacaoExoneracao(data) {
        const schema = yup.object().shape({
            cod: yup.string().required("O código da exoneração é obrigatório"),
        });

        return await yupSchemaValidate(schema, data, { abortEarly: false });
    }
};

export default servicesAnaliseValidate;
