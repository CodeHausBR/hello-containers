const formatarBoleto = class formatarBoleto {
    static linhaDigitavel({text = String()}) {
        const linha = text.replace(/\D/g, "");
        return linha.replace(/^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})$/, "$1.$2 $3.$4 $5.$6 $7 $8");
    }

    static nossoNumero({text = String()}) {
        const linha = text.replace(/\D/g, "");
        return linha.replace(/^(\d{2})(\d{6})(\d{1})$/, "$1/$2-$3");
    }

    static agenciaCodigoBeneficiario({agencia = String(), posto = String(), convenio = String()}) {
        let text = `${agencia}${posto}${convenio}`;
        text = text.replace(/^\D/g, "");
        return text.replace(/^(\d{4})(\d{2})(\d{5})$/, "$1.$2.$3");
    }

    static removerAcentuacaoDeTexto(text = String()) {
        // Normaliza a string para decompor os caracteres especiais
        if (typeof text !== "string") return text;

        let normalizedStr = text.normalize("NFD");

        // Remove os diacríticos (acentos) usando uma expressão regular
        let cleanStr = normalizedStr.replace(/[\u0300-\u036f]/g, "")?.replace(/[^a-zA-Z0-9\s]/g, "");

        return cleanStr;
    }
};

export default formatarBoleto;
