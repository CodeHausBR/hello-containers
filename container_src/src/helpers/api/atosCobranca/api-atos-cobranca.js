//BIBLIOTECAS
import * as yup from "yup";
import "dotenv/config";

//HELPERS
import yupSchemaValidate from "../../geral/yup-schema-validate.js";
import setResponse from "../../response/setResponse.js";
import executarQuery from "../../../mvc/utils/mysql/funcoesQuery/executarQuery.js";
//BANCO DE DADOS
import onda_followup from "../../../mvc/models/public/onda_followup.js";
//SERVICES
const BASE_URL_WAVE_ATOS_COBRANCA = process.env.BASE_URL_WAVE_ATOS_COBRANCA;
const SK_TOKEN_CLIENT_ATOS_COBRANCA = process.env.SK_TOKEN_CLIENT_ATOS_COBRANCA;
const SK_TOKEN_COMPANY_ATOS_COBRANCA = process.env.SK_TOKEN_COMPANY_ATOS_COBRANCA;

const apiAtosCobranca = class apiAtosCobranca {
    static async validate({dadosDevedor}) {
        const schema = yup.object().shape({
            data: yup
                .object()
                .shape({
                    type_check: yup.number(), //.required("Type check é obrigatório"),
                    devedores: yup
                        .array()
                        .of(
                            yup.object().shape({
                                razao_social: yup.string().required("Razão social é obrigatória"),
                                fantasia: yup.string(),
                                documento: yup.string().required("Documento é obrigatório"),
                                codigo_externo: yup.string(),
                                emails: yup.array().of(
                                    yup.object().shape({
                                        email: yup.string().email("E-mail inválido"), //.required("E-mail é obrigatório"),
                                        principal: yup.boolean(), //.required("Campo principal é obrigatório"),
                                    })
                                ), //.required("Emails são obrigatórios"),
                                enderecos: yup.array().of(
                                    yup.object().shape({
                                        logradouro: yup.string(),
                                        numero: yup.string(),
                                        complemento: yup.string(),
                                        bairro: yup.string(),
                                        cep: yup.string(),

                                        cidade: yup.string(),
                                        uf: yup.string(),
                                        principal: yup.boolean(),
                                    })
                                ),
                                telefones: yup.array().of(
                                    yup.object().shape({
                                        nome_contato: yup.string(),
                                        numero: yup.string(),
                                        tipo: yup.string(),
                                    })
                                ),
                                campos_adicionais: yup.array().of(yup.array().of(yup.string())),
                                titulos: yup.array().of(
                                    yup.object().shape({
                                        atualizar: yup.boolean(),
                                        numero: yup.string(),
                                        parcela: yup.string(),
                                        especie: yup.string(),
                                        vencimento: yup.date(),
                                        valor: yup.number(),
                                        data_doc: yup.date(),
                                        obs: yup.string(),
                                        campos_adicionais: yup.array().of(yup.array().of(yup.string())),
                                    })
                                ),
                            })
                        )
                        .required("Devedores são obrigatórios"),
                })
                .required("Objeto inválido"),
        });

        return await yupSchemaValidate(schema, dadosDevedor, {abortEarly: false});
    }

    static async postCobranca({dadosDevedor, token, codCobranca, codSinistro}) {
        const dadosValidados = await this.validate({dadosDevedor: dadosDevedor});

        const raw = JSON.stringify(dadosValidados);        

        const options = {
            method: "POST",
            headers: this.header(),
            body: raw,
            redirect: "follow",
        };

        const results = await fetch(`${BASE_URL_WAVE_ATOS_COBRANCA}/cli/devedores/cadastrar`, options)
            .then((response) => response.json())
            .then(async (response) => {
                await Promise.all([
                    onda_followup.postFollowup({token: token, cod: codCobranca, event: `*Sucesso ao cadastrar cobrança na ATOS!`}),
                    onda_followup.postFollowup({token: token, cod: codSinistro, event: `*Sucesso ao cadastrar cobrança na ATOS!`})
                ])

                return response;
            })
            .catch(async (err) => {
                await Promise.all([
                     onda_followup.postFollowup({token: token, cod: codCobranca, event: `*Erro ao cadastrar cobrança na ATOS!`}),
                     onda_followup.postFollowup({token: token, cod: codSinistro, event: `*Erro ao cadastrar cobrança na ATOS!`})
                ])
            });

        return results;
    }

    static async getCobrancas() {
        const options = {
            method: "GET",
            headers: this.header(),
            // body: {},
            redirect: "follow",
        };

        const results = await fetch(`${BASE_URL_WAVE_ATOS_COBRANCA}/cli/titulos/listar`, options)
            .then((response) => response.json())
            .then(async (response) => {
                // await onda_followup.postFollowup({token: token, cod: codCobranca, event: `*Sucesso ao listar cobranças da ATOS!`});
                return response;
            })
            .catch(async (err) => {
                console.log(err, "err");
                
                // await onda_followup.postFollowup({token: token, cod: codCobranca, event: `*Erro ao listar cobranças da ATOS!`});
                return setResponse.INTERNAL_REQUEST_API_FAILED({message:"Falha ao retornar titulos da Atos"})
            });

        return results;
    }

    static async sincronizarStatusCobrancaAtosXWave() {
        // Construa a query de atualização

        const getArrayDevedoresAtos = await this.getCobrancas();

        try {
            const arrayDevedoresAtos = [
                {
                    id_titulo: "58612103-85fb-ffd3-92e1-5d653a4d4b6f",
                    data_cadastro: "2023-03-10",
                    numero_titulo: "NF 15000", // MANDAR O NUMERO DA COBRANÇA NO SISTEMA COB-213124635545243-2024
                    parcela: "001",
                    especie: "Duplicata",
                    vencimento: "2023-03-10",
                    valor: 150.25, // VALOR TOTAL DOS ITENS ABERTOS VERIFICAR PORQUE OQUE FOI ABERTO NÃO É OQUE VAI SER COBRADO!
                    protesto: 0,
                    saldo_capital: 150.25,
                    saldo_protesto: 0,
                    status: "aberto",
                    obs: "",
                    moeda: "R$",
                    usuario_cad: "Pedro",
                    usuario_tipo: "Colaborador",
                    data_documento: "2023-03-01",
                    data_quitacao: null,
                    data_devolução: null,
                    data_baixa: null,
                    last_update: "2023-05-03T22:56:57.499Z",
                    campos_adicionais: {},
                    devedor: {
                        id_devedor: "61cba82a-2190-4d1d-b05e-a9ddcd26s9c1",
                        processo: "1/00001",
                        codigo_externo: "", // COD DO LOCATATÁRIO NO SISTEMA LOCA-1052669874694-2024
                        razao_social: "Chuck Norris",
                        documento: "000.000.000-01",
                    },
                },
            ];

            const updateCases = arrayDevedoresAtos.map(({numero_titulo, status}) => `WHEN ${numero_titulo} THEN '${status}'`).join(" ");

            const cods = arrayDevedoresAtos.map(({numero_titulo}) => numero_titulo).join(", ");

            const query = `
                UPDATE onda_sinistro_cobranca
                SET onda_sinistro_cobranca_status_api_cobranca = CASE onda_sinistro_cobranca_cod
                  ${updateCases}
                END
                WHERE onda_sinistro_cobranca_cod IN (${cods});
            `;

            await executarQuery(query).catch(() => {
                return setResponse.DATABASE_ERROR({message: "Erro ao sincronizar status com cobrança ATOS!"});
            });
        } catch (error) {
            return setResponse.DATABASE_ERROR({message: "Erro ao sincronizar status com ATOS!"});
        }
        return;
    }

    static async baixarTitulosAtosPeloCodigo({tituloAtos, token}) {
        
        const baixarCobranca = {
            data: {
                titulos: [
                    {
                        // "000.000.000-01",
                        codigo_externo_devedor: tituloAtos?.codigo_externo_devedor, //"",
                        data_baixa: tituloAtos?.data_baixa, // "2023-03-01",
                        documento_devedor: tituloAtos?.documento_devedor,
                        especie: tituloAtos?.especie, //Sinistro
                        motivo_baixa: tituloAtos?.motivo_baixa, // "Descrição do motivo",
                        numero: tituloAtos?.numero, // "OSC-.... código interno da cobranca",
                        parcela: tituloAtos?.parcela, // "001",
                        validar_valor: tituloAtos?.validar_valor, // true,
                        valor: tituloAtos?.valor, // 150.25,
                        valor_pago: tituloAtos?.valor_pago, // 0,
                        vencimento: tituloAtos?.vencimento, // "2023-03-01",
                    },
                ],
                type_check: 1,
            },
        };


        const raw = JSON.stringify(baixarCobranca);

        const options = {
            method: "PUT",
            headers: this.header(),
            body: raw,
            redirect: "follow",
        };

        const results = await fetch(`${BASE_URL_WAVE_ATOS_COBRANCA}/cli/titulos/baixar`, options)
            .then((response) => response.json())
            .then(async (response) => {
                await onda_followup.postFollowup({token: token, cod: tituloAtos?.numero, event: `*Sucesso ao baixar cobrança na ATOS!`});
                return response;
            })
            .catch(async (err) => {
                await onda_followup.postFollowup({token: token, cod: tituloAtos?.numero, event: `*Erro ao baixar cobrança na ATOS!`});
            });

        return results;
    }

    static executarSinconizacaoAtos() {
        const tresHorasEmMilissegundos = 3 * 60 * 60 * 1000;

        return setInterval(this.sincronizarStatusCobrancaAtosXWave(), tresHorasEmMilissegundos);
    }

    static header() {
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");
        myHeaders.append("content-type", "application/json");
        myHeaders.append("token_company", `${SK_TOKEN_COMPANY_ATOS_COBRANCA}`);
        myHeaders.append("token_client", `${SK_TOKEN_CLIENT_ATOS_COBRANCA}`);

        return myHeaders;
    }
};

