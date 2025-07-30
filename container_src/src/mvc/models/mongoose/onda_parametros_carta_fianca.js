import mongoose from "mongoose";
import yup from "yup";
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";

const fixedId = "67a1faa9a2a24ed3c0089692";

const onda_parametros_carta_fianca = class onda_parametros_carta_fianca {
    constructor() {
        this.schema = new mongoose.Schema(
            {
                matrix: {type: String, required: true},

                onda_config_bonificacao_imobiliaria: {
                    valor_min: {
                        type: Number,
                        required: true,
                        default: 0,
                    },
                    valor_max: {
                        type: Number,
                        required: true,
                        default: 240,
                    },
                },

                onda_config_palavras_restritas_juridico: [
                    {
                        ativa: {
                            type: Boolean,
                            required: true,
                        },
                        label: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                    },
                ],

                onda_config_regras_reprovacao_automatica: {
                    reprovar_divida_maior_que: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    verificar_black_list: {
                        type: Boolean,
                        required: true,
                    },
                },

                onda_config_regras_porcentagem_pix_mais_boletos: {
                    valor: {
                        type: Number,
                        required: true,
                        min: 0,
                        max: 1,
                        default: 0.4,
                    },
                    ativa: {
                        type: Boolean,
                        required: true,
                    },
                },

                onda_config_analise_manual_aplicativos: {
                    cpf_portal: {
                        type: Boolean,
                        required: true,
                    },
                    cpf_wave: {
                        type: Boolean,
                        required: true,
                    },
                    cnpj_portal: {
                        type: Boolean,
                        required: true,
                    },
                    cnpj_wave: {
                        type: Boolean,
                        required: true,
                    },
                },

                // onda_config_tipos_de_processo_juridico: [
                //     {
                //         ativo: {
                //             type: Boolean,
                //             required: true,
                //         },
                //         label: {
                //             type: String,
                //             required: true,
                //             trim: true,
                //         },
                //     },
                // ],

                onda_config_teto_para_ativar_analise_manual: {
                    teto_em_reais: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                },

                onda_config_valores_adicionais: {
                    type: [
                        {
                            label: {
                                type: String,
                                required: true,
                            },
                            ativo: {
                                type: Boolean,
                                required: true,
                            },
                            valor: {
                                type: Number,
                                required: true,
                                min: 0,
                            },
                        },
                    ],
                },

                onda_config_planos: [
                    {
                        desconto: {
                            type: Number,
                            required: true,
                            min: 0,
                            max: 100,
                        },
                        taxa_a_prazo: {
                            type: Number,
                            required: true,
                            min: 0,
                            max: 100,
                        },
                        taxa_a_vista: {
                            type: Number,
                            required: true,
                            min: 0,
                            max: 100,
                        },
                        range_divida: {
                            max: {
                                type: Number,
                                required: true,
                                min: 0,
                            },
                            min: {
                                type: Number,
                                required: true,
                                min: 0,
                            },
                            ativo: {
                                type: Boolean,
                                required: true,
                            },
                        },
                        range_aluguel: {
                            max: {
                                type: Number,
                                required: true,
                                min: 0,
                            },
                            min: {
                                type: Number,
                                required: true,
                                min: 0,
                            },
                            ativo: {
                                type: Boolean,
                                required: true,
                            },
                        },

                        nome: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        descricao: {
                            type: String,
                            required: true,
                            trim: true,
                        },
                        ativo: {
                            type: Boolean,
                            required: true,
                        },
                    },
                ],
            },
            {
                timestamps: true,
                autoIndex: true,
            }
        );

        const modelNome = "onda_parametros_carta_fianca";
        this.model = mongoose.model(modelNome, this.schema, modelNome);
        this.model.syncIndexes();
    }

    async validate({data}) {
        // Schema para palavras restritas jurídico
        const bonificacaoSchema = yup.object().shape({
            valor_min: yup.number().min(0, "O valor mínimo deve ser maior que zero").required("O valor mínimo é obrigatório"),
            valor_max: yup
                .number()
                .required("O valor máximo é obrigatório")
                .test("is-greater-than-min", "O valor máximo deve ser maior que o valor mínimo", function (value) {
                    const {valor_min} = this.parent; // Acessa o valor do campo 'valor_min'
                    return value > valor_min;
                })
                .max(1000, "O valor máximo deve ser menor que R$1.000"),
        });

        // Schema para palavras restritas jurídico
        const palavrasRestritasSchema = yup.object().shape({
            ativa: yup.boolean().required("Status ativo/inativo é obrigatório"),
            label: yup.string().trim().required("Label é obrigatório"),
        });

        // Schema para regras de reprovação automática
        const regrasReprovacaoSchema = yup.object().shape({
            reprovar_divida_maior_que: yup.number().min(0, "Valor de reprovação deve ser maior que zero").required("Valor de reprovação é obrigatório"),
            verificar_black_list: yup.boolean().required("Configuração de black list é obrigatória"),
        });
        // onda_config_regras_porcentagem_pix_mais_boletos: {
        //     valor: {
        //         type: Number,
        //         required: true,
        //         min: 0,
        //         max: 1,
        //         default: 0.4,
        //     },
        //     ativa: {
        //         type: Boolean,
        //         required: true,
        //     },
        // },
        const porcentagemPixMaisBoletos = yup.object().shape({
            valor: yup
                .number()
                .min(0, "Valor de porcentagemPixMaisBoletos deve ser maior que zero")
                .max(1)
                .default(0.4)
                .required("Valor de porcentagemPixMaisBoletos é obrigatório"),
            ativa: yup.boolean().default(true).required("Configuração de black list é obrigatória"),
        });

        // Schema para análise manual de aplicativos
        const analiseManualSchema = yup.object().shape({
            cpf_portal: yup.boolean().required("Configuração de CPF portal é obrigatória"),
            cpf_wave: yup.boolean().required("Configuração de CPF wave é obrigatória"),
            cnpj_portal: yup.boolean().required("Configuração de CNPJ portal é obrigatória"),
            cnpj_wave: yup.boolean().required("Configuração de CNPJ wave é obrigatória"),
        });

        // Schema para tipos de processo jurídico
        // const tiposProcessoSchema = yup.object().shape({
        //     ativo: yup.boolean().required("Status ativo/inativo é obrigatório"),
        //     label: yup.string().trim().required("Label é obrigatório"),
        // });

        // Schema para teto de análise manual
        const tetoAnaliseManualSchema = yup.object().shape({
            teto_em_reais: yup.number().min(0, "Teto em reais deve ser maior que zero").required("Teto em reais é obrigatório"),
        });

        // Schema para planos
        const planoSchema = yup.object().shape({
            ativo: yup.boolean().required("Status ativo/inativo é obrigatório"),
            nome: yup.string().trim().required("Nome do plano é obrigatório"),
            taxa_a_vista: yup
                .number()
                .min(0, "Taxa à vista deve ser maior ou igual a zero")
                .max(100, "Taxa à vista deve ser menor ou igual a 100")
                .required("Taxa à vista é obrigatória"),
            taxa_a_prazo: yup
                .number()
                .min(0, "Taxa a prazo deve ser maior ou igual a zero")
                .max(100, "Taxa a prazo deve ser menor ou igual a 100")
                .required("Taxa a prazo é obrigatória"),
            desconto: yup.number().min(0, "Desconto deve ser maior ou igual a zero").max(100, "Desconto deve ser menor ou igual a 100").required("Desconto é obrigatório"),
            descricao: yup.string().trim().required("Descrição do plano é obrigatória"),
            range_divida: yup.object().shape({
                max: yup.number().min(0, "Dívida máxima deve ser maior ou igual a zero").required("Dívida máxima é obrigatória"),
                min: yup
                    .number()
                    .min(0, "Dívida mínima deve ser maior ou igual a zero")
                    .test("menor-que-max", "Dívida mínima deve ser menor ou igual à dívida máxima", function (value) {
                        return value <= this.parent?.max;
                    })
                    .required("Dívida mínima é obrigatória"),
                ativo: yup.boolean().oneOf([true, false], "O campo 'ativo' deve ser um booleano").required("O campo 'ativo' é obrigatório"),
            }),
            range_aluguel: yup.object().shape({
                max: yup.number().min(0, "Aluguel máximo deve ser maior ou igual a zero").required("Aluguel máximo é obrigatório"),
                min: yup
                    .number()
                    .min(0, "Aluguel mínimo deve ser maior ou igual a zero")
                    .test("menor-que-max", "Aluguel mínimo deve ser menor ou igual ao aluguel máximo", function (value) {
                        return value <= this.parent?.max;
                    })
                    .required("Aluguel mínimo é obrigatório"),
                ativo: yup.boolean().oneOf([true, false], "O campo 'ativo' deve ser um booleano").required("O campo 'ativo' é obrigatório"),
            }),
        });

        const ondaConfigValoresAdicionaisSchema = yup.object().shape({
            label: yup.string().trim().required(),
            ativo: yup.boolean().required(),
            valor: yup.number().required().min(0, "O valor da pintura deve ser maior ou igual a 0"),
        });

        // Schema principal
        const configSchema = yup.object().shape({
            onda_config_bonificacao_imobiliaria: bonificacaoSchema.required("Os valores da bonificação são obrigatórios"),

            onda_config_palavras_restritas_juridico: yup.array().of(palavrasRestritasSchema).min(1, "Array de palavras restritas deve ser um array").default([]),

            onda_config_regras_reprovacao_automatica: regrasReprovacaoSchema.required("Configurações de reprovação automática são obrigatórias"),

            onda_config_regras_porcentagem_pix_mais_boletos: porcentagemPixMaisBoletos.required("Configurações de pix_mais_boletos são obrigatórias"),

            onda_config_analise_manual_aplicativos: analiseManualSchema.required("Configurações de análise manual são obrigatórias"),

            //onda_config_tipos_de_processo_juridico: yup.array().of(tiposProcessoSchema).min(1, "Array de tipos de processo deve ser um array").default([]),

            onda_config_teto_para_ativar_analise_manual: tetoAnaliseManualSchema.required("Configurações de teto para análise manual são obrigatórias"),

            onda_config_planos: yup.array().of(planoSchema).default([]),

            onda_config_valores_adicionais: yup.array().of(ondaConfigValoresAdicionaisSchema).min(1, "Adicionais deve ser um array").default([]),
        });

        return await yupSchemaValidate(configSchema, data, {abortEarly: false});
    }

    async post({data}) {
        const dataValidate = await this.validate({data: data});

        await this.model.findOneAndUpdate({_id: fixedId}, {...dataValidate, matrix: fixedId}, {upsert: true, new: true, runValidators: true}).catch(async (err) => {
            await onda_errors.postNotRes({classe: "onda_parametros_carta_fianca", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
            return setResponse.WARNING({message: "Erro ao criar/atualizar parametros da análise!", results: []});
        });

        return await this.getOneIdFixed();
    }

    async atualizar_configuracao_carta_fianca({data, contrato}) {
        const dataValidate = await this.validate({data: data});

        await this.model.findOneAndUpdate({matrix: contrato}, dataValidate, {upsert: true, new: true, runValidators: true}).catch(async (err) => {
            await onda_errors.postNotRes({classe: "onda_parametros_carta_fianca", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
            return setResponse.WARNING({message: "Erro ao criar/atualizar parametros da análise!", results: []});
        });

        return await this.buscar_configuracao_carta_fianca({contrato: contrato});
    }

    async criar_configuracao_carta_fianca({onda_config_valores_adicionais, contrato, onda_parametros_carta_fianca}) {
        const buscar_pagamentro_fixo = onda_parametros_carta_fianca || (await this.getOneIdFixed());
        if (onda_config_valores_adicionais) buscar_pagamentro_fixo.onda_config_valores_adicionais = onda_config_valores_adicionais;

        const dataValidate = await this.validate({data: buscar_pagamentro_fixo});

        await this.model.create({...dataValidate, matrix: contrato}).catch(async (err) => {
            await onda_errors.postNotRes({classe: "onda_parametros_carta_fianca", statico: "post", message: JSON.stringify(err)?.slice(0, 4900)});
            return setResponse.WARNING({message: "Erro ao criar/atualizar parametros da análise!", results: []});
        });

        return await this.buscar_configuracao_carta_fianca({contrato: contrato});
    }

    async buscar_configuracao_carta_fianca({contrato}) {
        try {
            const result = await this.model
                .findOne({matrix: contrato})
                .lean()
                .catch((err) => {
                    return setResponse.DATABASE_ERROR({message: "Erro ao buscar parametros da carta fiança!"});
                });

            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_parametros_carta_fianca", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

            return setResponse.DATABASE_ERROR({message: "Erro ao buscar o último registro."});
        }
    }

    async getOneIdFixed() {
        try {
            const result = await this.model
                .findById(fixedId)
                .lean()
                .catch((err) => {
                    throw err;
                });

            if (!result) {
                return setResponse.NOT_FOUND({message: "Nenhuma configuração encontrada."});
            }

            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_parametros_carta_fianca", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

            return setResponse.DATABASE_ERROR({message: "Erro ao buscar o último registro."});
        }
    }

    async getOneById({id}) {
        try {
            const result = await this.model
                .findOne({_id: id}) // não filtramos mais por code específico
                .lean() // converte para objeto JavaScript puro (melhor performance)
                .catch((err) => {
                    throw err; // lança o erro para ser capturado pelo catch externo
                });

            // if (!result) {
            //     return setResponse.NOT_FOUND({
            //         message: "Nenhuma configuração encontrada.",
            //     });
            // }
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_parametros_carta_fianca", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

            return setResponse.DATABASE_ERROR({message: "Erro ao buscar o último registro."});
        }
    }

    calcularValoresAdicionais({onda_config_valores_adicionais}) {
        const itensAtivos = onda_config_valores_adicionais?.filter((item) => item.ativo);
        const total = itensAtivos?.reduce((sum, item) => Number(sum) + Number(item.valor), 0);

        return Number(total);
    }
};

export default new onda_parametros_carta_fianca();
