//BIBLIOTECAS
import puppeteer from "puppeteer";

//HELPERS
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS
import moeda from "../../mvc/utils/formatar/modeda.js";
import onda_config_taxas from "../../mvc/models/analise/onda_config_taxas.js";
//UTILS
import utilsPdf from "./utils-pdf.js";
import cpfCnpj from "../../mvc/utils/formatar/cpf-cnpj.js";
import onda_parametros_carta_fianca from "../../mvc/models/mongoose/onda_parametros_carta_fianca.js";
//SERVICES
class utils {
    valorMaximoLocacao(valores = {}) {
        const total = Object.values(valores).reduce((acc, val) => Number(acc) + Number(val), 0);
        return Number(total).toFixed(2);
    }

    dadosPagamento(payments = []) {
        const entrada = payments?.filter((pay) => pay?.payParcelas == 1 && pay?.payNumeroParcela == 1 && pay?.payTipoContaId == 241);
        const parcelas = payments?.filter((pay) => pay?.payParcelas > 1 && pay?.payNumeroParcela == 1 && pay?.payTipoContaId == 241);
        const valorParcelado = parcelas?.[0]?.payValorTotal;
    }

    getPrimeiroVencimento(payments = []) {
        const [primeiroVencimento] = payments?.filter((pay) => pay?.payParcelas > 1 && pay?.payNumeroParcela == 1 && pay?.payTipoContaId == 241);

        return primeiroVencimento?.payVencimentoFormat;
    }
}

