//BIBLIOTECAS
import fs from "fs";
import path from "path";
//HELPERS
//BANCO DE DADOS
//SERVICES
//UTILS
import getDataHorarioAtual from "../../../mvc/utils/datas/get-data-horario-atual.js";
import formatarBoleto from "../../../mvc/utils/formatar/formatar-boleto.js";
import utilsFormatar from "../../../mvc/utils/formatar/formatar.js";

const helpersArquivosCnab400 = class helpersArquivosCnab400 {
    static async gerarArquivoLoteTituloSicredi({dataBody}) {
        // Função para adicionar zeros à esquerda (para números) ou espaços à direita (para textos)

        
        function pad(value, length, type = "Alfa") {
            if (type === "Num") {
                return value.toString().padStart(length, "0");
            }
            return value.toString().padEnd(length, " ");
        }

        function DDMMYY(data = String()){
            let [dia, mes, ano] = data.split("/")
            ano = ano.slice(-2)
            // const dataValue = new Date(data)
            // let dia = dataValue.getUTCDate()
            // let mes = dataValue.getUTCMonth()+1
            // let ano = dataValue.getUTCFullYear()

            // dia = dia.toString().padStart(2, "0")
            // mes = mes.toString().padStart(2, "0")
            // ano = ano.toString().slice(-2)
            return `${dia}${mes}${ano}`
        }

        function createHeader({numLinha}) {
            let setHeader = "";

            setHeader += "0"; //identificacao do registro header || tamanho 001
            setHeader += "1"; //identificacao do arquivo remessa || tamanho 001
            setHeader += "REMESSA"; // literal remessa || tamanho 007
            setHeader += "01"; // código do serviço || tamanho 002
            setHeader += "COBRANCA"; // literal cobranca || tamanho 008
            setHeader += pad("", 7, "Alfa"); //sem preenchimento || tamanho 007
            setHeader += dataBody?.beneficiario?.convenio; // código beneficiário | cedente || tamanho 005
            setHeader += dataBody?.beneficiario?.cnpj; //cnpj || tamanho 014
            setHeader += pad("", 31, "Alfa"); //sem preenchimento || tamanho 031
            setHeader += dataBody?.beneficiario?.banco; // numero do banco || tamanho 003
            setHeader += pad("SICREDI", 15, "Alfa"); //nome do banco || tamanho 015
            setHeader += getDataHorarioAtual.YYYYMMDD(); // data de geração do arquivo || tamanho 008
            setHeader += pad("", 8, "Alfa"); //sem preenchimento || tamanho 008
            setHeader += pad("1", 7, "Num"); //numero da remessa || OBS: o numero precisa ser sequencial || tamanho 007
            setHeader += pad("", 273, "Alfa"); //sem preenchimento || tamanho 273
            setHeader += "2.00"; //Versão do sistema || tamanho 004
            setHeader += pad(String(numLinha), 6, "Num")  //numero sequencial do registro || tamanho 006

            return setHeader + "\r\n";
        }

        function createDetails({dadosDevedor, numLinha}) {
            let setDetails = "";

            setDetails += "1"; //identificação do registro de detalhe || tamanho 001 campo 1-1
            
            setDetails += "A"; //tipo de cobrança || tamanho 001 campo 2-2
            
            setDetails += "A"; //tipo de carteira || tamanho 001 campo 3-3
            
            setDetails += "A"; //tipo de imporessão || A: normal, B: carnê || tamanho 001 campo 4-4
            
            setDetails += pad("", 1, "Alfa"); //sem preenchimento || tamanho 001 campo 5-5
            
            setDetails += pad("", 1, "Alfa"); //tipo de boleto || tamanho 001 campo 6-6
            
            setDetails += pad("", 10, "Alfa"); //sem preenchimento || tamanho 010 campo 7-16
            
            setDetails += "A"; //tipo de moeda || tamanho 001 campo 17-17
            
            setDetails += "B"; //tipo de desconto || A: valor monetário, B: percentual || tamanho 001 campo 18-18
            
            setDetails += "B"; //tipo de juros || A: valor monetário, B: percentual || tamanho 001 campo 19-19
            
            setDetails += pad("", 28, "Alfa"); // sem preenchimento || tamanho 028 campo 20-47
            
            setDetails += String(dadosDevedor?.payCnabNossoNumero); //nosso numero AABDDDDDV || tamanho 009 campo 48-56
            
            setDetails += pad("", 6, "Alfa"); //sem preenchimento || tamanho 006 campo 57-62
            
            setDetails += String(getDataHorarioAtual.YYYYMMDD()); //data de instrução formato aaaammdd || tamanho 008 campo 63-70
            
            setDetails += pad("", 1, "Alfa"); // campo alterado, quando instrução 31 || O campo deve estar vazio, exceto se for informado 31 nos campos 109-110 do registro detalhe. Nesse caso,
            // deve ser usado: A: desconto, B: juros por dia, C: desconto por antecipação, D: data limite para concessão de desconto, E: cancelamento de protesto automático
            // tamanho 001 campo 71-71           

            setDetails += "N"; //postagem do titulo || S: impressão e postagem pelo sicredi, N: postagem feita pelo beneficiario. se a impressao for pelo beneficiario a postagem 
            //tambem tem que ser feita por ele || tamanho 001 campo 72-72
            
            setDetails += pad("", 1, "Alfa") //sem preenchimento || tamanho 001 campo 73-73
            
            setDetails += "B" // impressão do boleto || se a apostagem do titulo for feita pelo beneficiario a impressão do boleoto não pode se A || tamanho 001 campo 74-74
            
            setDetails += "00" // número da parcela do carne || quando o tipo de impressão for "B - Carnê" || tamanho 002 campo 75-76
            
            setDetails += "00" //número total de parcelas do carnê || quando o tipo de impressão for "B - Carnê" || tamanho 002 campo 77-78
            
            setDetails += pad("", 4, "Alfa") //sem preenchimento || tamanho 004 campo 79-82
            
            setDetails += pad("0", 10, "Num") //valor de desconto por dia de antecipação ||o desconto por antecipacao deve estar alinhado com á direita com zeros à esquerda, 
            //se não houver descontos, preencha com zeros. Não usar caracteres especiais para desconto de 1% deve ser informado 0000000100, 
            //para desconto de R$0,50 deve ser informado "0000000050" || tamanho 010 campo 83-92
            
            setDetails += pad("200",4, "Num")//percentual de multa por pagamento em atraso ||a multa deve estar alinhada à direita com zeros à esquerda, se não houver multa preencher com zeros. não usar caracteres especiais.
            //Exemplo para 1% deve ser informado "0100" || tamanho 004 campo 93-96
            
            setDetails += pad("", 12, "Alfa") // sem preenchimento || tamanho 12 campo 97-108
            
            setDetails += "01" //Instrução || Este campo só permite usar os seguintes códigos: 01-Cadastro de Títulos; 02-Pedido de Baixa; 04-Concessão de Abatimento;
            //05-Cancelamento de Abatimento; 06-Alteração de Vencimento; 09-Pedido de Protesto; 18-Sustar protesto e baixar título; 19-Sustar protesto e manter em carteira;
            //31-Alteração de dados; 45-Incluir negativação; 75-Excluir negativação e manter na carteira, 76-Exluir negativação e baixar títulos || tamanho 002 campo 109-110
            
            setDetails += pad(dadosDevedor?.payCnabSeuNumero, 10, "Alfa") // Seu número || Normalmente usados neste campo o número da nota fiscal gerada para o pagador || Não pode contar espaços em branco
            // exemplo 123 4 teria que ser 123/4 || tamanho 010 campo 111-120
            
            setDetails += String(DDMMYY(dadosDevedor?.payVencimentoFormat))// data de vencimento || A data de vencimento deve ser sete dias Maior que a data de emissão (campos 151 - 156). Formato DDMMAA || tamanho 006 campos 121-126
            
            setDetails += pad(String(Number(dadosDevedor?.payValorparcelas).toFixed(2)).replace(/\D/g, ""), 13, "Num") // alinhado à direita e zeros à esquerda, não usar caracteres especiais || tamanho 013 campo 127-139
            
            setDetails += pad("", 9, "Alfa") // sem preenchimento campos (140-141, 142-148) || tamanho 002 + 006 campos 140-141, 142-148
            
            setDetails += "A" // Este campo só permite usar os seguintes códigos: A-Duplicata Mercantil por Indicação, B-Duplicata Rural, C-Nota Promissória, D-Nota Promissóira Rural
            //E-Nota de seguros, G-Recibo, H-Letra de Câmbio, I-Nota de Débito, J-Duplicata de Serviço por Indicação, K-Outros, O-Boleto Proposta (Não permite Híbrido) ||
            //tamanho 001 campo 149-149
            
            setDetails += "N" // Aceite de titulo || S-sim, N-não || tamanho 001, campo 150-150
            
            setDetails += String(DDMMYY(getDataHorarioAtual.DD_MM_YYYY())) // A data de emissão deve ser sete dias Menor que a data de vencimento campo (121-126) fromato DDMMAA || tamanho 006, campo 151-156
            
            setDetails += "00" // Instrução de protesto automático || 00-não protestar automaticamente, 06-protestar automaticamente || tamanho 002, campo 157-158
            
            setDetails += "00" // Número de dias para protesto automático || Se a instrução for 00 o número de dias deve ser 00, se a instrução for 06 e os dias forem 03 ou 04 
            // o sistema comandará o protesto de dias ÚTEIS após o vencimento, se for a partir de 05 será dias CORRIDOS. o mínimo é 03 e o máximo é 99 || tamanho 002 campo 159-160
            
            setDetails += pad("003", 13, "Num") //Juros por dia de atraso (em valor monetário ou percentual) || O valor do juros deve ser alinhado à direita com zeros à esquerda,
            //se não houver juros preencher com zeros Não usar separador decimal e/ou caracteres especiais. Exemplo: para juro de 1% deve ser informado "0000000000100", para juro
            //de R$ 0,50 deve ser "0000000000050" || tamanho 013, campo 161-173
            
            setDetails += pad("0", 6, "Num")// data limite para concessão de desconto || formato DDMMAA ou preencher com zeros. Caso seja preenchida com zero , a data a ser considerada 
            //para o desconto será a data de vencimento do boleto || tamanho 006, campo 174-179
            
            setDetails += pad("0", 13, "Num") // Desconto (valor monetário ou percentual) || O valor do juros deve ser alinhado à direita com zeros à esquerda,
            //se não houver juros preencher com zeros Não usar separador decimal e/ou caracteres especiais. Exemplo: para juro de 1% deve ser informado "0000000000100", para 
            //de R$ 0,50 deve ser "0000000000050" || tamanho 013, campo 180-192
            
            setDetails += "06" // instrução de negativação automática || 00-Não negativar automaticamente, 06-Negativar automaticamente. OBS somente é possível a negativação por beneficiário
            //PJ. Não é possível protestar e negativar um titulo ao mesmo tempo. || tamanho 002 campo 193-194
            
            setDetails += "07" //Número de dias para negativação automática || O mínimo é 03 dias e o máximo é "99". Quando com 03 ou 04 é dias úteis após o vencimento, >=5 dias corridos
            //tamanho 002 campo 195-196
           
            setDetails += pad("0", 9, "Num") // sem preenchimento || tamanho 009, campo 197-205

            setDetails += pad("0", 13, "Num") // valor do abatimento || abatimento em valor monetário (alinhado à direita e zeros à esquerda) ou preencher com zeros || 
            //tamanho 013 campo 206-218

            setDetails += String(dadosDevedor.payLocatarioCpf).replace(/[^a-zA-Z0-9 ]/g, '').length > 11 ? "2" : "1" //tipo de inscrição do pagador/sacado || tipo de inscrição 1-pf(cpf), 2-pj(CNPJ) || tamanho 001 campo 219-219

            setDetails += pad("0", 1, "Num") // sem preenchimento || tamanho 001 campo 220-220

            setDetails += pad(String(dadosDevedor?.payLocatarioCpf).replace(/[^a-zA-Z0-9 ]/g, ''), 14, "Num") // O CPF/CNPJ deve estar alinhado à direita e zeros à esquerda. OBS: Mesmo o momento da homolação o CPF/CNPJ deve ser valido.
            //Não usar caracteres especiais || tamanho 014 campo 221-234

            setDetails +=pad(utilsFormatar.abreviarNome(dadosDevedor?.payLocatario, 40), 40, "Alfa") //Nome do pagador || Neste campo informar o nome do pagador sem acentuação ou caracteres especiais || tamanho 040 campo 235-274

            setDetails += pad(`${formatarBoleto.removerAcentuacaoDeTexto(dadosDevedor?.address?.street)}${dadosDevedor?.address?.number}`, 40, "Alfa") //Endereço do pagador || Neste campo informar o endereço do pagador sem acentuação ou caracteres especiais || tamanho 040 campo 275-314

            setDetails += pad("0", 5, "Num") //código de pagador na cooperativa beneficiário || Para pagadores não cadastrados ou nos casos que o sistema próprio do 
            //beneficiário não usa essa informação, esse campo deve ser preenchido com zeros. Se o pagador ja foi cadastrado deve ser informado o código enviado pelo banco 
            //no arquivo de retorno || tamanho 005 campo 315-319

            setDetails += pad("0", 6, "Num") //sem preenchimento || tamanho 006 campo 320-325
            
            setDetails += pad("", 1, "Alfa") // sem preenchimento || tamanho 001 campo 326-326

            setDetails += String(dadosDevedor?.address?.zip_code) //CEP do pagador || Obrigatorio ser um CEP valido (não informar caracteres especiais) || tamanho 008 campo 327-334

            setDetails += pad("0", 5, "Num") // Codigo do pagador junto ao cliente || informar o código do cliente se não houver código o campo deve ser preenchido com zeros || 
            //tamanho 005 campo 335-339

            setDetails += pad("0", 14, "Num") //CPF/CNPJ do beneficiário final ||Alinhado à direita e zeros a esquerda. Deixar em branco caso não exissta beneficiário final. 
            //O beneficiário final deve ser DIFERENTE do beneficiário e pagador. Não utilizar caracteres especiais || tamanho 014 campo 340-353

            setDetails += pad("", 41, "Alfa") //Nome do beneficiário final || Deixar em branco quando inexistente. Não utilizar caracteres especiais || tamanho 041 campo 354-394

            setDetails += pad(String(numLinha), 6, "Num") //Numero sequencial do registro (Nº da linha) || Alinhado à direita e zeros à esquerda || tamanho 006 campo 395-400

            return setDetails + "\r\n";
        }

        function createMessage({dadosDevedor, numLinha}){
            let setMessage = ""

            setMessage += "2" //identificacao do registro detalhe || tamanho 001 campo 1-1
            setMessage += pad("", 11, "Alfa") //sem preenchimento || tamanho 011 campo 2-12     
            setMessage += String(dadosDevedor?.payCnabNossoNumero) //nosso número || tamanho 009 campo 13-21
            setMessage += pad(`Cobrar juros de 0.03 ao dia apos o vencimento`, 80, "Alfa") //1 instrução para impressão no boleto || Texto completo. Usar sem acentuação ou caracteres especiais || tamanho 080 campo 22-101
            // setMessage += pad("6 Protestar automaticamente apos 7 dias do vencimento", 80, "Alfa") //2 instrução para impressão no boleto || Texto completo. Usar sem acentuação ou caracteres especiais || tamanho 080 campo 102-181
            setMessage += pad("", 80, "Alfa") //2 instrução para impressão no boleto || Texto completo. Usar sem acentuação ou caracteres especiais || tamanho 080 campo 102-181
            setMessage += pad("7 Negativar automaticamente apos 7 dias do vencimento", 80, "Alfa") //3 instrução para impressão no boleto || Texto completo. Usar sem acentuação ou caracteres especiais || tamanho 080 campo 182-261
            setMessage += pad(`Cobrar multa de 2.00 apos o vencimento`, 80, "Alfa") //4 instrução para impressão no boleto || Texto completo. Usar sem acentuação ou caracteres especiais || tamanho 080 campo 262-341
            setMessage += pad(dadosDevedor?.payCnabSeuNumero, 10, "Alfa") // deferente de branco - normalmente usados neste campo o número da nota fiscal gerada para o pagador. Não pode conter espaço em banco
            //(Exemplo: 123 4; teria que ser 123/4) || tamanho 010 campo 342-351
            setMessage += pad("", 43, "Alfa") //sem preenchimento || tamanho 043 campo 352-394
            setMessage += pad(String(numLinha), 6, "Num")  //numero sequencial do registro (nº da linha) || Alinhado à direita e zeros à esquerda || tamanho 006 campo 395-400

            return setMessage + "\r\n";
        }

        function createTrailler({numLinha}){
            let setTrailler = ""

            setTrailler += "9" //identificação do registro detalhe || tamanho 001 campo 1-1
            setTrailler += "1" //identificação do arquivo remessa || tamanho 001 campo 2-2
            setTrailler += "748" //numero do banco || tamanho 003 campo 3-5
            setTrailler += "08945" //codigo do beneficiário / cedente || tamanho 005 campo 6-10
            setTrailler += pad("", 384, "Alfa") //sem preenchimento || tamanho 384 campo 11-394
            setTrailler += pad(String(numLinha), 6, "Num")  //sequencial do arquivo || tamanho 006 campo 395-400

            return setTrailler + "\r\n"
        }

        // Função para gerar o arquivo .rem com múltiplos devedores
        function gerarArquivoRemessa(nomeArquivo) {
            let conteudoArquivo = "";
            let numLinha = 1
            conteudoArquivo += createHeader({numLinha: numLinha});
            numLinha += 1
            dataBody?.devedor?.map((devedor) => {

                conteudoArquivo += createDetails({dadosDevedor: devedor, numLinha: numLinha})
                numLinha += 1
                conteudoArquivo += createMessage({dadosDevedor: devedor, numLinha: numLinha})
                numLinha += 1
            })
            conteudoArquivo += createTrailler({numLinha: numLinha})




            // Gera um segmento para cada devedor
            // devedores.forEach((devedor) => {
            //     conteudoArquivo += gerarSegmento(devedor) + "\n";
            // });

            // Converte o conteúdo do arquivo em Buffer
            const buffer = Buffer.from(conteudoArquivo, "utf8");

            return {
                buffer: buffer,
                nomeArquivo: nomeArquivo,
            };
        }

        // Chamada da função para gerar o arquivo com os devedores
        return gerarArquivoRemessa("arquivo.rem");
    }
    
};

export default helpersArquivosCnab400;
