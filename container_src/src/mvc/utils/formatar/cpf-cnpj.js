//BIBLIOTECAS
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS

//SERVICES

const cpfCnpj = class cpfCnpj {
    static formatarCpf(cpf) {
        var Soma;
        var Resto;
        Soma = 0;
        if (cpf == "00000000000") return false;

        for (let i = 1; i <= 9; i++) Soma = Soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        Resto = (Soma * 10) % 11;

        if (Resto == 10 || Resto == 11) Resto = 0;
        if (Resto != parseInt(cpf.substring(9, 10))) return false;

        Soma = 0;
        for (let i = 1; i <= 10; i++) Soma = Soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        Resto = (Soma * 10) % 11;

        if (Resto == 10 || Resto == 11) Resto = 0;
        if (Resto != parseInt(cpf.substring(10, 11))) return false;
        return true;
    }

    static formatarCnpj(cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, "");

        if (cnpj.length != 14) return false;

        var tamanhoTotal = cnpj.length - 2;
        var cnpjSemDigitos = cnpj.substring(0, tamanhoTotal);
        var digitosVerificadores = cnpj.substring(tamanhoTotal);
        var soma = 0;
        var pos = tamanhoTotal - 7;
        for (i = tamanhoTotal; i >= 1; i--) {
            soma += cnpjSemDigitos.charAt(tamanhoTotal - i) * pos--;
            if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado != digitosVerificadores.charAt(0)) return false;

        tamanhoTotal = tamanhoTotal + 1;
        cnpjSemDigitos = cnpj.substring(0, tamanhoTotal);
        soma = 0;
        pos = tamanhoTotal - 7;
        for (i = tamanhoTotal; i >= 1; i--) {
            soma += cnpjSemDigitos.charAt(tamanhoTotal - i) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado != digitosVerificadores.charAt(1)) return false;

        return true;
    }

    static validar(cnpjcpf) {
        if (cnpjcpf.length <= 14) {
            documento = "Cpj";
            validacao = this.formatarCpf(cnpjcpf);
        }
        if (cnpjcpf > 14) {
            documento = "Cnpj";
            validacao = this.formatarCpf(cnpjcpf);
        }

        if (validacao == true) {
            return setResponse.WARNING({message: `O ${documento}: ${cnpjcpf} não é válido!`});
        }
    }

    static formatarCpfCnpj(documento) {
        // Remove todos os caracteres que não são números
        const documentoLimpo = String(documento)
            ?.trim()
            ?.replace(/[^a-zA-Z0-9]/g, "");

        // Verifica a quantidade de dígitos para formatar corretamente
        if (documentoLimpo.length === 11) {
            // CPF: 000.000.000-00
            return documentoLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        } else if (documentoLimpo.length === 14) {
            // CNPJ: 00.000.000/0000-00
            return documentoLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        } else {
            // Caso o número de dígitos não seja de um CPF ou CNPJ
            return "Documento inválido";
        }
    }
};

export default cpfCnpj;
