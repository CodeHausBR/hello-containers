import mongoose from "mongoose";
import * as yup from "yup";
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//MODELS
import onda_followup from "../public/onda_followup.js";

const Schema = mongoose.Schema;

const onda_pagarme_pedido = class onda_pagarme_pedido {
    constructor() {
        const PhoneSchema = new Schema({
            country_code: {type: String, required: true},
            number: {type: String, required: true},
            area_code: {type: String, required: true},
        });

        const AddressSchema = new Schema({
            id: {type: String, required: true},
            street: {type: String, required: true},
            number: {type: String, required: true},
            complement: {type: String, default: ""},
            zip_code: {type: String, required: true},
            neighborhood: {type: String, required: true},
            city: {type: String, required: true},
            state: {type: String, required: true},
            country: {type: String, required: true},
            status: {type: String, required: true},
            created_at: {type: Date, required: true},
            updated_at: {type: Date, required: true},
        });

        const CustomerSchema = new Schema({
            id: {type: String, required: true},
            name: {type: String, required: true},
            email: {type: String, required: true},
            code: {type: String, required: true},
            document: {type: String, required: true},
            document_type: {type: String, required: true},
            type: {type: String, required: true},
            delinquent: {type: Boolean, required: true},
            address: {type: AddressSchema, required: true},
            created_at: {type: Date, required: true},
            updated_at: {type: Date, required: true},
            phones: {
                home_phone: {type: PhoneSchema, required: true},
            },
        });

        const ItemSchema = new Schema({
            id: {type: String, required: true},
            type: {type: String, required: true},
            description: {type: String, required: true},
            amount: {type: Number, required: true},
            quantity: {type: Number, required: true},
            status: {type: String, required: true},
            created_at: {type: Date, required: true},
            updated_at: {type: Date, required: true},
            code: {type: String, required: true},
        });

        const CheckoutSchema = new Schema({
            id: {type: String, required: true},
            currency: {type: String, required: true},
            amount: {type: Number, required: true},
            status: {type: String, required: true},
            default_payment_method: {type: String, required: true},
            payment_url: {type: String, required: true},
            customer_editable: {type: Boolean, required: true},
            required_fields: [{type: String, required: true}],
            billing_address_editable: {type: Boolean, required: true},
            skip_checkout_success_page: {type: Boolean, required: true},
            shippable: {type: Boolean, required: true},
            created_at: {type: Date, required: true},
            updated_at: {type: Date, required: true},
            expires_at: {type: Date, required: true},
            accepted_payment_methods: [{type: String, required: true}],
            accepted_brands: [{type: String, required: true}],
            accepted_multi_payment_methods: [{type: [String], required: true}],
            customer: {type: CustomerSchema, required: true},
            credit_card: {
                capture: {type: Boolean, required: true},
                authentication: {
                    type: {
                        type: String,
                        required: true,
                    },
                    threed_secure: {type: Schema.Types.Mixed},
                },
                installments: [
                    {
                        number: {type: Number, required: true},
                        total: {type: Number, required: true},
                    },
                ],
            },
            debit_card: {
                authentication: {
                    type: {
                        type: String,
                        required: true,
                    },
                    threed_secure: {
                        mpi: {type: String, required: true},
                        success_url: {type: String, required: true},
                    },
                },
            },
            boleto: {
                due_at: {type: Date, required: true},
                instructions: {type: String, required: true},
            },
            pix: {
                expires_at: {type: Date, required: true},
                additional_information: [
                    {
                        name: {type: String, required: true},
                        value: {type: String, required: true},
                    },
                ],
            },
            billing_address: {type: Schema.Types.Mixed, default: {}},
            metadata: {type: Schema.Types.Mixed, default: {}},
        });

        const pedidoSchema = new Schema({
            id: {type: String, required: true},
            code: {type: String, required: true},
            amount: {type: Number, required: true},
            currency: {type: String, required: true},
            closed: {type: Boolean, required: true},
            items: [{type: ItemSchema, required: true}],
            customer: {type: CustomerSchema, required: true},
            status: {type: String, required: true},
            created_at: {type: Date, required: true},
            updated_at: {type: Date, required: true},
            checkouts: [{type: CheckoutSchema, required: true}],
        });

        this.model = mongoose.model("onda_pagarme_pedido", pedidoSchema);
    }

    async create({data, token}) {
        try {
            await this.model.updateOne({id: data.id}, {$set: data}, {upsert: true});
            await onda_followup.postFollowup({token: token, cod: data?.code, event: `*Sucesso ao cadastrar/atualizar pedido, PAGARME!`});

            return;
        } catch (err) {
            await onda_followup.postFollowup({token: token, cod: data?.code, event: `*Erro ao cadastrar/atualizar pedido, PAGARME!`});
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar/atualizar pedido no MongoDB!"});
        }
    }

    async getAll() {
        try {
            return await this.model.find().sort({created_at: -1});
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pedidos no MongoDB!"});
        }
    }

    async getOne({code}) {
        try {
            return await this.model.find({code}).sort({created_at: -1});
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar pedido no MongoDB!"});
        }
    }

    async update({id, data}) {
        try {
            return await this.model.findOneAndUpdate({id}, data, {new: true});
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar pedidos no MongoDB!"});
        }
    }

    async delete({id}) {
        try {
            return await this.model.findOneAndDelete({id});
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao deletar pedido no MongoDB!"});
        }
    }
};

export default new onda_pagarme_pedido();
