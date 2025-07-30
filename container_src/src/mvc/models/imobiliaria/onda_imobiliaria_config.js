import mongoose from "mongoose";
import * as yup from "yup";

// Helpers
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import onda_followup from "../../models/public/onda_followup.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";

const Schema = mongoose.Schema;
const {ObjectId} = mongoose.Types;
const onda_imobiliaria_config = class onda_imobiliaria_config {
    constructor() {
        const schema = new Schema(
            {
                matrix: {type: String},
                prazo_pagamento_sinistros: {
                    padrao: {type: Number, default: 30},
                },
                taxas_sinistro: {
                    condominio: {
                        multa: {type: Number},
                        juros: {type: Number},
                    },
                    aluguel: {
                        multa: {type: Number},
                        juros: {type: Number},
                    },
                },
                assinatura_contratos: [
                    {
                        url_pdf_contrato: {type: String, required: true},
                        assinado: {type: Boolean, default: false},
                        data_assinatura: {type: Date},
                        data_envio_assinatura: {type: Date},
                    },
                ],
            },
            {
                timestamps: true,
            }
        );

        this.token = {};
        this.data = {};
        this.matrix = "";
        this.pendentesCadastro = [];
        this.imobiliaria_config = {};
        this.model = mongoose.model("onda_imobiliaria_config", schema);
    }

    async validate({data}) {
        const schema = yup.object().shape({
            matrix: yup.string().required("Matrix é obrigatório!"),
            taxas_sinistro: yup.object().shape({
                condominio: yup.object().shape({
                    multa: yup.number(),
                    juros: yup.number(),
                }),
                aluguel: yup.object().shape({
                    multa: yup.number(),
                    juros: yup.number(),
                }),
            }),
            prazo_pagamento_sinistros: yup
                .object()
                .shape({
                    padrao: yup.number().default(30),
                })
                .optional(),
            assinatura_contratos: yup.array().of(
                yup.object().shape({
                    url_pdf_contrato: yup.string(),
                    assinado: yup.boolean().default(false),
                    data_assinatura: yup.date().nullable(null),
                    data_envio_assinatura: yup.date().default(new Date()),
                    _id: yup.string().required(),
                })
            ),
        });

        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async findOneAndUpdate({data, token}) {
        this.token = token;
        this.data = data?.data;

        const dadosValidados = await this.validate({data});

        const newData = await this.model.findOneAndUpdate({matrix: dadosValidados?.matrix}, {$set: dadosValidados}, {upsert: true, new: true}).catch(async (err) => {
            await onda_followup.postFollowup({
                token: token,
                cod: data?.matrix,
                event: "*Erro ao cadastrar/atualizar boleto no MongoDB!",
            });
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cadastrar/atualizar boleto no MongoDB!",
            });
        });
        return newData;
    }

    async toSign({data, token}) {
        const update = {
            "assinatura_contratos.$[elemento].assinado": data?.assinar,
            "assinatura_contratos.$[elemento].data_assinatura": new Date(),
        };

        const id = ObjectId.createFromHexString(data?.id);

        const options = {
            arrayFilters: [{"elemento._id": id}],
            new: true,
        };

        return await this.model
            .findOneAndUpdate({matrix: data?.matrix}, {$set: update}, options)
            .then(async (result) => {
                if (result) {
                    await onda_followup.postFollowup({token: token, cod: data?.matrix, event: `Sucesso ao assinar o contrato com id: ${data?.id}`});
                    return result;
                } else {
                    throw 404;
                }
            })
            .catch(async (err) => {
                if (err == 404) {
                    return setResponse.NOT_FOUND({message: "Matrix ou id não encontrado."});
                }

                await onda_followup.postFollowup({token: token, cod: data?.matrix, event: `Sucesso ao assinar o contrato com id: ${data?.id}`});
                return setResponse.DATABASE_ERROR({message: "Erro ao assinar o contrato"});
            });
    }

    async getOne({matrix}) {
        this.matrix = matrix;
        const contrato = await this.model
            .findOne({matrix: matrix}) // Procura o contrato pelo campo matrix
            .exec()
            .catch(async () => {
                return setResponse.DATABASE_ERROR({
                    message: "Erro ao buscar contrato no MongoDB!",
                });
            });

        this.imobiliaria_config = contrato || {assinatura_contratos: []};
        const result = (await this.#verificarSeJaEstaCadastrado()) || contrato;

        return result;
    }

    async getAll() {
        try {
            const contratos = await this.model
                .find() // Busca todos os contratos
                .exec();

            return contratos;
        } catch (err) {
            return setResponse.DATABASE_ERROR({
                message: "Erro ao buscar contratos no MongoDB!",
            });
        }
    }

    async #verificarSeJaEstaCadastrado() {
        const contratosPendentes = [
            {
                url_pdf_contrato: "novo-contrato-anexo1-para-assinatura-modal",
                assinado: false,
                data_assinatura: null,
                data_envio_assinatura: "2025-01-13T20:04:21.674Z",
                _id: "678571c57d08da111ad2f028",
            },
            {
                url_pdf_contrato: "novo-termo-comissao-para-assinatura-modal",
                assinado: false,
                data_assinatura: null,
                data_envio_assinatura: "2025-01-13T20:04:21.674Z",
                _id: "178571c57d08da111ad2f071",
            },
        ];

        const idsChegados = new Set(this.imobiliaria_config?.assinatura_contratos.map((item) => item._id.toString()));

        let inserirPendencias = false;
        if (idsChegados.size > 0) {
            contratosPendentes.filter((contrato) => {
                if (!idsChegados.has(contrato._id)) {
                    inserirPendencias = true;
                    this.imobiliaria_config?.assinatura_contratos.push(contrato);
                }
            });
        } else {
            inserirPendencias = true;
            contratosPendentes?.map((contrato) => this.imobiliaria_config.assinatura_contratos.push(contrato));
        }

        idsChegados.clear();

        if (inserirPendencias) {
            return await this.#inserirPendenciaCadastro();
        }

        return;
    }

    async #inserirPendenciaCadastro() {
        this.data = {
            ...this.data,
            matrix: this.matrix,
            assinatura_contratos: this.imobiliaria_config?.assinatura_contratos,
        };
        return await this.findOneAndUpdate({data: this.data, token: this.token});
    }

    async buscarAssinaturaContratoPeloId({matrix, id}) {
        const objectId = ObjectId.createFromHexString(id);

        try {
            const result = await this.model.findOne(
                {
                    matrix,
                    "assinatura_contratos._id": objectId,
                },
                {
                    "assinatura_contratos.$": 1,
                }
            );

            if (!result) {
                return setResponse.NOT_FOUND({
                    message: "Contrato não encontrado",
                });
            }

            return result.assinatura_contratos[0];
        } catch (err) {
            return;
        }
    }
};

export default new onda_imobiliaria_config();
