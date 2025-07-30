import utilsCnab400 from "./utils-canb-400.js";

const utilsArquivosDeLote = class utilsArquivosDeLote {
    static async lerArquivoDeRetornoSicredi({files = Array()}) {
        if (!files?.length > 0) return;
        let results = {};

        files.forEach((file) => {
            const arrayDeLinhasDoArquivo = file?.buffer.toString("utf-8").split("\r\n");

            for (let linha = 1; linha < arrayDeLinhasDoArquivo?.length - 2; linha++) {
                function getMotivosOcorrencia(value) {
                    const motivos = new Object({
                        motivo1: utilsCnab400.sicrediTabelaStatusRetornoCNAB400(value.substring(0, 2)),
                        motivo2: utilsCnab400.sicrediTabelaStatusRetornoCNAB400(value.substring(2, 4)),
                        motivo3: utilsCnab400.sicrediTabelaStatusRetornoCNAB400(value.substring(4, 6)),
                        motivo4: utilsCnab400.sicrediTabelaStatusRetornoCNAB400(value.substring(6, 8)),
                        motivo5: utilsCnab400.sicrediTabelaStatusRetornoCNAB400(value.substring(8, 10)),
                    });

                    return motivos;
                }

                function formatarDataOcorrencia(value) {
                    const dia = value.substring(0, 2);
                    const mes = value.substring(2, 4);
                    const ano = value.substring(4, 6);

                    return `${dia}/${mes}/${ano}`;
                }

                const objetoFormatado = new Object({
                    ocorrencia: arrayDeLinhasDoArquivo[linha].substring(108, 110),
                    ocorrenciaDesc: utilsCnab400.sicrediTabelaOcorrenciasCNAB400(Number(arrayDeLinhasDoArquivo[linha].substring(108, 110))),
                    motivos: getMotivosOcorrencia(arrayDeLinhasDoArquivo[linha].substring(318, 328)) || {},
                    dataOcorrencia: formatarDataOcorrencia(arrayDeLinhasDoArquivo[linha].substring(110, 116)),
                });

                results = {...results, [Number(arrayDeLinhasDoArquivo[linha].substring(47, 56))]: objetoFormatado};
            }
        });

        return results;
    }

    static async buscarNossosNumerosGerados(dataBody = Array()){
        const listaNossoNumero = []
        dataBody?.devedor?.map(nossoNumero => listaNossoNumero.push(nossoNumero?.payCnabNossoNumero) )
        return listaNossoNumero
    }

};
export default utilsArquivosDeLote;
