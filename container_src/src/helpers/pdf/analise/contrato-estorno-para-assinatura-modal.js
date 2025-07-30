import path from "path";
import fs from "fs";

//BIBLIOTECAS
import puppeteer from "puppeteer";

//HELPERS

//BANCO DE DADOS
//import moeda from "../../mvc/utils/formatar/modeda.js";
//UTILS

import getDataHorarioAtual from "../../../mvc/utils/datas/get-data-horario-atual.js";
import utilsPdf from "../utils-pdf.js";
import cpfCnpj from "../../../mvc/utils/formatar/cpf-cnpj.js";
import utilsFormatar from "../../../mvc/utils/formatar/formatar.js";
import moeda from "../../../mvc/utils/formatar/modeda.js";

const encerramentoContratoEstornoModal = class encerramentoContratoEstornoModal {
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
                          FORMULÁRIO DE SOLICITAÇÃO DE ESTORNO E CANCELAMENTO DE CONTRATO DE FIANÇA LOCATÍCIA
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

    static async gerarContrato({imobiliaria, locatario, chaveTransferencia, dados, contrato, assinado = true}) {
        const logsDeVisualizacao = await utilsPdf.gerarLogVisualizacao({
            matrixLogVisualizacao: contrato?.contrato,
            evento: "botao-assinar-encerramento-contrato",
        });

        const sign = `<h4>VIII. Assinaturas</h4>
                ${logsDeVisualizacao}
                <div class="signature-block">
                <div>${String(imobiliaria?.imobRazaoSocial).toUpperCase()}<br>
                    CNPJ: ${cpfCnpj.formatarCpfCnpj(imobiliaria?.imobCpfCnpj)}</div>
                <div class="signature-line">${String(imobiliaria?.imobFantasia)}</div>
                </div>
                <div class="footer">
                <h3>NOSSOS CONTATOS</h3>
                <p>sac@ondasegura.com.br - Solicitações, dúvidas e sugestões.</p>
                <p>sinistro@ondasegura.com.br - Dúvidas sobre sinistros</p>
                <p>juridico@ondasegura.com.br - Assessoria jurídica</p>
                <p>www.ondasegura.com.br</p>
                <p>Siga no Instagram @sigaonda</p>
                <p>Navegantes, SC ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]}`;

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
                    <h4>QUALIFICAÇÃO DAS PARTES</h4>
                    <div class="clausula">
                        <p class="clausula-title">1. Imobiliária Administradora:</p>
                        <div class="clausula-list">
                            <li>Razão Social: ${imobiliaria.imobNome}</li>
                            <li>CNPJ: ${imobiliaria.imobCpfCnpj}</li>
                            <li>Endereço Completo: ${imobiliaria.imobRua},${imobiliaria.imobNumero},${imobiliaria.imobBairro} - ${imobiliaria.imobCidade}/${imobiliaria.imobUf} ${
            imobiliaria.imobUf
        }</li>
                            <li>Representante Legal: ${imobiliaria.imobContato}</li>
                            <li>Contato (e-mail/telefone): ${utilsFormatar.formatarTelefone(imobiliaria.imobCelular)}</li>
                        </div>
                    </div>
    
                    <div class="clausula">
                        <p class="clausula-title">2. Locatário:</p>
                        <div class="clausula-list">
                            <li>Nome Completo: ${locatario.locatarioNome}</li>
                            <li>CPF: ${cpfCnpj.formatarCpfCnpj(locatario.locatarioCnpjcpf)}</li>
                            <li>Contato (e-mail/telefone): ${utilsFormatar.formatarTelefone(locatario.locatarioCelular)}/${utilsFormatar.formatarTelefone(
            locatario.locatarioTelefone
        )}</li>
                            <li>PIX Chave: ${chaveTransferencia}</li>
                        </div>
                    </div>
                    
                    <h4>DO OBJETO</h4>
                    <div class="clausula-list">
                        <p>O presente contrato tem por objeto o cancelamento do Contrato de Fiança Locatícia n.º ${
                            contrato?.contrato
                        } e a solicitação de estorno dos valores pagos, conforme apuração da empresa ONDA SEGURA</p>
                    </div>
    
                    <h4>DO VALOR DA FIANÇA</h4>
                    <div class="clausula-list">
                           <p>O valor total da fiança locatícia foi de R$ ${moeda.format(contrato.valorCartaFianca)} (${moeda.escrito(contrato.valorCartaFianca)}).</p>
                    </div>
    
                    <h4>DAS DECLARAÇÕES DA IMOBILIÁRIA</h4>
                    <p>A IMOBILIÁRIA declara que:</p>
                    <div class="clausula-list">
                        <p>a) O contrato de locação foi rescindido ou não chegou a ser concretizado;</p>
                        <p>b) Não há pendências relativas ao contrato de locação;</p>
                        <p>c) Não existem sinistros pendentes de acionamento ou já acionados relativos à fiança prestada;</p>
                        <p>d) Concede ampla, geral e irrevogável quitação à empresa ONDA SEGURA, nada mais podendo ser exigido judicial ou extrajudicialmente em razão do contrato de fiança;</p>
                        <p>e) Com a assinatura deste instrumento, renuncia ao direito de acionamento de sinistros relacionados à fiança prestada, ficando formalmente rescindido o vínculo entre as partes, inclusive perdendo qualquer eventual direito de acionamento de sinistro que possa ter tido relativamente ao contrato.</p>
                    </div>
                    <p>Declara, ainda, estar ciente que em caso de informações inverídicas ou omissões nas declarações acima, a IMOBILIÁRIA se responsabiliza por todas as perdas e danos eventualmente atribuídos à ONDA SEGURA, autorizando desde já a retenção e compensação de valores eventualmente devidos.</p>
    
                    
                    <h4>DO ESTORNO</h4>
                   
                    <p>O valor total a ser restituido é de R$ ${moeda.format(dados.valor > 0 ? dados.valor : 0)} (${moeda.escrito(dados.valor > 0 ? dados.valor : 0)}).</p>
                   
                    <p>O valor a ser estornado será apurado pela ONDA SEGURA, observando-se que:</p>
                    <div class="clausula-list">
                        <p>a) A taxa de adesão não será devolvida em nenhuma hipótese;</p>
                        <p>b) A ONDA SEGURA poderá reter e compensar todas as verbas legalmente ou contratualmente devidas em razão da locação e da fiança.</p>
                    </div>

    
                    <h4>PRAZO E FORMA DE RESTITUIÇÃO</h4>
                    <p>A ONDA SEGURA terá o prazo de até 07 (sete) dias úteis após o recebimento deste pedido e dos documentos exigidos para:</p>
                    <div class="clausula-list">
                        <p>a) Efetuar a devolução dos valores devidos;</p>
                        <p>b) Solicitar o cancelamento de parcelas debitadas em cartão de crédito e recorrente junto à operadora, se o caso.</p>
                    </div>
                   
    
                    <h4>DOS DOCUMENTOS NECESSÁRIOS</h4>
                    <p>A IMOBILIÁRIA deverá enviar este contrato assinado pelo seu representante legal e locatário, por meio do portal da ONDA SEGURA, acompanhado dos seguintes documentos:</p>
                    <div class="clausula-list">
                        <p>a) Contrato de locação assinado (se houver);</p>
                        <p>b) Distrato do contrato de locação ou termo de entrega de chaves (se houver).</p>
                    </div>
                    <p>Caso tais documentos não tenham sido assinados, o processo poderá prosseguir, sem prejuízo da veracidade das declarações prestadas pela Imobiliária.</p>
    
                    ${assinado ? sign : ""}
            </p>
                  
                </body>
                </html>
            `;

        return content;
    }
};

export default encerramentoContratoEstornoModal;