export default apiAtosCobranca;

//Status "aberto" "quitado" "devolvio" "baixado"

// const dadosDevedor = {
//     data: {
//         type_check: 1,
//         devedores: [
//             {
//                 razao_social: "João da Silva",
//                 fantasia: "João",
//                 documento: "000.000.000-01",
//                 codigo_externo: "",
//                 emails: [
//                     {
//                         email: "joao@email.com.br",
//                         principal: true,
//                     },
//                 ],
//                 enderecos: [
//                     {
//                         logradouro: "Av. Brasil",
//                         numero: "123",
//                         complemento: "Apto 100",
//                         bairro: "Centro",
//                         cep: "00000-000",
//                         cidade: "São Paulo",
//                         uf: "SP",
//                         principal: true,
//                     },
//                 ],
//                 telefones: [
//                     {
//                         nome_contato: "",
//                         numero: "(48) 99999-0000",
//                         tipo: "MÓVEL",
//                     },
//                 ],
//                 campos_adicionais: [["PERFIL A", "NEGATIVADO"]],
//                 titulos: [
//                     {
//                         atualizar: false,
//                         numero: "NF 15000",
//                         parcela: "001",
//                         especie: "Duplicata",
//                         vencimento: "2023-03-10",
//                         valor: 150.25,
//                         data_doc: "2023-03-01",
//                         obs: "",
//                         campos_adicionais: [[""]],
//                     },
//                 ],
//             },
//         ],
//     },
// }
