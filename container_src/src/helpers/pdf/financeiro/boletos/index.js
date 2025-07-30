//BIBLIOTECAS
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
//HELPERS
import getDataHorarioAtual from "../../../../mvc/utils/datas/get-data-horario-atual.js";
import moeda from "../../../../mvc/utils/formatar/modeda.js";
import httpRequestProvider from "../../../response/http-request-provider.js"

//BANCO DE DADOS
//SERVICES
//UTILS

import formatarBoleto from "../../../../mvc/utils/formatar/formatar-boleto.js";

const pdfFinanceiroBoletos = class pdfFinanceiroBoletos {
  static async gerarPdfBoletosESalvarNoBucket({dadosPDF, token}){

    for(let i = 0; i < dadosPDF?.devedor.length; i++){
      const htmlContent = pdfFinanceiroBoletos.gerarBoleto({ beneficiario:dadosPDF?.beneficiario, devedor: dadosPDF?.devedor?.[i]});
      const [formData, buffer] = await pdfFinanceiroBoletos.gerarPdfBoletos({
          htmlContent: htmlContent,
          nome: `Boleto de cobrança ${i}`,
          fileId: 36,
      });

      // await httpRequestProvider.salvarDocBucket(sk_token, formData, `OSC-${codContrato}`);
    }

  } 

  static async gerarPdfBoletos({htmlContent, nome, fileId}) {
    
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "node --trace-warnings",
      ],
    });

    // Read the HTML file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // const htmlPath = path.join(__dirname, "/index.html");

    // const htmlContent = fs.readFileSync(htmlPath, "utf-8");

    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.addScriptTag({
      path: path.resolve(
        __dirname, "../../../geral/JsBarcode.all.min.js"
      ),
    });
    await page.evaluate(() => {
        gerarCodigoDeBarras();
    });

    const pdfBuffer = await page.pdf({
      //path: `${nome}.pdf`,
      format: "A4",
      printBackground: false,
      margin: {
        top: "30px",
        right: "30px",
        bottom: "30px",
        left: "25px",
      },
    });

    await browser.close();

    const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
    const formData = new FormData();

    formData.append(`${nome}-${fileId}`, pdfBlob, `${nome}.pdf`);

    return [formData, pdfBuffer];
  }

  static headerGerarBoleto() {
    return `
                    <title>Boleto</title>
                       <style>
                            @page {
                                size: A4;
                                margin: 0;
                            }
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            body {
                                font-family: Arial, sans-serif;
                                font-size: 10px;
                                margin: 0;
                                padding: 0;
                                background-color: #f0f0f0;
                            }
                            .page {
                                width: 210mm;
                                height: 297mm;
                                margin: 0 auto;
                                background-color: white;
                                padding: 5mm;
                                box-sizing: border-box;
                            }
                            .instructions {
                                text-align: left;
                                padding-bottom: 2mm;
                                border-bottom: 2px dashed black;
                            }

                            .instructions h2 {
                                text-align: center;
                            }

                            .instructions ul li {
                                font-size: 3mm;
                                font-weight: bolder;
                                margin-left: 15px;
                            }
                            .container-section {
                                font-weight: 600;
                            }

                            .section-describe {
                                font-weight: 600;
                                text-align: end;
                                margin-top: 0;
                            }
                            .dados {
                                display: flex;
                                align-items: end;
                                justify-content: flex-start;
                                width: 100%;
                                border-bottom: #000 solid 3px;
                            }
                            .parcela {
                                margin-top:30px
                            }
                            .areaLogo {
                                width: 180px;
                                height: 80px;
                                display: flex;
                                align-items: baseline;
                                position: relative;
                                overflow: hidden;
                            }
                            .logoBanco {
                                object-fit: cover;
                                text-align: center;
                                max-width: 100%;
                                max-height: 100%;
                                position: absolute;
                                bottom: -10px;
                                mix-blend-mode: multiply;
                            }
                            .x {
                                font-size: 25px;
                                padding: 4px;
                                border-left: solid 2px #000;
                                border-right: solid 2px #000;
                            }

                            .codigoDigitavel {
                                flex: 1;
                                text-align: end;
                                font-size: 15px;
                                padding: 5px;
                            }

                            .grid {
                                display: grid;
                                grid-template-columns: repeat(12, 1fr);
                                grid-template-rows: repeat(7, auto);
                                width: 100%;
                                font-family: Arial, sans-serif;
                            }

                            .grid-item {
                                border: 1px solid #000;
                                padding-left: 2px;
                                display: flex;
                                flex-direction: column;
                            }

                            .beneficiario {
                                grid-column: span 4;
                            }

                            .agencia,
                            .numero-do-documento,
                            .cpf-cnpj,
                            .vencimento,
                            .valor-documento,
                            .desconto-abatimentos,
                            .outros-acrescimos {
                                grid-column: span 3;
                            }

                            .especie {
                                grid-column: span 1;
                            }

                            .quantidade,
                            .nosso-numero,
                            .outras-deducoes,
                            .mora-multa,
                            .valor-cobrado {
                                grid-column: span 2;
                            }

                            .endereco,
                            .pagador {
                                grid-column: span 12;
                            }

                            .grid-item p {
                                margin: 1px 0;
                                line-height: 1.4;
                            }

                            .local-de-pagamento-parcela,
                            .beneficiario-parcela,
                            .endereco-parcela,
                            .instrucao-parcela {
                                grid-column: span 9;
                            }

                            .vencimento-parcela,
                            .agencia-parcela,
                            .cpf-cnpj-parcela,
                            .nosso-numero-parcela,
                            .valor-documento-parcela,
                            .quantidade-parcela,
                            .uso-do-branco-parcela,
                            .valores-parcela {
                                grid-column: span 3;
                            }

                            .data-do-documento-parcela,
                            .data-processamento-parcela,
                            .carteira-parcela {
                                grid-column: span 2;
                            }
                            
                            .pagador-parcela {
                                grid-column: span 12;
                            }
                            </style>
            `;
  }

  static gerarBoleto({beneficiario, devedor}) {

    const content = `
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<script src="./JsBarcode.all.js"></script>
    ${this.headerGerarBoleto()}
</head>
  <body>
    <div class="page">
      <div class="instructions" id="instrucoes">
        <h3 style="text-align: start; font-weight: 400">${getDataHorarioAtual.DD_MM_YYYY_00_00_00()}</h3>
        <h2><strong>Instruções de Impressão</strong></h2>
        <ul>
          <li>
            Imprima em impressora jato de tinta (ink jet) ou laser em qualidade
            normal ou alta (Não use modo econômico).
          </li>
          <li>
            Utilize folha A4 (210 x 297 mm) ou Carta (216 x 279 mm) e margens
            mínimas à esquerda e à direita do formulário.
          </li>
          <li>
            Corte na linha indicada. Não rasure, risque, fure ou dobre a região
            onde se encontra o código de barras.
          </li>
          <li>
            Caso não apareça o código de barras no final, clique em F5 para
            atualizar esta tela.
          </li>
          <li>
            Caso tenha problemas ao imprimir, copie a seqüencia numérica abaixo
            e pague no caixa eletrônico ou no internet banking.
          </li>
        </ul>
        <h3>
          <strong>
            Linha Digitável: ${formatarBoleto.linhaDigitavel({text:devedor?.linhaDigitavel})}
          </strong>
        </h3>
        <h3><strong>Valor: ${moeda.format(Number(devedor?.payValorparcelas))}</strong></h3>
      </div>

      <div class="container-section" id="container-recibo">
        <p class="section-describe">Recibo do Pagador</p>
        <div class="container-dados">
          <div class="dados linha1">
            <div class="areaLogo">
              <img
                class="logoBanco"
                src="https://m.inovaway.org/sindifiscorecife/wp-content/uploads/sites/10/2017/09/Sicredi-novo-logotipo-2017-e1482510382430.jpg"
              />
            </div>
            <div class="x">748-X</div>
            <div class="codigoDigitavel">
              <p>${formatarBoleto.linhaDigitavel({text:devedor?.linhaDigitavel})}</p>
            </div>
          </div>
          <div class="grid">
            <div class="beneficiario grid-item">
              <p>Beneficiário</p>
              <p><b>Onda Segura Cobrança</b></p>
            </div>
            <div class="agencia grid-item">
              <p>Agência/Código do Beneficiário</p>
              <p><b>${formatarBoleto.agenciaCodigoBeneficiario({agencia: String(beneficiario?.cooperativaAgencia), posto:String(beneficiario?.posto), convenio: String(beneficiario?.convenio)})}</b></p>
            </div>
            <div class="especie grid-item">
              <p>Espécie</p>
              <p><b>"REAL"</b></p>
            </div>
            <div class="quantidade grid-item">
              <p>Quantidade</p>
              <p><b></b></p>
            </div>
            <div class="nosso-numero grid-item">
              <p>Nosso número</p>
              <p><b>${formatarBoleto.nossoNumero({text:devedor?.payCnabNossoNumero})}</b></p>
            </div>
            <div class="endereco grid-item">
              <p>Endereço</p>
              <p>
                <b>AVENIDA JOAO SACAVEM, Nº 571 - SALA 1206, Centro. Navegantes - SC, CEP: 88370792</b>
              </p>
            </div>
            <div class="numero-do-documento grid-item">
              <p>Número do documento</p>
              <p><b>${devedor?.payCnabSeuNumero}</b></p>
            </div>
            <div class="cpf-cnpj grid-item">
              <p>CPF/CNPJ</p>
              <p><b>47.389.801/0001-54</b></p>
            </div>
            <div class="vencimento grid-item">
              <p>Vencimento</p>
              <p><b>${devedor?.payVencimentoFormat}</b></p>
            </div>
            <div class="valor-documento grid-item">
              <p>Valor documento</p>
              <p><b>${moeda.format(String(devedor?.payValorparcelas))}</b></p>
            </div>
            <div class="desconto-abatimentos grid-item">
              <p>(-) Desconto / Abatimentos</p>
              <p><b></b></p>
            </div>
            <div class="outras-deducoes grid-item">
              <p>(-) Outras deduções</p>
              <p><b></b></p>
            </div>
            <div class="mora-multa grid-item">
              <p>(+) Mora / Multa</p>
              <p><b></b></p>
            </div>
            <div class="outros-acrescimos grid-item">
              <p>(+) Outros acréscimos</p>
              <p><b></b></p>
            </div>
            <div class="valor-cobrado grid-item">
              <p>(=) Valor cobrado</p>
              <p><b></b></p>
            </div>
            <div class="pagador grid-item">
              <p>Pagador</p>
              <p><b>${devedor?.payLocatario} - CPF: ${devedor?.payLocatarioCpf}</b></p>
              <p><b>${devedor?.address?.street}, ${devedor?.address?.number}, ${devedor?.address?.neighborhood}</b></p>
              <p><b>${devedor?.address?.city} - ${devedor?.address?.state} - CEP ${devedor?.address?.zip_code}</b></p>
            </div>
          </div>
        </div>
        <div
          style="display: flex; justify-content: space-between; height: 100px"
        >
          <p class="border-end-deshad">Demonstrativo</p>
          <p class="border-end-deshad">Autenticação mecânica</p>
        </div>

        <p
          class="border-end-deshad"
          style="text-align: end; border-bottom: 2px dashed #000"
        >
          Corte na linha pontilhada
        </p>
      </div>
      
      <div class="container-section" id="container-parcelas">
        <div class="container-dados" id="container-dados">
          <div class="dados linha1">
            <div class="areaLogo">
              <img
                class="logoBanco"
                src="https://m.inovaway.org/sindifiscorecife/wp-content/uploads/sites/10/2017/09/Sicredi-novo-logotipo-2017-e1482510382430.jpg"
              />
            </div>
            <div class="x">748-X</div>
            <div class="codigoDigitavel">
              <p>${formatarBoleto.linhaDigitavel({text:devedor?.linhaDigitavel})}</p>
            </div>
          </div>
          <div class="grid">
            <div class="local-de-pagamento-parcela grid-item">
              <p>Local de pagamento</p>
              <p><b>PAGÁVEL PREFERENCIALMENTE NAS COOPERATIVAS DE CRÉDITO DO SICREDI</b></p>
            </div>
            <div class="vencimento-parcela grid-item">
              <p>Vencimento</p>
              <p><b>${devedor?.payVencimentoFormat}</b></p>
            </div>
            <div class="beneficiario-parcela grid-item">
              <p>Beneficiário</p>
              <p><b>Onda Segura Cobranca LTDA</b></p>
            </div>
            <div class="agencia-parcela grid-item">
              <p>Agência/Código do Beneficiário</p>
              <p><b>${formatarBoleto.agenciaCodigoBeneficiario({agencia: String(beneficiario?.cooperativaAgencia), posto:String(beneficiario?.posto), convenio: String(beneficiario?.convenio)})}</b></p>
            </div>
            <div class="endereco-parcela grid-item">
              <p>Endereço</p>
              <p>
                <b>AVENIDA JOAO SACAVEM, Nº 571 - SALA 1206, Centro. Navegantes- SC, CEP: 88370792</b>
              </p>
            </div>
            <div class="cpf-cnpj-parcela grid-item">
              <p>CPF/CNPJ</p>
              <p><b>47.389.801/0001-54</b></p>
            </div>
            <div class="data-do-documento-parcela grid-item">
              <p>Data do documento</p>
              <p><b>${getDataHorarioAtual.DD_MM_YYYY()}</b></p>
            </div>
            <div class="numero-do-documento grid-item">
              <p>Número do documento</p>
              <p><b>${devedor?.payCnabSeuNumero}</b></p>
            </div>
            <div class="especie-doc-parcela grid-item">
              <p>Espécie doc.</p>
              <p><b>DMI</b></p>
            </div>
            <div class="aceite-parcela grid-item">
              <p>Aceite</p>
              <p><b>N</b></p>
            </div>
            <div class="data-processamento-parcela grid-item">
              <p>Data processamento</p>
              <p><b>${getDataHorarioAtual.DD_MM_YYYY()}</b></p>
            </div>
            <div class="nosso-numero-parcela grid-item">
              <p>Nosso número</p>
              <p><b>${formatarBoleto.nossoNumero({text: devedor?.payCnabNossoNumero})}</b></p>
            </div>
            <div class="uso-do-branco-parcela grid-item">
              <p>Uso do banco</p>
              <p><b></b></p>
            </div>
            <div class="carteira-parcela grid-item">
              <p>Carteira</p>
              <p><b>A</b></p>
            </div>
            <div class="especie-parcela grid-item">
              <p>Espécie</p>
              <p><b>R$</b></p>
            </div>
            <div class="quantidade-parcela grid-item">
              <p>Quantidade</p>
              <p><b></b></p>
            </div>
            <div class="valor-documento-parcela grid-item">
              <p>Valor documento</p>
              <p><b>${moeda.format(String(devedor?.payValorparcelas))}</b></p>
            </div>
            <div class="instrucao-parcela grid-item">
              <p>Instruções (Texto de responsabilidade do beneficiário)</p>
              <p><b>Referente a Garantia Locatícia Onda Segura. Cobrar juros de 1,00% ao dia após o vencimento.
                6 - Protestar automaticamente após 7 dia(s) do vencimento.
                7 - Negativar automaticamente após 7 dia(s) do vencimento.
                Cobrar multa de 1,00% após o vencimento.
                </b></p>
            </div>
            <div class="valores-parcela">
              <div class="desconto-abatimentos-parcela grid-item">
                <p>(-) Desconto / Abatimentos</p>
                <p><b></b></p>
              </div>
              <div class="outras-deducoes-parcela grid-item">
                <p>(-) Outras deduções</p>
                <p><b></b></p>
              </div>
              <div class="mora-multa-parcela grid-item">
                <p>(+) Mora / Multa</p>
                <p><b></b></p>
              </div>
              <div class="outros-acrescimos-parcela grid-item">
                <p>(+) Outros acréscimos</p>
                <p><b></b></p>
              </div>
              <div class="valor-cobrado-parcela grid-item">
                <p>(=) Valor cobrado</p>
                <p><b></b></p>
              </div>

            </div>
            <div class="pagador-parcela grid-item">
              <p>Pagador</p>
              <p><b>${devedor?.payLocatario} - CPF: ${devedor?.payLocatarioCpf}</b></p>
              <p><b>${devedor?.address?.street}, ${devedor?.address?.number}, ${devedor?.address?.neighborhood}</b></p>
              <p><b>${devedor?.address?.city} - ${devedor?.address?.state} - CEP ${devedor?.address?.zip_code}</b></p>
            </div>
          </div>
          <div style=" height: 100px; width: 100%;">
            <div style="display: flex; justify-content: space-between;">
              <p class="border-end-deshad">Demonstrativo</p>
              <p class="border-end-deshad">Autenticação mecânica</p>
            </div>
          <svg class="barcode" style="width: 400px"  
            jsbarcode-format="code128"
            jsbarcode-height="60"
            jsbarcode-width="2"
            jsbarcode-font="sans-serif"
            jsbarcode-fontSize="10"
            jsbarcode-flat="true"
            jsbarcode-displayValue="true"
            jsbarcode-value="${devedor?.codigoDeBarras}" 
            jsbarcode-textmargin="0" 
            jsbarcode-fontoptions="bold">
          </svg>
          </div>
           <p
            class="border-end-deshad"
            style="
              text-align: end;
              border-bottom: 2px dashed #000;
            "
          >
            Corte na linha pontilhada
          </p>
        </div>
      </div>
    </div>

    <script>
      function gerarCodigoDeBarras(){
        JsBarcode(".barcode").init()
      }
    </script>
  </body>
</html>
    `;
    return content;
  }
};

export default pdfFinanceiroBoletos;
