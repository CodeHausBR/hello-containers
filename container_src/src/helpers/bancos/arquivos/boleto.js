//UTILS
import getDiasEntre from "../../../mvc/utils/datas/get-dias-entre.js";
import getDataHorarioAtual from "../../../mvc/utils/datas/get-data-horario-atual.js";
import utilsFormatar from "../../../mvc/utils/formatar/formatar.js";
import utilsGeradorIdAleatorio from "../../../mvc/utils/gerador/id-aleatorio.js";
//MODEL
import onda_pay from "../../../mvc/models/analise/onda_pay.js";

const helpersArquivosBoleto = class helpersArquivosBoleto {
    static async sicred({dadosBeneficiario = Object(), dadosDevedor = Array(), ultimoNossoNumero}) {
        let newArray = [];
        let nossoNumero = ultimoNossoNumero
        dadosDevedor?.map((cobranca, index) => {
            
            
            const seuNumero = cobranca?.payCnabSeuNumero !== null ? cobranca?.payCnabSeuNumero : utilsGeradorIdAleatorio.gerarIdComNumeroDeCaracteresEspecifico(10);
            // const nossoNumero = "242969396";
            nossoNumero = this.gerar_nosso_numero({beneficiario: dadosBeneficiario, ultimoNossoNumero: String(nossoNumero)});
            
            const campoLivre = this.gerar_campo_livre({nossoNumero: nossoNumero, dadosBeneficiario: dadosBeneficiario});

            const codigoDeBarras = this.gerar_codigo_de_barras({dadosBeneficiario: dadosBeneficiario, nossoNumero: nossoNumero, cobranca: cobranca, campoLivre: campoLivre});
            const linhaDigitavel = this.gerar_linha_digitalvel({dadosBeneficiario: dadosBeneficiario, campoLivre: campoLivre, codigoDeBarras: codigoDeBarras});

            const dadosCobrancaAtualizado = new Object({
                ...cobranca,
                payCnabSeuNumero: seuNumero,
                payCnabNossoNumero: nossoNumero,
                codigoDeBarras: codigoDeBarras,
                linhaDigitavel: linhaDigitavel,
            });

            newArray.push(dadosCobrancaAtualizado);
        });

        return new Object({
            beneficiario: dadosBeneficiario,
            devedor: newArray,
        });

        // return newArray;
    }

    static gerar_nosso_numero({beneficiario = Object(), ultimoNossoNumero = String()}) {
        function analisarUltimoNossoNumero() {
            
            let numeroStr = ultimoNossoNumero.toString();
            
            let ano = parseInt(numeroStr.slice(0, 2));
            let byte = parseInt(numeroStr.slice(2, 3));
            let sequencial = parseInt(numeroStr.slice(3, 8));
            let anoAtual = new Date().getFullYear() % 100; 
      
            if (Number(ano) !== Number(anoAtual)) {
                ano += 1;
            }

            sequencial += 1;
            if (Number(sequencial) > 99999) {
                sequencial = 0;
                byte += 1;
                if (byte > 9) {
                    byte = 2;
                }
            }

            let sequencialStr = sequencial.toString().padStart(5, "0");

            let novoNumero = `${ano.toString().padStart(2, "0")}${byte}${sequencialStr}`;
            
            return novoNumero;
        }

        // const byte = String(Math.floor(2 + Math.random() * 7));
        // const ano = new Date().getFullYear().toString().slice(-2);
        // const numeroSquencial = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
        // const stringValores =
        //     String(beneficiario?.cooperativaAgencia) + String(beneficiario?.posto) + String(beneficiario?.convenio) + String(ano) + String(byte) + String(numeroSquencial);
        // return `${ano}${byte}${numeroSquencial}${verificador}`;
        
        const numeroSequencial = analisarUltimoNossoNumero()
        const stringValores =
            String(beneficiario?.cooperativaAgencia) + String(beneficiario?.posto) + String(beneficiario?.convenio) + numeroSequencial;

        const verificador = this.gerar_verificador(stringValores);

        return `${numeroSequencial}${verificador}`;
    }

    static gerar_campo_livre({nossoNumero, dadosBeneficiario}) {
        const valor = `1${dadosBeneficiario?.carteira}${nossoNumero}${dadosBeneficiario?.cooperativaAgencia}${dadosBeneficiario?.posto}${dadosBeneficiario?.convenio}10`;
        const digitoVerificador = this.gerar_verificador(valor);
        return `${valor}${digitoVerificador}`;
    }

    static gerar_codigo_de_barras({dadosBeneficiario = Object(), cobranca = Object(), campoLivre = String()}) {
        const fatorVencimento = this.gerar_fator_vencimento("1997-10-07", cobranca?.payVencimentoFormat);
        const valorCobranca = String(Number(cobranca?.payValorparcelas).toFixed(2)).replace(/\D/g, "");

        const valor = `${dadosBeneficiario?.banco}${dadosBeneficiario?.moeda}${String(fatorVencimento).padStart(4, "0")}${String(valorCobranca).padStart(10, "0")}${campoLivre}`;

        const verificador = this.gerar_verificador(valor);

        const codBarras = `${dadosBeneficiario?.banco}${dadosBeneficiario?.moeda}${verificador == 0 ? 1 : verificador}${String(fatorVencimento).padStart(4, "0")}${String(
            valorCobranca
        ).padStart(10, "0")}${campoLivre}`;

        return codBarras;
    }

    static gerar_linha_digitalvel({dadosBeneficiario = Object(), campoLivre = String(), codigoDeBarras = String()}) {
        //1º campo
        const codigoBanco = dadosBeneficiario?.banco;
        const codigoMoeda = dadosBeneficiario?.moeda;
        const prim5DigitosCampoLivre = campoLivre.slice(0, 5);
        const verificadorCampo1 = this.gerar_verificado_campos_linha_digitavel(`${codigoBanco}${codigoMoeda}${prim5DigitosCampoLivre}`);
        const campo1 = `${codigoBanco}${codigoMoeda}${prim5DigitosCampoLivre}${verificadorCampo1}`;
        //2º campo
        const digitos6Ao15CampoLivre = campoLivre.slice(5, 15);
        const verificadorCampo2 = this.gerar_verificado_campos_linha_digitavel(digitos6Ao15CampoLivre);
        const campo2 = `${digitos6Ao15CampoLivre}${verificadorCampo2}`;
        //3º campo
        const digito16ao25CampoLivre = campoLivre.slice(15, 25);
        const verificadorCampo3 = this.gerar_verificado_campos_linha_digitavel(digito16ao25CampoLivre);
        const campo3 = `${digito16ao25CampoLivre}${verificadorCampo3}`;
        //4º campo
        const digito5CodigoDeBarras = codigoDeBarras.slice(4, 5);

        //5º campo
        const fatorVencimento = codigoDeBarras.slice(5, 9);
        const valorDocumento = codigoDeBarras.slice(9, 19);
        const campo5 = `${fatorVencimento}${valorDocumento}`;

        return `${campo1}${campo2}${campo3}${digito5CodigoDeBarras}${campo5}`;
    }

    static gerar_fator_vencimento(dataBase, vencimento = String()) {
        let data = dataBase;
        const dataVencimento = utilsFormatar.ddmmyyyyToYyyymmdd(vencimento);

        let difDias = getDiasEntre.dias_entre(data, dataVencimento);
        let dias = 10000;

        while (Number(difDias) > 9999) {
            data = getDiasEntre.acrescentar_dias(data, dias);
            difDias = getDiasEntre.dias_entre(data, dataVencimento);
            dias += 10000;
        }

        return difDias;
    }

    static gerar_verificador(valor = String()) {
        let mulitplicador = 2;
        let resultado = 0;
        for (let i = valor?.length - 1; i >= 0; i--) {
            mulitplicador > 9 ? (mulitplicador = 2) : mulitplicador;
            let resultadoMultiplicacao = valor[i] * Number(mulitplicador);
            resultado = Number(resultado) + Number(resultadoMultiplicacao);
            mulitplicador += 1;
        }

        const resultadoDivididoPor11 = Math.floor(Number(resultado) / 11);

        const resultadoRestoMultiplicadoPor11 = Number(resultadoDivididoPor11) * 11;

        const subtracaoResultados = Number(resultado) - Number(resultadoRestoMultiplicadoPor11);

        const subtracaoFinal = 11 - Number(subtracaoResultados);

        return subtracaoFinal > 9 ? 0 : subtracaoFinal;
    }

    static gerar_verificado_campos_linha_digitavel(valor = String()) {
        let multiplicador = 2;
        let resultado = 0;
        let resultadoMultiplicacao = 0;
        let somadigitos = 0;
        let multiplo = 10;

        for (let i = valor?.length - 1; i >= 0; i--) {
            resultadoMultiplicacao = Number(valor[i]) * multiplicador;
            if (String(resultadoMultiplicacao).length > 1) {
                const digitos = String(resultadoMultiplicacao).split("").map(Number);
                somadigitos = digitos.reduce((acumulador, valorAtual) => acumulador + valorAtual, 0);
                resultadoMultiplicacao = somadigitos;
            }
            resultado = resultado + resultadoMultiplicacao;
            multiplicador = multiplicador == 2 ? 1 : 2;
        }
        while (multiplo < resultado) {
            multiplo += 10;
        }
        const dv = multiplo - resultado;

        return dv;
    }
};

export default helpersArquivosBoleto;