const pdfContratoLocacao = class pdfContratoLocacao {
    static async gerarPdf(pageHtml, nome, fileId) {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "node --trace-warnings"],
        });
        const page = await browser.newPage();

        await page.setContent(pageHtml);

        const pdfBuffer = await page.pdf({
            //path: "sinistro.pdf",
            format: "A4",
            printBackground: nome == "anexo1" ? false : true,
            margin: {
                top: "30px",
                right: "30px",
                bottom: "30px",
                left: "25px",
            },
        });

        await browser.close();

        const pdfBlob = new Blob([pdfBuffer], {type: "application/pdf"});
        const formData = new FormData();

        formData.append(`${nome}-${fileId}`, pdfBlob, `${nome}.pdf`);

        return [formData, pdfBuffer];
    }

    static header() {
        return `
            <head>
                <title>Contrato</title>
                <style>
                    body {
            font-family: Arial, sans-serif;
            /* margin: 49px 0 0 0; */
            padding: 0;
            width: '100%';
            height: 297mm;
            align-items: center;
            background-color: #333;
            margin: 300;
            
        }
        h1 {
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        .quadro-resumo {
            border: 2px solid #000;
            padding: 20px;
            margin: 20px 0;
            background-color: #f9f9f9;
        }
        .clausula {
            margin-left: 20px;
            margin-right: 20px;
            margin-bottom: 20px;
        }
        .clausula p strong {
            font-size: 1.1rem;
            margin-bottom: 10px;
;
        }
        .clausula-title {
            font-size: 15px;
            font-weight: bold;
        }
        .clausula-title span {
            font-size: 12px;
            font-weight: normal;
        }
        .clausula-list {
            margin-left: 20px;
            margin-right: 20px;
        }
        p {
            margin: 10px 0;
            text-align: justify;
        }
        .page {
            width: 196mm;
            min-height: 297mm;
            padding: 30px 30px 30px 25px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table, th, td {
            border: 1px solid black;
        }
        th, td {
            padding: 3px;
            text-align: left;
            font-size: 12px;
        }

        h3 {
         color: #107ece;
         margin-bottom: 0;
         }
         p {
         color: #444;
         text-align: justify;
         text-justify: inter-word;
         line-height: 1.2;
         margin-top: 0.5em;
         font-size: 12px;
         }
        img {
         width: 280px;
         height: 100px;
         top: -20px;
         }
        .imgAss {
            object-fit: cover;
            text-align: center;
            margin-left: 45px;                        
            margin-top: -12px; 
            width: 140px;
            height: 60px;   
        }
        hr {
            border: none;
            border-top: 1.8px solid #444;
        }
        .container {
            display: flex;
            justify-content: space-between;
            color: #ccc;
        }
        .container3 {
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
            height: 180px;
            width: 100%;
        }
        .containerAssinatura {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 150px;
            width: 260px;
            margin-top: 50px;
        }
        .divcnpj {
            display: flex;
            flex-direction: column;
            margin-top: -20px;
            border-top: 2px solid #000;
            text-align: left;
            vertical-align: top;
        }
        .container2 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            bottom: 0;
        }
        .item {
            display: flex;
            flex-direction: row;
            color: #ccc;
            line-height: 1.5;
            font-size: 10px;
            margin-right: 4px;
        }
        .item2 {
            display: flex;
            flex-direction: column;
            color: #ccc;
            line-height: 1.5;
            font-size: 10px;
            margin-right: 4px;
        }
        .txtnegrito {
            text-decoration: underline; 
            font-weight: bold; 
            margin-bottom: 2;
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.2;
        }
        p.no-space-below {
            margin-bottom: 0;
        }
        p.no-space-above {
            margin-top: 0;
        }
        .titleCf {
            font-size: 22px;
            font-weight: bolder; 
            color: #000;
        }
        .marginRigth {
           margin-right: 5px;
        }
        h6 {
            line-height: 1;
            text-align: left;
            vertical-align: top;
            margin-top: 3px;
        }
        .list-check, .list-alfa {
            list-style: none; 
            padding: 0;
        }

        .list-check li, .list-alfa li {
            position: relative;
            padding-left: 20px;
            margin: 5px 0;
            font-size: 12px;
        }

        .list-check li::before {
            content: "✓";
            position: absolute;
            left: 0;
            font-size: 12px;
        }

        .list-alfa li::before {
            position: absolute;
            left: 0;
            font-size: 12px;
        }


    
        </style>
        </head>
        `;
    }

    static async contratoLocacao(cartaFianca, payments) {
        const helperClass = new utils();

        const get_onda_parametros_carta_fianca = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cartaFianca?.contrato});

        function gerarLinhasHTML() {
            return get_onda_parametros_carta_fianca?.onda_config_valores_adicionais
                .filter((plano) => plano.ativo)
                .map(
                    (plano) => `
            <tr>
              <td><b>Adicional de ${plano.label}:</b></td>
              <td>R$ ${plano.valor.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</td>
            </tr>
          `
                )
                .join("");
        }
        const valorMaximoLocacao = {
            aluguel: cartaFianca?.valoraluguel,
            iptu: cartaFianca?.iptu,
            taxasImovel: cartaFianca?.taxasImovel,
            agua: cartaFianca?.agua,
            condominio: cartaFianca?.condominio,
            lixo: cartaFianca?.lixo,
            gas: cartaFianca?.gas,
            seguroIncendio: cartaFianca?.seguroIncendio,
            energia: cartaFianca?.energia,
        };

        const content = `
            <!DOCTYPE html>
            <html>
                ${this.header()}
            <body>
            <div class="container2">
                <img src="https://lh3.googleusercontent.com/pw/ADCreHd3qtDe-qQXYw4N7lGyvA-FbW4XNLzHjnsNaRhfiK6y7ydzx8U0jtb7WZD02y7L_oTpgIjKUElNXoSoxGepaOngoEanjBpavfcvnEXN7Rg6i2Q37kWVE5fabm-1n_ppSSJUF8GjV64-SRXxA9O1iUqg=w370-h140-s-no">
                <div style="display: flex; flex-direction: row">
                    <h3 class="titleCf">CONTRATO DE FIANÇA LOCATÍCIA</p>
                </div>
            </div>
        
                
            </br>
            <p style="font-size: 15px"><strong>Olá ${cartaFianca?.locatario},</strong></p>
            <p>Estamos muito contentes que você tenha chegado aqui. Você está muito perto de concretizar a garantia locatícia que 
                tornará possível a locação do seu imóvel!
                Abaixo segue o quadro resumo da nossa relação, com as principais informações que regem nossa relação!
            </p>

            </br>
            <p style="font-size: 15px"><strong>Quadro resumo</strong></p>

            <table>
                <tr>
                    <td><b>Locatários (nome completo e CPF):</b></td>
                    <td>${cartaFianca?.locatario}, ${cpfCnpj.formatarCpfCnpj(cartaFianca?.cpf)} ${
            cartaFianca?.coparticipante1 ? `; ${cartaFianca?.coparticipante1}, ${cpfCnpj.formatarCpfCnpj(cartaFianca?.cpfcoparticipante1)}` : ``
        }${cartaFianca?.coparticipante2 ? `; ${cartaFianca?.coparticipante2}, ${cpfCnpj.formatarCpfCnpj(cartaFianca?.cpfcoparticipante2)}` : ``}</td>
                </tr>
                <tr>
                    <td><b>Responsável pelo pagamento:</b></td>
                    <td>${payments?.payTitular || cartaFianca?.locatario}, ${payments?.payCpf || cpfCnpj.formatarCpfCnpj(cartaFianca?.cpf)}</td>
                </tr>
                <tr>
                    <td><b>Imobiliária parceira:</b></td>
                    <td>${cartaFianca?.imobiliaria}</td>
                </tr>
                <tr>
                    <td><b>Valor da taxa de adesão:</b></td>
                    <td>R$ ${moeda.format(Number(cartaFianca?.valoradesao))} (${moeda.escrito(String(cartaFianca?.valoradesao))})</td>
                </tr>
                <tr>
                    <td><b>Valor máximo de locação:</b></td>
                    <td>R$ ${moeda.format(helperClass.valorMaximoLocacao(valorMaximoLocacao))} (${moeda.escrito(String(helperClass.valorMaximoLocacao(valorMaximoLocacao)))})</td>
                </tr>
                <tr>
                    <td><b>Valor da fiança locatícia:</b></td>
                    <td>R$ ${moeda.format(Number(cartaFianca?.valorCartaFianca))} (${moeda.escrito(String(cartaFianca?.valorCartaFianca))})</td>
                </tr>
                <tr>
                    <td><b>Data de vencimento da primeira parcela:</b></td>
                    <td>${helperClass.getPrimeiroVencimento(payments)}</td>
                </tr>
                <tr>
                    <td><b>Modo de pagamento:</b></td>
                    <td>${cartaFianca?.tipopagamento}</td>
                </tr>
                <tr>
                    <td><b>Plano contratado:</b></td>
                    <td>${cartaFianca?.plano}</td>
                </tr>
                ${gerarLinhasHTML()}

            </table>
        </br>
            <p style="font-size: 15px"><strong>Lista de pagamentos</strong></p>
            <table>
                <thead>
                    <tr>
                        <th style="width:5%">Parcela</th>
                        <th style="width:10%">Forma de pagamento</th>
                        <th style="width:20%">Valor</th>
                        <th style="width:10%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments
                        ?.map(
                            (pay) => `
                            <tr>
                                <td>${pay?.payNumeroParcela} de ${pay?.payParcelas}</td>
                                <td>${pay?.payTipopagamentoDesc}</td>
                                <td>R$ ${moeda.format(Number(pay?.payValorparcelas))} (${moeda.escrito(Number(pay?.payValorparcelas))})</td>
                                <td>${pay?.payStatus == "506" ? "Pago" : "Aguardando pagamento"}</td>
                            </tr>
                        `
                        )
                        .join("")}
                </tbody>
            </table>
        </br>    
            <p>Abaixo, seguem as cláusulas que regulam a nossa relação:</p>
            <div class="clausula">
                <p class="clausula-title">1. Ciência do contrato:<span> Eu, ${cartaFianca?.locatario}, declaro que:</span> </p>
                <div class="clausula-list">

                    <p>a) Tive ciência deste contrato antes da assinatura, sendo que uma via me foi disponibilizada anteriormente;</p>
                    <p>b) Estou ciente das condições da fiança e que não possuo dúvidas quanto à sua contratação;</p>
                    <p>c) Estou ciente do Portal do Locatário e entendo que a consulta a tal portal é obrigação minha, e que o contrato de fiança, independentemente de assinatura, está disponibilizado para mim no Portal e em razão disso se considera assinado por mim;</p>
                    <p>d) Estou ciente que as faturas e eventuais boletos/dados que possibilitam o pagamento dos meus débitos podem ser consultados no Portal do Locatário e que, em razão disso, não poderei alegar eventual ausência de recebimento de faturas e/ou necessidade de depósito judicial de valores por ausência de recebimento de faturas para pagamento.</p>
                </div>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">2. Objeto do contrato:
                    <span>Após análise das informações que você entregou para a imobiliária parceira, você está nos contratando para a fiança da locação que você está fazendo com a imobiliária. Este contrato não significa que você pode descumprir suas obrigações contratuais, pelo contrário. Todas as obrigações legais e do contrato de locação que você irá assinar devem ser plenamente cumpridas. Caso você não arque com os pagamentos dos contratos de fiança e da locação, você estará sujeito à cobranças da Onda Segura e das demais disposições deste contrato.</span>
                </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">3. Garantia do Locatário relacionada à fiança:
                    <span>A título de garantia das obrigações do(s) Locatário(s) com a Onda Segura, o(s) Locatário(s) reconhece(m) confessa(m) e declaram que deve(m) o valor certo, líquido e exigível à Onda Segura do total da garantia do plano contratado, cujo vencimento será a data da exoneração, rescisão do contrato ou averiguação de desocupação do imóvel.</span>
                </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">4. Responsabilidade quanto às obrigações assumidas:
                    <span>Levamos nossa atividade muito a sério e esperamos o mesmo das pessoas que contratam conosco. Diante disso, é importante que você saiba que a fiança da Onda Segura não é um serviço de assinatura, mas sim é uma condição para que a sua locação seja concretizada com a imobiliária parceira (sem uma garantia locatícia válida, a locação pode ser desfeita). Portanto, somente por viabilizar a locação, o preço da fiança é integralmente líquido, certo e exigível, independentemente de possibilitarmos a você o parcelamento deste valor. Independentemente disso, a responsabilidade da Onda Segura quanto à garantia inicia com a posse do Locatário no imóvel.</span>
                </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">5. Possibilidade de cancelamento do contrato:
                <span>De qualquer forma, não queremos que as pessoas arquem com valores sem possuir um contrato vigente apenas por terem assinado um contrato. Por isso, oferecemos os seguintes benefícios para rescisão da fiança, caso a sua locação esteja sendo rescindida:</span>
            </p>
            <div class="clausula-list">

                <p>a) Estorno:Caso você tenha assinado o contrato de fiança conosco, mas não tenha tomado posse do imóvel objeto da locação, lhe devolveremos o valor integral do valor da fiança e cancelaremos as cobranças futuras;</p>
                <p>b) Distrato:Caso você tenha assinado o contrato de fiança conosco e tenha tomado posse do imóvel objeto da locação, lhe devolveremos o valor da fiança, cobrando uma multa compensatória, no total de 20% (vinte por cento) sobre os valores devidos da fiança locatícia até o final da sua vigência. Neste caso, faremos o cálculo do distrato e lhe repassaremos os valores na conta bancária informada pela imobiliária parceira, se houverem, e cancelaremos as cobranças futuras.</p>
                <p>Obs.: As hipóteses de cancelamento poderão ser utilizadas caso o seu contrato não tenha pendências ou não tenha acionamento de sinistro pela imobiliária parceira. De qualquer forma, em nenhuma hipótese haverá a devolução da taxa de adesão.</p>
            </div>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">6. Vigência e renovação da fiança:
                <span>A vigência da fiança é 12 (doze) meses. No prazo de 60 (sessenta) dias antes do final da vigência, a Onda Segura poderá realizar uma nova análise relativa à locação e mudar o plano contratado, quando você deverá assinar um novo contrato de fiança ou um aditivo de renovação do contrato. Caso a Onda Segura não entre em contato com você, a fiança será automaticamente renovada, sendo que na data de renovação será devido novamente por você o preço da fiança para os próximos 12 (doze) meses, devidamente atualizado pelo IPCA.</span>
            </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">7. Inadimplência:
                <span>Em caso de inadimplência no pagamento de quaisquer valores ou obrigações decorrentes da fiança ou da locação, o Locatário estará sujeito às seguintes penalidades e situações:</span>
                </p>
                <div  class="clausula-list">

                    <p>a) Multa de 10% (dez por cento) sobre os valores devidos, acrescidos, cumulativamente, de juros moratórios de 1% (um por cento) ao mês, juros remuneratórios de 1% (um por cento) ao mês e correção monetária pelo IPCA;</p>
                    <p>b) 20% (vinte por cento) em caso de cobranças extrajudiciais;</p>
                    <p>c) Rescisão do contrato de fiança, com a exoneração da fiança locatícia;</p>
                    <p>d) Possibilidade de rescisão da locação e despejo do locatário;</p>
                    <p>e) Inscrição dos Locatários em órgãos de proteção ao crédito (ex. Serasa);</p>
                    <p>f) Vencimento antecipado de todas as parcelas vencíveis ou valores pendentes.</p>
                </div>
            </div>
        
        
            <div class="clausula">
                <p class="clausula-title">8. Tolerância e acordos com a Onda Segura:
                    <span>
                        Caso a Onda Segura tolerar o descumprimento de obrigações legais ou contratuais por parte dos Locatários, saiba que isso não pode ser considerado precedente ou alteração de condições e de direitos legais ou contratuais da Onda Segura. Inclusive, caso a Onda Segura aceite condições menores do que seu direito para fins de acordo, em caso de descumprimento, a Onda Segura poderá cobrar as condições originais e integrais a qual tem direito, com a aplicação das penalidades contratuais.
                    </span>
                </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">9. Solidariedade da locação:
                <span>Se a locação for residencial, todos os Locatários e moradores, bem como todas as pessoas que constam como Locatários no contrato de locação, são responsáveis solidários pelas obrigações da locação e da fiança. Caso o Locatário seja pessoa jurídica, o representante legal será solidário com as obrigações assumidas. O fato de as faturas serem emitidas em nome do responsável não desobriga os demais Locatários.</span>
            </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">10. Comunicações:
                <span>Todas as comunicações serão feitas pelos meios utilizados costumeiramente (ex. E-mail, WhatsApp, redes sociais). Caso algum dos Locatários altere seus dados ou canais de comunicação, deverá informar a Onda Segura, e, caso não informe, as comunicações serão consideradas válidas se enviadas para os canais de costume.</span>
            </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">11. Cientes do contrato:
                <span>Os Locatários e seus coparticipantes, no ato da assinatura do Contrato de Locação, estão plenamente cientes do conteúdo integral do presente, que foi disponibilizado durante as negociações mantidas com a Onda Segura.</span>
            </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">12. Lei geral de proteção de dados e direito de imagem e voz:
                <span>O Locatário autoriza a Onda Segura a utilizar e tratar seus dados pessoais, inclusive voz e imagem, para as finalidades deste contrato e para a proteção do crédito, autorizando o compartilhamento com terceiros.</span>
            </p>
            </div>
        
            <div class="clausula">
                <p class="clausula-title">13. Título executivo e assinatura eletrônica:
                <span>As partes estão de acordo com a assinatura eletrônica feita no presente contrato pela ferramenta ZapSign, reconhecendo o seu caráter de título executivo, nos termos do §4º do art. 784 do CPC.</span>
            </p>
            </div>
<div style="width: 100%; margin: 20px 0; text-align: center;">
    <div style="text-align: left; margin-bottom: 50px;">
        <p style="margin: 0;">Navegantes, SC ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${
            getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]
        }</p>
    </div>
    
    <div style="display: flex; justify-content: center; gap: 100px;">
        <div >
            <p style="text-align: center; border-top: 1px solid black; margin-top: 55px; width: 300px;">
                <strong>
                    ${String(cartaFianca?.locatario)?.toUpperCase()}<br>
                    CPF/CNPJ: ${cpfCnpj.formatarCpfCnpj(cartaFianca?.cpf)}
                </strong>
            </p>
        </div>
        
        <div >
            ${utilsPdf.pdfAssinatura()}
            <p style="text-align: center; border-top: 1px solid black; padding-top: 5px; width: 300px;">
                <strong>
                    ONDA SEGURA<br>
                    CNPJ: 47.389.801/0001-54
                </strong>
            </p>
        </div>
    </div>
</div>
            </body>
            </html>        
        `;
        //     <div class="item">
        //     <div>Plataforma:<strong>&nbsp${cartaFianca?.payPlataformaDesc || "Não informado"}&nbsp</strong></div>
        //     <div>Plano:<strong>&nbsp${cartaFianca?.plano}&nbsp</strong></div>
        // </div>
        // <div class="item">
        //     <div>Parcelas:<strong>&nbsp ${cartaFianca?.payParcelas}x &nbsp</strong></div>
        //     <div>Valor:<strong>&nbsp R$ ${moeda.format(cartaFianca?.payValorParcelas)}&nbsp</strong></div>
        //     <div>Forma pagamento:<strong>&nbsp${cartaFianca?.payTipoPagamentoDesc}&nbsp</strong></div>
        // </div>
        return content;
    }
};

export default pdfContratoLocacao;

//CAMPO DO QUADRO DE RESUMO
// <tr>
// <td><b>Adicional de reparo Portão/Piscina:</b></td>
// <td>Sim / Não</td>
// </tr>
