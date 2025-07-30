export function extrairCodigosCobranca(codCobrancaCompleto) {
    const regex = /OSC-\d+-\d{4}/g;
    const matches = codCobrancaCompleto.match(regex);
    return matches || [];
}
