//BIBLIOTECAS
import * as dotenv from "dotenv";
dotenv.config();
import yup from "yup";

//HELPERS
import yupSchemaValidate from "../../geral/yup-schema-validate.js";
import setResponse from "../../response/setResponse.js";
import onda_errors from "../../../mvc/models/public/onda_errors.js";

//BANCO DE DADOS
import onda_serpro_cpf from "../../../mvc/models/mongoose/onda_serpro_cpf.js";
import onda_serpro_cnpj from "../../../mvc/models/mongoose/onda_serpro_cnpj.js";

let serproToken = null;

const apiSerpro = class apiSerpro {
    static async geraToken() {
        try {
            const credentials = `${"aPzOYW7p7uJ34k4h_Ln9jzTnitQa"}:${"JXjUKjDP8vPYF2Ft1cMJIRfS8RAa"}`;
            const base64Credentials = Buffer.from(credentials).toString("base64");

            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Basic ${base64Credentials}`);
            myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

            const body = new URLSearchParams();
            body.append("grant_type", "client_credentials");

            const response = await fetch(`${"https://gateway.apiserpro.serpro.gov.br" + "/token"}`, {
                method: "POST",
                headers: myHeaders,
                body: body.toString(),
            });
            const data = await response.json();

            serproToken = data;

            process.stdout.write("Sucesso ao gerar novo token SERPRO!\n");

            // return data;
        } catch (error) {
            process.stdout.write("Erro ao gerar novo token SERPRO! " + error + "\n");
            await onda_errors.postNotRes({classe: "apiSerpro", statico: "geraToken", message: error});
        }
    }

    static getToken() {
        return serproToken;
    }

    static async consultaPeloCpf({cpfCnpj, res}) {
        const dadosValidados = await this.validarCpfCnpj(cpfCnpj);

        const newCpfCnpj = dadosValidados?.cpfCnpj;

        let retornarHistoricoBanco;

        let url;
        if (newCpfCnpj.length === 11) {
            retornarHistoricoBanco = await onda_serpro_cpf.getOne({documento: newCpfCnpj});
            url = `${"https://gateway.apiserpro.serpro.gov.br"}/consulta-cpf-df/v1/cpf/${newCpfCnpj}`;
        } else if (newCpfCnpj.length === 14) {
            retornarHistoricoBanco = await onda_serpro_cnpj.getOne({documento: newCpfCnpj});
            url = `${"https://gateway.apiserpro.serpro.gov.br"}/consulta-cnpj-df/v2/basica/${newCpfCnpj}`;
        } else {
            return setResponse.SERVER_ERROR({message: "Erro ao buscar CPF/CNPJ!", res: res});
        }

        if (retornarHistoricoBanco) return retornarHistoricoBanco;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${serproToken?.access_token}`,
                },
            });

            if (!response?.ok) {
                /*
                Status 400: CPF/CNPJ inválido
                Status 404: Válido não encontrado
                */
                if (response.status === 400) {
                    return setResponse.WARNING({message: "CPF/CNPJ inválido!", res: res});
                } else if (response.status == 404) {
                    return setResponse.WARNING({message: "CPF/CNPJ não encontrado!", res: res});
                } else if (response.status == 422) {
                    return setResponse.WARNING({message: "LGPD: Dados de Menor de Idade!", res: res});
                } else if (response.status == 500 || response.status == 504 || response.status == 401 || response.status == 403) {
                    return setResponse.WARNING({message: "API indisponível!", res: res});
                }
            }
            const resultSerpro = await response.json();

            if (newCpfCnpj.length === 11) {
                await onda_serpro_cpf.post({data: resultSerpro, cpfCnpj: newCpfCnpj});
                return await onda_serpro_cpf.getOne({documento: newCpfCnpj});
            } else {
                await onda_serpro_cnpj.post({data: resultSerpro, cpfCnpj: newCpfCnpj});
                return await onda_serpro_cnpj.getOne({documento: newCpfCnpj});
            }
        } catch (error) {
            await onda_errors.postNotRes({classe: "apiSerpro", statico: "consultaPeloCpf", message: JSON.stringify(error)?.slice(0, 4900)});
            return setResponse.WARNING({message: "API indisponível!", res: res});
        }
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
                    return !specialCharRegex.test(value);
                })
                .test("cpf-cnpj", "CPF/CNPJ inválido", function (value) {
                    if (!value) return false;

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
};

export default apiSerpro;
