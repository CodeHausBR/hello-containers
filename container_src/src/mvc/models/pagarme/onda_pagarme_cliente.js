import "dotenv/config";
import mongoose from "mongoose";
import * as yup from "yup";

// Helpers
import setResponse from "../../../helpers/response/setResponse.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
const SK_PAGARME = process.env.SK_TOKEN_PAGARME;

const Schema = mongoose.Schema;

const onda_pagarme_cliente = class onda_pagarme_cliente {
    constructor() {
        const ClientSchema = new Schema(
            {
                id: {type: String},
                name: {type: String},
                email: {type: String},
                document: {type: String},
                document_type: {type: String},
                type: {type: String},
                delinquent: {type: Boolean},
                address: {
                    id: {type: String},
                    line_1: {type: String},
                    line_2: {type: String},
                    street: {type: String},
                    number: {type: String},
                    complement: {type: String},
                    zip_code: {type: String},
                    neighborhood: {type: String},
                    city: {type: String},
                    state: {type: String},
                    country: {type: String},
                    status: {type: String},
                    created_at: {type: Date},
                    updated_at: {type: Date},
                },
                created_at: {type: Date},
                updated_at: {type: Date},
                phones: {
                    home_phone: {
                        country_code: {type: String},
                        number: {type: String},
                        area_code: {type: String},
                    },
                    mobile_phone: {
                        country_code: {type: String},
                        number: {type: String},
                        area_code: {type: String},
                    },
                },
            },
            {
                timestamps: true,
            }
        );

        this.model = mongoose.model("onda_pagarme_cliente", ClientSchema);
    }

    //API PAGARME INICIO

    async apiGetAllClientes() {
        const pageSize = 30; // Quantidade de itens por página
        const requestsPerMinute = 100; // Limite de requisições por minuto
        const delayBetweenRequests = (60 * 1000) / requestsPerMinute; // Intervalo entre requisições em ms

        const options = {
            method: "GET",
            headers: {
                accept: "application/json",
                authorization: `${SK_PAGARME}`,
            },
        };

        // Função auxiliar para fazer requisição com delay
        const fetchWithDelay = async (url) => {
            const response = await fetch(url, options)
                .then((response) => response.json())
                .catch((err) => {
                    console.log(err, "err");
                    return setResponse.INTERNAL_REQUEST_API_FAILED({
                        message: "Erro ao buscar clientes no pagarme!",
                    });
                });

            // Aguarda o delay antes da próxima requisição
            await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
            return response;
        };

        // Primeira requisição para obter a quantidade total de itens
        const firstResponse = await fetchWithDelay(`https://api.pagar.me/core/v5/customers?page=1&size=${pageSize}`);

        // Pega a quantidade total de itens
        const quantidade = firstResponse?.paging?.total;

        // Calcula o número de páginas necessárias
        const totalPages = Math.ceil(quantidade / pageSize);

        // Array para armazenar todos os clientes
        let allClientes = [];

        // Adiciona os clientes da primeira página
        if (firstResponse?.data) {
            allClientes.push(...firstResponse.data);
        }

        // Para cada página restante, faça uma requisição com delay
        for (let page = 2; page <= totalPages; page++) {
            const response = await fetchWithDelay(`https://api.pagar.me/core/v5/customers?page=${page}&size=${pageSize}`);

            if (response?.data) {
                allClientes.push(...response.data);
            }
        }

        return allClientes;
    }

    //FINAL

    async validate({data}) {
        const schema = yup.object().shape({
            id: yup.string(),
            name: yup.string(),
            email: yup.string(),
            document: yup.string(),
            document_type: yup.string(),
            type: yup.string(),
            delinquent: yup.boolean(),
            address: yup.object().shape({
                id: yup.string(),
                line_1: yup.string(),
                line_2: yup.string(),
                street: yup.string(),
                number: yup.string(),
                complement: yup.string().nullable(),
                zip_code: yup.string(),
                neighborhood: yup.string(),
                city: yup.string(),
                state: yup.string(),
                country: yup.string(),
                status: yup.string(),
                created_at: yup.date(),
                updated_at: yup.date(),
            }),
            created_at: yup.date(),
            updated_at: yup.date(),
            phones: yup.object().shape({
                home_phone: yup.object().shape({
                    country_code: yup.string(),
                    number: yup.string(),
                    area_code: yup.string(),
                }),
                mobile_phone: yup.object().shape({
                    country_code: yup.string(),
                    number: yup.string(),
                    area_code: yup.string(),
                }),
            }),
        });

        return await yupSchemaValidate(schema, data, {abortEarly: false});
    }

    async create(data) {
        try {
            const dadosValidados = await this.validate({data});
            await this.model.updateOne({id: dadosValidados.id}, {$set: dadosValidados}, {upsert: true});

            return;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar/atualizar cliente no MongoDB!"});
        }
    }

    async getAll() {
        try {
            return await this.model.find();
        } catch (err) {
            throw new Error("Erro ao buscar registros.");
        }
    }

    async buscarTodosEnderecos() {
        try {
            const results = await this.model.aggregate([
                {
                    $project: {
                        document: "$document",
                        address: "$address.line_1",
                        uf: "$address.state",
                        cidade: "$address.city",
                        pais: "$address.country",
                        cep: "$address.zip_code",
                    },
                },
                {
                    $group: {
                        _id: "$document",
                        address: {$first: "$address"},
                        uf: {$first: "$uf"},
                        cidade: {$first: "$cidade"},
                        pais: {$first: "$pais"},
                        cep: {$first: "$cep"},
                    },
                },
            ]);

            return results;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar os registros."});
        }
    }

    async getOne(id) {
        try {
            return await this.model.findOne({id});
        } catch (err) {
            throw new Error("Erro ao buscar o registro.");
        }
    }

    async getOneByDocument(document) {
        try {
            return await this.model.findOne({document});
        } catch (err) {
            throw new Error("Erro ao buscar o registro.");
        }
    }

    async update(id, data) {
        try {
            return await this.model.findOneAndUpdate({id}, data, {new: true});
        } catch (err) {
            throw new Error("Erro ao atualizar o registro.");
        }
    }

    async delete(id) {
        try {
            return await this.model.findOneAndDelete({id});
        } catch (err) {
            console.error("Erro ao deletar o registro:", err);
            throw new Error("Erro ao deletar o registro.");
        }
    }
};

export default new onda_pagarme_cliente();
