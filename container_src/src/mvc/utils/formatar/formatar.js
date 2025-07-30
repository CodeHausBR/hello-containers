//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
//BANCO DE DADOS

//SERVICES

const utilsFormatar = class utilsFormatar {
    static formatarNomeLocatario(name = String()) {
        // Lista de palavras que não devem ser capitalizadas (exceto se forem a primeira palavra)
        const lowercaseWords = ["de", "da", "do", "das", "dos", "e", "a", "o"];

        // Divide o nome em palavras
        const words = name.toLowerCase().split(" ");

        // Formata cada palavra
        const formattedWords = words.map((word, index) => {
            // Sempre capitaliza a primeira palavra do nome
            if (index === 0) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }

            // Verifica se a palavra está na lista de exceções
            if (lowercaseWords.includes(word)) {
                return word;
            }

            // Capitaliza a primeira letra das outras palavras
            return word.charAt(0).toUpperCase() + word.slice(1);
        });

        // Junta as palavras de volta em uma string
        return formattedWords.join(" ");
    }

    static ddmmyyyyToYyyymmdd(data = string) {
        const [dia, mes, ano] = data.split("/");
        return `${ano}-${mes}-${dia}`;
    }

    static removerCaracteresEspeciaisEEspacos(value = String()) {
        if (typeof value !== "string") return "";

        return value.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s/g, "");
    }
    static formatarTelefone(numero) {
        if (!numero) {
            return "numero inválido";
        }
        const apenasNumeros = numero.replace(/\D/g, "");

        if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
            return numero;
        }

        const ddd = apenasNumeros.slice(0, 2);
        const parte1 = apenasNumeros.length === 11 ? apenasNumeros.slice(2, 7) : apenasNumeros.slice(2, 6);
        const parte2 = apenasNumeros.length === 11 ? apenasNumeros.slice(7) : apenasNumeros.slice(6);

        return `(${ddd}) ${parte1}-${parte2}`;
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

    static abreviarNome(nomeCompleto = String(), limiteCaracteres = Number()) {
        const palavras = nomeCompleto.split(" ");
        const ignorar = ["de", "da", "do", "das", "dos", "e"];

        const primeiroNome = palavras[0];
        const ultimoNome = palavras[palavras.length - 1];

        let nomesDoMeio = palavras
            .slice(1, -1)
            .map((palavra) => {
                if (ignorar.includes(palavra.toLowerCase())) {
                    return palavra;
                }
                return palavra.charAt(0);
            })
            .join(" ");

        let nomeFinal = primeiroNome + " " + nomesDoMeio + " " + ultimoNome;

        if (nomeFinal.length > limiteCaracteres) {
            const limite = limiteCaracteres - (primeiroNome.length + ultimoNome.length + 2);
            nomesDoMeio = nomesDoMeio.slice(0, limite);
            nomeFinal = primeiroNome + " " + nomesDoMeio + ultimoNome;
        }

        return nomeFinal
            .trim()
            .replace(/[\u0300-\u036f]/g, "")
            ?.replace(/[^a-zA-Z0-9\s]/g, "");
    }

    static formatarData(data) {
        if (!data) {
            return "";
        }
        const newDate = new Date(data);
        const formatada = newDate.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour12: false,
        });
        return formatada;
    }
};

export default utilsFormatar;
