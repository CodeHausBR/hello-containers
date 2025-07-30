import "dotenv/config";
import mongoose from "mongoose";
import * as yup from "yup";

//helpers
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import executarQueryComRollback from "../../utils/mysql/funcoesQuery/executarQueryComRollback.js";
const SK_PAGARME = process.env.SK_TOKEN_PAGARME;

//MODELS
import onda_errors from "../public/onda_errors.js";

const Schema = mongoose.Schema;

// Classe para o modelo
const onda_pagarme_cobranca = class onda_pagarme_cobranca {
    constructor() {
        const PaymentSchema = new Schema(
            {
                id: {type: String},
                code: {type: String},
                gateway_id: {type: String},
                amount: {type: Number},
                paid_amount: {type: Number},
                status: {type: String},
                currency: {type: String},
                payment_method: {type: String},
                paid_at: {type: Date},
                created_at: {type: Date},
                updated_at: {type: Date},
                pending_cancellation: {type: Boolean},

                customer: {
                    id: {type: String},
                    name: {type: String},
                    email: {type: String},
                    code: {type: String},
                    document: {type: String},
                    document_type: {type: String},
                    type: {type: String},
                    delinquent: {type: Boolean},
                    address: {
                        id: {type: String},
                        street: {type: String},
                        number: {type: String},
                        complement: {type: String, default: ""},
                        zip_code: {type: String},
                        neighborhood: {type: String},
                        city: {type: String},
                        state: {type: String},
                        country: {type: String},
                        status: {type: String},
                        created_at: {type: Date},
                        updated_at: {type: Date},
                        metadata: {type: Schema.Types.Mixed, default: {}},
                    },
                    created_at: {type: Date},
                    updated_at: {type: Date},
                    phones: {
                        home_phone: {
                            country_code: {type: String},
                            number: {type: String},
                            area_code: {type: String},
                        },
                    },
                    metadata: {type: Schema.Types.Mixed, default: {}},
                },

                order: {
                    id: {type: String},
                    code: {type: String},
                    amount: {type: Number},
                    closed: {type: Boolean},
                    created_at: {type: Date},
                    updated_at: {type: Date},
                    closed_at: {type: Date},
                    currency: {type: String},
                    status: {type: String},
                    customer_id: {type: String},
                    metadata: {type: Schema.Types.Mixed, default: {}},
                },

                checkout_payment: {
                    id: {type: String},
                    amount: {type: Number},
                    status: {type: String},
                    payment_url: {type: String},
                    billing_address_editable: {type: Boolean},
                    created_at: {type: Date},
                    updated_at: {type: Date},
                },

                last_transaction: {
                    transaction_type: {type: String},
                    pix_provider_tid: {type: String},
                    qr_code: {type: String},
                    qr_code_url: {type: String},
                    end_to_end_id: {type: String},
                    payer: {type: Schema.Types.Mixed, default: {}},
                    card: {type: Schema.Types.Mixed, default: {}},
                    expires_at: {type: Date},
                    id: {type: String},
                    gateway_id: {type: String},
                    amount: {type: Number},
                    status: {type: String},
                    success: {type: Boolean},
                    created_at: {type: Date},
                    updated_at: {type: Date},
                    gateway_response: {type: Schema.Types.Mixed, default: {}},
                    antifraud_response: {type: Schema.Types.Mixed, default: {}},
                    metadata: {type: Schema.Types.Mixed, default: {}},
                },
            },
            {
                timestamps: true,
            }
        );

        this.model = mongoose.model("onda_pagarme_cobranca", PaymentSchema);
    }

    //API PAGARME INICIO

    async apiGetAllCobrancas() {
        const pageSize = 30; // Quantidade de itens por página
        const options = {
            method: "GET",
            headers: {
                accept: "application/json",
                authorization: `Basic ${SK_PAGARME}`,
            },
        };

        // Primeiro, faça uma requisição para obter a quantidade total de itens
        const firstResponse = await fetch(`https://api.pagar.me/core/v5/charges?page=1&size=${pageSize}`, options)
            .then((response) => response.json())
            .catch((err) => {
                return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao buscar cobranças no pagarme!"});
            });

        // Pega a quantidade total de itens
        const quantidade = firstResponse?.paging?.total;

        // Calcula o número de páginas necessárias
        const totalPages = Math.ceil(quantidade / pageSize);

        // Array para armazenar todas as cobranças
        let allClientes = [];

        // Adiciona as cobranças da primeira página
        if (firstResponse?.data) {
            allClientes.push(...firstResponse.data);
        }

        // Para cada página restante, faça uma requisição
        for (let page = 2; page <= totalPages; page++) {
            const response = await fetch(`https://api.pagar.me/core/v5/charges?page=${page}&size=${pageSize}`, options)
                .then((response) => response.json())
                .catch((err) => {
                    return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao buscar cobranças no pagarme!"});
                });

            if (response?.data) {
                allClientes.push(...response.data);
            }
        }

        // Retorna todas as cobranças juntas
        return allClientes;
    }
    async apiGetAllCobrancasCartaDeCredito() {
        const pageSize = 30; // Quantidade de itens por página
        const options = {
            method: "GET",
            headers: {
                accept: "application/json",
                authorization: `${SK_PAGARME}`,
            },
        };

        // Primeiro, faça uma requisição para obter a quantidade total de itens
        const firstResponse = await fetch(`https://api.pagar.me/core/v5/charges?status=paid&payment_method=credit_card&size=${pageSize}`, options)
            .then((response) => response.json())
            .catch((err) => {
                return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao buscar cobranças no pagarme!"});
            });

        // Pega a quantidade total de itens
        const quantidade = firstResponse?.paging?.total;

        // Calcula o número de páginas necessárias
        const totalPages = Math.ceil(quantidade / pageSize);
        // const totalPages = 1;

        // Array para armazenar todas as cobranças
        let allClientes = [];

        // Adiciona as cobranças da primeira página
        if (firstResponse?.data) {
            allClientes.push(...firstResponse.data);
        }

        // Para cada página restante, faça uma requisição
        for (let page = 2; page <= totalPages; page++) {
            const response = await fetch(`https://api.pagar.me/core/v5/charges??status=paid&payment_method=credit_card&page=${page}&size=${pageSize}`, options)
                .then((response) => response.json())
                .catch((err) => {
                    return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao buscar cobranças no pagarme!"});
                });

            if (response?.data) {
                allClientes.push(...response.data);
            }

            if (page <= totalPages) {
                await new Promise((resolve) => setTimeout(resolve, 60000 / 200));
            }
        }

        const listCode = allClientes?.reduce((acc, item) => {
            const alreadyIncluded = acc.some((entry) => entry.code === item?.code);

            if (item?.code && item?.status === "paid" && !alreadyIncluded) {
                acc.push({code: item.code, paid_at: item.paid_at});
            }
            return acc;
        }, []);

        // Retorna todas as cobranças juntas

        return {allClientes, listCode};
    }

    //FINAL

    async validate({data}) {
        const schema = yup.object().shape({
            id: yup.string(),
            code: yup.string(),
            gateway_id: yup.string(),
            amount: yup.number(),
            paid_amount: yup.number(),
            status: yup.string(),
            currency: yup.string(),
            payment_method: yup.string(),
            paid_at: yup.date(),
            created_at: yup.date(),
            updated_at: yup.date(),
            pending_cancellation: yup.boolean(),

            customer: yup.object().shape({
                id: yup.string(),
                name: yup.string(),
                email: yup.string().email(),
                code: yup.string(),
                document: yup.string(),
                document_type: yup.string(),
                type: yup.string(),
                delinquent: yup.boolean(),
                address: yup.object().shape({
                    id: yup.string(),
                    street: yup.string(),
                    number: yup.string(),
                    complement: yup.string().default(""),
                    zip_code: yup.string(),
                    neighborhood: yup.string(),
                    city: yup.string(),
                    state: yup.string(),
                    country: yup.string(),
                    status: yup.string(),
                    created_at: yup.date(),
                    updated_at: yup.date(),
                    metadata: yup.mixed(),
                }),
                created_at: yup.date(),
                updated_at: yup.date(),
                phones: yup.object().shape({
                    home_phone: yup.object().shape({
                        country_code: yup.string(),
                        number: yup.string(),
                        area_code: yup.string(),
                    }),
                }),
                metadata: yup.mixed(),
            }),

            order: yup.object().shape({
                id: yup.string(),
                code: yup.string(),
                amount: yup.number(),
                closed: yup.boolean(),
                created_at: yup.date(),
                updated_at: yup.date(),
                closed_at: yup.date(),
                currency: yup.string(),
                status: yup.string(),
                customer_id: yup.string(),
                metadata: yup.mixed(),
            }),

            checkout_payment: yup.object().shape({
                id: yup.string(),
                amount: yup.number(),
                status: yup.string(),
                payment_url: yup.string().url(),
                billing_address_editable: yup.boolean(),
                created_at: yup.date(),
                updated_at: yup.date(),
            }),

            last_transaction: yup.object().shape({
                transaction_type: yup.string(),
                pix_provider_tid: yup.string(),
                qr_code: yup.string(),
                qr_code_url: yup.string().url(),
                end_to_end_id: yup.string(),
                payer: yup.mixed(),
                card: yup.mixed(),
                expires_at: yup.date(),
                id: yup.string(),
                gateway_id: yup.string(),
                amount: yup.number(),
                status: yup.string(),
                success: yup.boolean(),
                created_at: yup.date(),
                updated_at: yup.date(),
                gateway_response: yup.object().default({}),
                antifraud_response: yup.object().default({}),
                metadata: yup.mixed(),
            }),
        });

        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async create(data) {
        try {
            const dadosValidados = await this.validate({data: data});
            await this.model.updateOne({id: dadosValidados?.id}, {$set: dadosValidados}, {upsert: true});

            return;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_pagarme_cobranca", statico: "create", message: err});
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar no mongodb pagarme!"});
        }
    }

    async getAll() {
        try {
            return await this.model.find();
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranças pagarme!"});
        }
    }

    async getPeloCod({code}) {
        try {
            return await this.model.find({code});
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobrança pagarme!"});
        }
    }

    async update(id, data) {
        try {
            return await this.model.findOneAndUpdate({id}, data, {new: true});
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar cobrança pagarme!"});
        }
    }

    async delete(id) {
        try {
            return await this.model.findOneAndDelete({id});
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao deletar cobrança pagarme!"});
        }
    }

    async sincPaidCreditCard(listCode = Array()) {
        const sql = new Array()

        listCode?.map((item) => {
            sql.push(`
                UPDATE onda_pay
                SET onda_pay_status = 506, onda_pay_datapagamento = '${item?.paid_at}'
                WHERE onda_pay_contrato = '${item?.code}' 
                AND onda_pay_helpers_tipo_conta_id = 241 
                AND onda_pay_tipopagamento = 2;
            `)
        });

        // console.log(sql, "sql");

        const results = await executarQueryComRollback.executarQueryRollback({querys: sql}).catch(async (error) => {
            console.log(error, 'error');

            await onda_errors.postNotRes({
                classe: "onda_pagarme_cobranca",
                statico: "sincPaidCreditCard",
                message: JSON.stringify(error)?.slice(0, 4900),
            });
        });

        console.log(results, "results");

        return;
    }
};

export default new onda_pagarme_cobranca();

// Definição do Schema
