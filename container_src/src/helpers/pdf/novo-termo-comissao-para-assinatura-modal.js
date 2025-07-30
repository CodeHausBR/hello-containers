import path from "path";
import fs from "fs";

//BIBLIOTECAS
import puppeteer from "puppeteer";

//HELPERS
import cpfCnpj from "../../mvc/utils/formatar/cpf-cnpj.js";
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS
//import moeda from "../../mvc/utils/formatar/modeda.js";
//UTILS
import utilsPdf from "./utils-pdf.js";

const novoTermoComissaoParaAssinaturaModal = class novoTermoComissaoParaAssinaturaModal {
    static async gerarPdf(pageHtml, nome, fileId) {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "node --trace-warnings"],
        });
        const page = await browser.newPage();

        const absolutePath = path.join(process.cwd(), "src/assets/email/logo-onda-portal.png");
        const imageBase64 = fs.readFileSync(absolutePath, {encoding: "base64"});

        await page.setContent(pageHtml);

        const pdfBuffer = await page.pdf({
            //path: "teste.pdf",
            format: "A4",
            printBackground: nome == "anexo1" ? false : true,
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                    <div style="display: flex; align-items: center; justify-content: center; max-width: 100%; margin-right: 100px">
                        <img src="data:image/png;base64,${imageBase64}" 
                             style="width: 120px; height: 120px; object-fit: contain;">
                        <h1 style="color: #0066cc; font-size: 25px; text-align: center; line-height: 1.4;">
                            TERMO DE BONIFICAÇÃO 
                        </h1>
                    </div>
                </div>
            `,
            footerTemplate: `
                <div style="display: flex; justify-content: flex-end; width: 100%; padding: 10px 40px; font-size: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>Versão 02 - 2025</span>
                        <span style="margin-left: 10px; padding-left: 10px; border-left: 1px solid black;">
                            <span class="pageNumber"></span>
                        </span>
                    </div>
                </div>
            `,
            margin: {
                top: "170px",
                right: "95px",
                bottom: "95px",
                left: "95px",
            },
        });

        await browser.close();

        const pdfBlob = new Blob([pdfBuffer], {type: "application/pdf"});
        const formData = new FormData();
        formData.append(`${nome}-${fileId}`, pdfBlob, `${nome}.pdf`);

        return [formData, pdfBuffer];
    }

    static async gerarTermoComissao({imobiliaria, contratoParaAssinatura}) {
        const ContratoParaAssinatura = {
            url_pdf_contrato: contratoParaAssinatura?.url_pdf_contrato,
            assinado: contratoParaAssinatura?.assinado,
            data_assinatura: contratoParaAssinatura?.data_assinatura,
            data_envio_assinatura: contratoParaAssinatura?.data_envio_assinatura,
            _id: contratoParaAssinatura?._id,
        };

        const logsDeVisualizacao = await utilsPdf.gerarLogVisualizacao({matrixLogVisualizacao: imobiliaria?.imobCodigo, evento: String(ContratoParaAssinatura?.url_pdf_contrato).trim()})

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Contrato de Fiança Locatícia</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 0;
                        width: 100%;
                        margin: 0 auto;
                        height: 297mm;
                        align-items: center;
                        background-color: white;
                    }
                
                    .container {
                        width: "100%";
                        max-width: "100%";
                    }                                
                    .clausula {
                        margin: 20px 0;
                        padding: 0 20px;
                    }
                
                    .clausula-title {
                        font-size: 15px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                
                    .clausula-title span {
                        font-size: 12px;
                        font-weight: normal;
                    }
                
                    .clausula-list {
                        margin-left: 20px;
                    }
                
                    p {
                        color: #444;
                        font-size: 14px;
                        line-height: 1.4;
                        text-align: justify;
                        margin: 8px 0;
                    }
                
                    .signature-block {
                        margin-top: 50px;
                        text-align: center;
                    }
                
                    .signature-line {
                        border-top: 1px solid #000;
                        width: 200px;
                        margin: 10px auto;
                        padding-top: 5px;
                        font-size: 12px;
                    }

                    th {
                        font-size: 12px;
                        padding: 4px;
                        line-height: 1;
                    }
                    td {
                        font-size: 12px;
                        padding: 4px;
                        line-height: 1;
                    }

                    .title-alert-contrato {
                        font-style: italic;
                        background-color: #ffff00;
                        padding: 2px 4px;
                    }
                    li {
                       margin-bottom: 8px;
                       line-height: 1.4;
                       font-size: 14px;
                       padding-left: 8px;
                       list-style-position: inside;
                    }

                    li:last-child {
                       margin-bottom: 0;
                    } 
                    .imgAss {
                        object-fit: cover;
                        text-align: center;
                        margin-left: 45px;                        
                        margin-top: -12px; 
                        width: 140px;
                        height: 60px;   
                    }                     
                </style>
            </head>
          <body>
   <div class="container">            
       <p>Pelo presente instrumento formalizamos a adesão ao programa <b>"SOMOS PARCEIROS ONDA SEGURA"</b>.</p>
       
       <p>De um lado <b>ONDA SEGURA COBRANÇA LTDA</b>, de nome fantasia <b>ONDA SEGURA</b>, registrada no CNPJ: 47.389.801/0001-54, doravante denominada <b>ADMINISTRADORA</b>, e de outro lado, <b>${
           imobiliaria?.imobRazaoSocial
       }</b>, CNPJ/CPF: <b>${cpfCnpj.formatarCpfCnpj(
            imobiliaria?.imobCpfCnpj
        )}</b>, doravante denominado <b>PARCEIRO ONDA SEGURA</b>, têm entre si justo e acordado o presente <b>TERMO DE ADESÃO DE BONIFICAÇÃO</b>, que será parte integrante ao <b>CONTRATO DE CARTA FIANÇA</b> anteriormente firmado, pelas cláusulas e condições a seguir descritas:</p>

       <div class="clausula">
           <p class="clausula-title">Cláusula 1</p>
           <p>Para fins de aplicação do disposto neste <b>TERMO</b>, considera-se como <b>VÁLIDO</b> e <b>RESGATÁVEL</b>, apenas contratos de locação que estejam assinados por todas as partes e que sejam originados de transações definitivas, irreversíveis e confirmadas pela <b>ONDA SEGURA</b>.</p>
       </div>

       <div class="clausula">
           <p class="clausula-title">Cláusula 2</p>
           <p>A Bonificação será calculada no momento do envio da análise de acordo com o valor informado pelo Parceiro obedecendo as seguintes regras:</p>
           <ul>
               <li>Valor da bonificação será informado no campo Taxa de Adesão;</li>
               <li>Valor poderá ser de R$ 100,00 à R$ 280,00;</li>
               <li>Do valor informado o Parceiro receberá de volta a título de bonificação 80%;</li>
           </ul>
       </div>

       <div class="clausula">
           <p class="clausula-title">Cláusula 3</p>
           <p>Fica estabelecido que os fechamentos serão realizados sempre no dia 30 (trinta) de cada mês, se cumpridas as exigências da cláusula primeira deste termo, o cashback será pago para a imobiliária por meio de boleto a ser emitido pela imobiliária e enviado para a Onda Segura, com vencimento programado para 15 (quinze) dias úteis após a emissão.</p>
       </div>

       <div class="clausula">
           <p class="clausula-title">Cláusula 4</p>
           <p>O presente instrumento não estabelece qualquer forma de vínculo trabalhista, ou sociedade entre as partes, não decorrendo, desta forma, qualquer tipo de responsabilidade, tanto solidária, quanto subsidiária, pelas obrigações decorrentes deste instrumento particular.</p>
       </div>

       <div class="clausula">
           <p class="clausula-title">Cláusula 5</p>
           <p>Compromete-se o <b>PARCEIRO ONDA SEGURA</b>, nos assuntos pertinentes a sua participação no programa de bonificação, a sempre agir com a boa ética, em total respeito à Lei e às boas normas de procedimento.</p>
       </div>

       <div class="clausula">
           <p class="clausula-title">Cláusula 6</p>
           <p>As partes elegem o Foro da Comarca de Navegantes – SC, com expressa renúncia a qualquer outro, para dirimir eventuais controvérsias decorrentes do presente termo.</p>
       </div>

       <div class="clausula">
           <p class="clausula-title">Cláusula 7</p>
           <p>As partes se comprometem a tratar os Dados Pessoais envolvidos na execução do presente Contrato, única e exclusivamente para cumprir com a finalidade a que se destinam e em respeito não só a toda a legislação aplicável sobre segurança da informação, privacidade e proteção de Dados Pessoais, inclusive, mas não se limitando à Lei Federal nº 13.709/2018 ("Lei Geral de Proteção de Dados" ou "LGPD"), sob pena de incidência de multa por descumprimento contratual, sem prejuízo de perdas e danos oriundas de utilização ilícita ou vazamento de dados.</p>
       </div>

       <div class="clausula">
           <p class="clausula-title">Cláusula 8</p>
           <p>Para o recebimento da bonificação mensal, o PARCEIRO ONDA SEGURA deverá anexar mensalmente a nota fiscal em formato XML referente aos serviços prestados. O não envio da nota fiscal no formato especificado e dentro do prazo estabelecido implicará no não pagamento da bonificação referente ao período.</p>
       </div>

       <p class="agreement-text">Assim, por estarem justas e contratadas, as partes elegem e reconhecem como válida a assinatura e autenticação via Portal da Imobiliária, para que surtam seus legais e jurídicos efeitos.</p>
        <div class="clausula">
        ${logsDeVisualizacao}
        </div>
       <div class="signature-block">
           <p>Navegantes, ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]}</p>
            </br>
            </br>
           
           <div><b>${String(imobiliaria?.imobRazaoSocial).toUpperCase()}</b></div>
           <div>CNPJ: ${cpfCnpj.formatarCpfCnpj(imobiliaria?.imobCpfCnpj)}</div>
                </br>
                </br>
           </br>
           </br>
       </div>
        </br>
        </br>

       <div class="footer">
           <h3>NOSSOS CONTATOS</h3>
           <p>sac@ondasegura.com.br - Solicitações, dúvidas e sugestões.</p>
           <p>sinistro@ondasegura.com.br - Dúvidas sobre sinistro</p>
           <p>juridico@ondasegura.com.br - Assessoria jurídica</p>
           <p>www.ondasegura.com.br</p>
           <p>Siga no Instagram @sigaonda</p>
                <div>
                    ${utilsPdf.pdfAssinatura()}
                <div><i>ONDA SEGURA COBRANÇA LTDA</i></div>
                <div><i>CNPJ: 47.389.801/0001-54</i></div>
                </div> 
       </div>
   </div>
</body>
            </html>
        `;

        return content;
    }
};

export default novoTermoComissaoParaAssinaturaModal;
