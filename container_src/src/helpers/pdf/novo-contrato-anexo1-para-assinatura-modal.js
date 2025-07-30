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

const novoContratoAnexo1ParaAssinaturaModal = class novoContratoAnexo1ParaAssinaturaModal {
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
                            CONTRATO DE PARCERIA DE GARANTIA<br>LOCATÍCIA
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

    static async contratoServicosOndaSegura2025({imobiliaria, contratoParaAssinatura, html}) {
        const ContratoParaAssinatura = {
            url_pdf_contrato: contratoParaAssinatura?.url_pdf_contrato,
            assinado: contratoParaAssinatura?.assinado,
            data_assinatura: contratoParaAssinatura?.data_assinatura,
            data_envio_assinatura: contratoParaAssinatura?.data_envio_assinatura,
            _id: contratoParaAssinatura?._id,
        };

        const logsDeVisualizacao = await utilsPdf.gerarLogVisualizacao({
            matrixLogVisualizacao: imobiliaria?.imobCodigo,
            evento: String(ContratoParaAssinatura?.url_pdf_contrato).trim(),
        });

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
                    <p>Olá, amigo e parceiro!</p>
                    <p>Agradecemos a sua confiança em escolher a <b>Onda Segura</b>.</p>
                    <p>A <b>Onda Segura</b> se orgulha de ser pioneira em Garantia Locatícia do Litoral Catarinense.</p>
                    <p>Temos a cobertura mais completa do mercado, com taxas atrativas e vários projetos de parcerias de marketing.</p>
                
                    <h2>ENTENDA COMO FUNCIONA</h2>
                    <p>Não fique com dúvidas, neste material apresentamos as condições contratuais que regem a fiança locatícia, além dos procedimentos em caso de sinistro e todas as nossas coberturas.</p>
                    <p>O Contrato de Fiança Locatícia (antigo Anexo 1) mencionado neste documento é firmado entre Locatário e <b>Onda Segura</b> e deverá estar anexo ao contrato de locação.</p>
                    <p>Por outro lado, o presente Contrato de Parceria, que regula relação entre Imobiliária/Corretor e <b>Onda Segura</b>, vamos nos referir a você, simplesmente como "Parceiro".</p>
                    <p>Estamos à sua disposição!</p>
                
                    <div class="clausula">
                        <p class="clausula-title">1. Qual é o objetivo da fiança?</p>
                        <p>O Parceiro possui a obrigação contratual perante o Locador de administrar o imóvel e a Locação.</p>
                        <p>Diante disso, o nosso objetivo é garantir para o Parceiro o ressarcimento de verbas decorrentes da locação que não foram pagas pelo Locatário, incluindo verbas locatícias e prejuízos decorrente de danos cobertos pela <b>Onda Segura</b>, respeitadas as condições, coberturas e limites abaixo discriminados em cláusulas específicas.</p>
                        <p>Lembre-se que a <b>Onda Segura</b> está firmando contrato com o Parceiro, para cobrir danos causados pelos Locatários. Por isso, não realizamos pagamentos diretamente para os Locadores dos imóveis, nem cobrimos danos causados pela ação ou responsabilidade legal ou contratual do Locador.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">2. Qual o âmbito Geográfico e vigência da fiança</p>
                        <p>A Fiança Locatícia poderá ser contratada para garantia de contrato de locação de imóvel urbano e rural localizado em todo território nacional.</p>
                        <p>A vigência da fiança locatícia se inicia com imissão do Locatário na posse do imóvel e será válida sempre pelo período de 12 (doze) meses.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">3. Aceitação do nosso contrato</p>
                        <p>A aceitação e aplicação deste contrato ocorrerá após a assinatura pelo Parceiro, ou na ausência do documento assinado, entende-se que o Parceiro aceitou os termos dispostos neste documento ao encaminhar, pela primeira vez, os dados para análise e concretização da fiança locatícia.</p>
                        <p>De qualquer forma, a versão atualizada deste contrato ficará disponível sempre no Portal da Imobiliária.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">4. A validação da fiança locatícia</p>
                        <p>A emissão do Contrato de Fiança Locatícia, que regula a relação entre a <b>Onda Segura</b> e o Locatário, será efetuada com o pagamento da taxa de adesão e da primeira prestação ou valor integral (se pagamento à vista).</p>
                        <p>A <b>Onda Segura</b> assumirá efetivamente posição de Garantidora após o Parceiro cumprir com as seguintes obrigações: colher assinatura do Locatário no Contrato de Fiança Locatícia e anexá-lo assinado no Portal da Imobiliária.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">5. Renovação da fiança locatícia</p>
                        <p>A renovação da Fiança Locatícia é automática. A <b>Onda Segura</b> irá solicitar a renovação a partir o 60º (sexagésimo) dia anterior ao final da sua vigência e irá comunicar o Parceiro.</p>
                        <p>Caso não haja renovação por parte do Locatário ou Parceiro, a <b>Onda Segura</b> fará valer o disposto no art. 40, inciso X da Lei n°. 8.245/91 e conforme disposições específicas sobre a exoneração.</p>
                        <p>A <b>Onda Segura</b> se reserva ao direito de realizar nova análise do Locatário no momento da renovação, podendo disponibilizar condições e/ou valores de fiança diferentes do que os iniciais para a renovação da fiança pelo período seguinte do contrato. Em caso de alteração dos valores de aluguel ou plano do Locatário, o Parceiro se compromete a providenciar a assinatura do Locatário no Contrato de Fiança Locatícia atualizado.</p>
                        <p>A <b>Onda Segura</b>, reserva-se no direito de cobrar, a título de fiança o mesmo valor do período anterior, com atualização monetária pelo IPCA ou praticar descontos garantindo a cobertura total, incluindo o valor do aluguel reajustado mediante aditivo, conforme o plano escolhido.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">6. Como funciona a análise</p>
                        <p>A análise da <b>Onda Segura</b> será feita via Portal da Imobiliária com a inserção dos seguintes dados do Locatário: Nome completo sem abreviações, CPF, telefone, e-mail (do locatário) e dados da locação incluindo todas as taxas solicitadas.</p>
                        <p>Após a inserção dos dados a análise será processada seguindo critérios internos e específicos da <b>Onda Segura</b>, podendo ser solicitados outros documentos ou coparticipantes para complementar os dados a serem analisados.</p>
                        <p>Os planos são apresentados ao Parceiro e contratados conforme o resultado da análise de acordo com o valor do aluguel, condomínio, encargos/taxas e rating do Locatário respeitando o Limite Máximo de Indenização da cobertura.</p>
                        <p>O Parceiro se responsabiliza pela falta ou inconsistência das informações fornecidas.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">7. Planos da Fiança Locatícia</p>
                        <p>A <b>Onda Segura</b> oferece 5 (cinco) tipos de planos: Basic, Standard, Premium, Master e Infinity, que serão escolhidos pelo Parceiro após análise e aprovação do Locatário pela <b>Onda Segura</b>:</p>
                
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                           <tr>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2">Plano</th>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2">Taxa Mensal</th>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2">Cobertura</th>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2"></th>
                           </tr>
                           <tr>
                               <td style="border: 0.1px solid black; padding: 4px;">BASIC</td>
                               <td style="border: 0.1px solid black; padding: 4px;">7,5%</td>
                               <td style="border: 0.1px solid black; padding: 4px;">Até 20x valor do aluguel</td>
                               <td style="border: 0.1px solid black; padding: 4px;"></td>
                           </tr>
                           <tr>
                               <td style="border: 0.1px solid black; padding: 4px;">STANDARD</td>
                               <td style="border: 0.1px solid black; padding: 4px;">9,5%</td>
                               <td style="border: 0.1px solid black; padding: 4px;">Até 30x valor do aluguel</td>
                               <td style="border: 0.1px solid black; padding: 4px;"></td>
                           </tr>
                           <tr>
                               <td style="border: 0.1px solid black; padding: 4px;">PREMIUM</td>
                               <td style="border: 0.1px solid black; padding: 4px;">11%</td>
                               <td style="border: 0.1px solid black; padding: 4px;">Até 40x valor do aluguel</td>
                               <td style="border: 0.1px solid black; padding: 4px;"></td>
                           </tr>
                           <tr>
                               <td style="border: 0.1px solid black; padding: 4px;">MASTER</td>
                               <td style="border: 0.1px solid black; padding: 4px;">12,5%</td>
                               <td style="border: 0.1px solid black; padding: 4px;">Até 40x valor do aluguel</td>
                               <td style="border: 0.1px solid black; padding: 4px;">Cobertura adicional de danos a eletrodomésticos</td>
                           </tr>
                           <tr>
                               <td style="border: 0.1px solid black; padding: 4px;">INFINITY</td>
                               <td style="border: 0.1px solid black; padding: 4px;">16%</td>
                               <td style="border: 0.1px solid black; padding: 4px;">Até 45x valor do aluguel</td>
                               <td style="border: 0.1px solid black; padding: 4px;">Cobertura adicional de danos a eletrodomésticos</td>
                           </tr>
                        </table>
                
                        <p>Observação: as coberturas adicionais de eletrodomésticos não envolvem utensílios de uso pessoal.</p>
                
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                               <tr>
                                   <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2;">Plano</th>
                                   <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2;">Taxa Mensal</th>
                                   <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2;">Cobertura</th>
                                   <th style="border: 0.1px solid black; padding: 4px; text-align: left; background-color: #f2f2f2;">Cobertura Eletrodomésticos</th>
                               </tr>
                               <tr>
                                   <td style="border: 0.1px solid black; padding: 4px;">BASIC</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">7,5%</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Até 20x o aluguel</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Não</td>
                               </tr>
                               <tr>
                                   <td style="border: 0.1px solid black; padding: 4px;">STANDARD</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">9,5%</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Até 30x o aluguel</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Não</td>
                               </tr>
                               <tr>
                                   <td style="border: 0.1px solid black; padding: 4px;">PREMIUM</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">11%</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Até 40x o aluguel</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Não</td>
                               </tr>
                               <tr>
                                   <td style="border: 0.1px solid black; padding: 4px;">MASTER</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">12,5%</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Até 40x o aluguel</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Sim</td>
                               </tr>
                               <tr>
                                   <td style="border: 0.1px solid black; padding: 4px;">INFINITY</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">16%</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Até 45x o aluguel</td>
                                   <td style="border: 0.1px solid black; padding: 4px;">Sim</td>
                               </tr>
                            </table>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">8. Coberturas</p>
                        <p>A partir da data de vigência da Fiança Locatícia, o Parceiro contará com as coberturas respeitando o plano escolhido.</p>
                        <ul>
                            <li>Aluguel;</li>
                            <li>Condomínio;</li>
                            <li>Despesas de água, luz, IPTU, gás, taxa de lixo e taxa de seguro incêndio;</li>
                            <li>Multa por atraso de aluguel;</li>
                            <li>Juros de mora;</li>
                            <li>Danos ao imóvel;</li>
                            <li>Danos aos móveis planejados e mobília solta;</li>
                            <li>Pintura interna;</li>
                            <li>Danos a eletrodomésticos;</li>
                            <li>Limpeza interna do imóvel;</li>
                            <li>Multa por rescisão contratual;</li>
                        </ul>

                        <p>GRUPO 1 (ENCARGOS DA LOCAÇÃO):</p>
                        <ul>
                            <li>Aluguel;</li>
                            <li>Condomínio;</li>
                            <li>Despesas de água, luz, IPTU, gás, taxa de lixo e taxa de seguro incêndio;</li>
                            <li>Multa por atraso de aluguel (limitada a 10% [dez por cento]);</li>
                            <li>Juros de mora limitado a 1% (um por cento) ao mês</li>
                        </ul>
                
                        <p>GRUPO 2 (DANOS E SERVIÇOS):</p>
                        <ul>
                            <li>Danos ao imóvel (somente área interna);</li>
                            <li>Danos aos móveis planejados e mobília solta;</li>
                            <li>Pintura interna;</li>
                            <li>Danos a eletrodomésticos (se previsto no plano contratado);</li>
                            <li>Limpeza interna do imóvel (exclui-se descarte de móveis e outros itens);</li>
                            <li>Multa por rescisão contratual (limitada a 3 aluguéis proporcionais ao período faltante da locação);</li>
                        </ul>
                
                
                        <p>Observações:</p>
                        <div class="clausula-list">
                            <p>a) As coberturas acima são consideradas taxativas, de maneira que itens não mencionados nos grupos acima, não estão inclusos na cobertura;</p>
                            <p>b) Para as taxas: despesas de água, luz, IPTU, gás, taxa de lixo e taxa de seguro incêndio, o valor limite para cobertura será até 2 (duas) vezes o valor informado na análise do locatário, respeitando o limite máximo de cada grupo;</p>
                            <p>c) Em sinistro relativo a danos parciais, quando não agravado pelo estado inicial do item, onde o item puder ser reparado, a indenização paga pela <b>Onda Segura</b> será integral ao valor do reparo, de acordo com o Limite Máximo do Grupo.</p>
                            <p>d) Após análise do setor de sinistro e da impossibilidade de reparo, o valor da indenização será o valor de mercado do item objeto do sinistro;</p>
                            <p>e) Nos planos Master e Infinity o valor máximo de cobertura para Danos a Eletrodomésticos será de 2 (dois) aluguéis;</p>
                            <p>f) O valor de cobertura para o Grupo 2 será limitado em:</p>
                            <ul>
                                <li>Plano Basic: 3 vezes o aluguel;</li>
                                <li>Plano Standard: 5 vezes o aluguel;</li>
                                <li>Plano Premium: 6 vezes o aluguel;</li>
                                <li>Plano Master: 6 vezes o aluguel;</li>
                                <li>Plano Infinity: 6 vezes o aluguel;</li>
                            </ul>
                            <p>g) Os sinistros referentes aos itens do Grupo 2 só poderão ser acionados no momento da rescisão da locação;</p>
                            <p>h) A cobertura de limpeza interna só poderá ser acionada caso o imóvel tenha sido entregue limpo para o Locatário, conforme vistoria inicial;</p>
                        </div>
                    </div>

                    <div class="clausula">
                     
                        <p>O valor total da cobertura de cada grupo será distribuído conforme a cobertura contratada em cada plano. O valor de cobertura do grupo 2 será equivalente ao valor total da limitação da cobertura do plano contratado, enquanto a cobertura do grupo 1 será o valor máximo de indenização do plano, descontada o valor de cobertura do grupo 2. Segue abaixo exemplo:</p>
                              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                           <tr>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left;">Plano</th>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left;">Valor máximo de indenização</th>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left;">Valor total coberturas grupo 2</th>
                               <th style="border: 0.1px solid black; padding: 4px; text-align: left;">Valor total coberturas grupo 1</th>
                           </tr>
                           
                               <td style="border: 0.1px solid black; padding: 4px;">Basic</td>
                           
                           
                               <td style="border: 0.1px solid black; padding: 4px;">20 vezes o aluguel</td>
                           
                           
                               <td style="border: 0.1px solid black; padding: 4px;">3 vezes o aluguel</td>
                           
                           
                               <td style="border: 0.1px solid black; padding: 4px;">17 vezes o aluguel</td>
                           
                        </table>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">9. Coberturas Adicionais</p>
                        <p>A <b>Onda Segura</b> pode disponibilizar coberturas adicionais que podem ser contratadas caso a caso, sendo que a qualquer momento podemos criar novas coberturas adicionais, alterar as existentes ou excluí-las, a critério da <b>Onda Segura</b>.</p>
                        <p>O preço dos pacotes e valores de cobertura também poderão sofrer alteração conforme condições de momento. Mas fique tranquilo, se isso ocorrer você será avisado pelo Portal da Imobiliária.</p>
                
                        <p>No momento, as coberturas adicionais disponíveis são as seguintes:</p>
                
                        <p>a) Pacote Limpeza Externa e Tira Entulho:</p>
                        <p>Consiste na contratação de tira entulho para utilização na limpeza interna e externa, nos serviços de Limpeza de Piscina e remoção de folhas, galhos e outros detritos, e limpeza geral do jardim, sem replantio;</p>
                        <ul>
                            <li>Valor do pacote: R$ 400,00 (quatrocentos reais);</li>
                            <li>Valor da cobertura: limitada a R$ 1.000,00 (mil reais).</li>
                        </ul>
                
                        <p>b) Pacote Reparo Portão/Piscina:</p>
                        <p>Consiste nos serviços de reparo do Portão, motor do portão, motor da piscina e reparo da piscina.</p>
                        <ul>
                            <li>Valor adicional: R$ 500,00 (quinhentos reais);</li>
                            <li>Cobertura: limitada a R$ 2.000,00 (dois mil reais) e apenas a danos ocasionados comprovadamente por culpa ou dolo do Locatário, não podendo ser acionado em casos que haja falhas de fabricação ou de manutenção do equipamento ou tenham os danos ocorridos mesmo com o uso normal do equipamento.</li>
                        </ul>
                
                        <p>Os pacotes adicionais acima mencionados somente poderão ser acionados na Rescisão do contrato.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">10. Limite de Responsabilidade e o Abandono do Imóvel</p>
                        <p>O limite de responsabilidade da <b>Onda Segura</b> cessará na data da desocupação efetiva, no abandono do imóvel, na entrega das chaves ou quando esgotar o prazo do Contrato de Fiança Locatícia, o que ocorrer primeiro.</p>
                        <p>No caso de abandono do imóvel (conforme requisitos dispostos no § 2º do artigo 1.276 do Código Civil), a empresa <b>Onda Segura</b> orientará o Parceiro acerca dos trâmites para certificação do abandono, sendo que as custas cartorárias e as despesas com chaveiro correrão por conta da empresa da <b>Onda Segura</b>.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">11. Situações excluídas e hipóteses de perda de cobertura.</p>
                        <p>As situações abaixo não serão cobertas pela Fiança Locatícia:</p>
                        <ul>
                            <li>Encargos que não sejam legalmente ou contratualmente, exigíveis do Locatário;</li>
                            <li>A não informação dos valores das taxas no envio da análise (despesas de água, luz, IPTU, gás, taxa de lixo e taxa de seguro incêndio);</li>
                            <li>Quando a Fiança Locatícia não for validada;</li>
                            <li>Danos causados ao imóvel pelo Locador ou danos que sejam de responsabilidade do Locador ou do Poder Público ou decorrentes de falhas na construção do imóvel;</li>
                            <li>Danos causados após a desocupação do imóvel ou rescisão da locação;</li>
                            <li>Furto, roubo e apropriação indébita;</li>
                            <li>Cobranças de análise cadastral, vistoria e quaisquer outras despesas que não tenham relação com as coberturas contratadas;</li>
                            <li>Sublocações ou arrendamento de qualquer natureza;</li>
                            <li>Quaisquer danos ou deteriorações decorrentes do uso normal do imóvel, desgastes naturais, danos causados pela ação de temperatura, umidade, infiltração e vibração, bem como poluição e contaminação decorrente de qualquer causa, inclusive a áreas internas que estejam expostas a este risco;</li>
                            <li>Danos que possuam causas preexistentes;</li>
                            <li>Danos anteriores à entrada do Locatário no imóvel;</li>
                            <li>Danos causados por invasão de terceiros ou desvalorização por qualquer causa ou natureza;</li>
                            <li>Desvio de finalidade do imóvel;</li>
                            <li>Quaisquer alterações no contrato de locação, efetuadas sem a expressa anuência da <b>Onda Segura</b>.</li>
                            <li>Danos decorrentes de atividades ilícitas;</li>
                            <li>Atos de autoridade pública, atos de hostilidade ou guerra, operações bélicas, revolução, rebelião, insurreição, confisco, tumultos, motins, greves, brigas e outros atos relacionados ou decorrentes destes eventos;</li>
                            <li>Contaminação por radioatividade de qualquer combustível nuclear; resíduos nucleares ou materiais de armas nucleares;</li>
                            <li>Desmoronamento, inundação de qualquer natureza, tremor de terra e erupção vulcânica;</li>
                            <li>Objetos de decoração (tapetes, quadros, cortinas, enfeites, papel de parede, lustres, etc.), utensílios domésticos, itens pessoais e itens considerados acessórios domésticos;</li>
                            <li>Indenização a terceiros;</li>
                            <li>Multas, danos e reparos anteriores a efetiva posse do imóvel pelo locatário;</li>
                            <li>Danos localizados nas redes hidráulicas, elétricas ou telhados;</li>
                            <li>Danos morais ou quaisquer danos a pessoas e animais;</li>
                            <li>Aluguéis e encargos posteriores à morte do Locatário sem que haja autorização prévia da <b>Onda Segura</b>;</li>
                            <li>As despesas extraordinárias de condomínio como tais definidas em lei;</li>
                            <li>Multas por infração de regras condominiais e/ou encargos extraordinários de condomínio (ex. chamada de capital, multas, locação salão de festas, etc.);</li>
                            <li>Multas ou taxas de autoridades públicas decorrentes de atividades, ações ou omissões do Locatário quanto às suas obrigações (ex. alvará de funcionamento, multas da atividade, taxa de ligação/religação de energia, etc.);</li>
                            <li>Cercas, Muros e delimitações de terreno;</li>
                            <li>Fraudes;</li>
                            <li>Inconsistências/inveracidade de informações enviadas pelo Parceiro relativas aos Locatários, Locador ou da locação;</li>
                            <li>Descumprimento do Parceiro, pelo Locatário ou pelo Locador das obrigações deste contrato e de outras obrigações legais, tais como as da Lei de Locações;</li>
                            <li>Descumprimento pelo Parceiro de procedimentos, regras e prazos para acionamento de sinistros ou fornecimento de documentos ou informações;</li>
                            <li>Alterações realizadas no imóvel com autorização do Locador;</li>
                            <li>Danos decorrentes de caso fortuito ou força maior;</li>
                            <li>Danos decorrentes de infestação de cupins;</li>
                            <li>Situações ou objetos que não estejam expressamente incluídas na cobertura.</li>
                        </ul>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">12. Sinistro</p>
                        <p>O sinistro deverá ser acionado pelo Parceiro diretamente no Portal da Imobiliária, fornecendo todas as informações e documentos solicitados. Na falta das informações, poderemos suspender a análise até o fornecimento do que estamos solicitando.</p>
                        <p>A seguir, segue um rol exemplificativo de informações e documentos que devem ser fornecidos para o processamento do sinistro (a <b>Onda Segura</b> poderá exigir informações ou documentos adicionais, a critério da dela):</p>
                        <ul>
                            <li>Contrato de locação devidamente assinado por todas as partes com a clausula da Garantia da <b>Onda Segura</b>;</li>
                            <li>Cópia do termo de entrega das chaves assinado, que deve conter os dados pessoais, endereço atual do locatário, data da entrega amigável das chaves;</li>
                            <li>Cópia do distrato e/ou rescisão contratual firmados, quando da entrega amigável das chaves, o qual deverá conter o valor da dívida, relativa aos aluguéis, encargos legais e, eventuais reparos, discriminados em parcelas, devidamente assinado pelo Locatário ou constando a assinatura de 2 (duas) testemunhas e a menção da recusa do Locatário em efetuar o pagamento do valor devido (seja à vista ou parcelado) ou assinar o distrato;</li>
                            <li>Cópia da rescisão contratual unilateral, quando for o caso, contendo o valor da dívida relativa aos aluguéis, encargos legais e, eventuais reparos, discriminados em parcelas. Este documento deve ter sido, comprovadamente, encaminhado ao Locatário e assinado por duas testemunhas;</li>
                            <li>Boletos ou declaração de débitos dos aluguéis vencidos e não pagos (original);</li>
                            <li>Carnê do IPTU, contas de consumo e boletos de despesas ordinárias condominiais, vencidos e não pagos (conforme contratação);</li>
                
                        <p>O sinistro será analisado pela equipe da <b>Onda Segura</b> e haverá o respectivo retorno no prazo de 15 (quinze) dias sobre o aceite ou não do sinistro.</p>
                
                        <p>Toda comunicação referente aos sinistros (tanto a abertura, andamento e encerramento) devem obrigatoriamente serem feitas pelo Parceiro via Portal da Imobiliária.</p>
                
                        <p>A <b>Onda Segura</b> não será obrigada a aceitar o processamento de sinistros que sejam acionados por outro meio.</p>
                        <p>Em caso de inadimplência da carta fiança, fica suspensa a abertura de sinistros a partir da segunda parcela inadimplida até a regularização total dos débitos pendentes, podendo a imobiliária realizar o pagamento de tais valores caso queira realizar a abertura de sinistros.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">13. Prazos a serem respeitados no acionamento de sinistros</p>
                        
                        <p>a) Aluguéis</p>
                        <p>O sinistro de aluguel deverá ser acionado a partir do 1º (primeiro) dia corrido do vencimento do aluguel, tendo o Parceiro até o 30º (trigésimo) dia corrido a partir do inadimplemento para realizar o acionamento do sinistro de aluguel.</p>
                        
                        <p>b) Condomínio</p>
                        <p>O sinistro de valores referentes ao condomínio deve ser acionado a partir do 1º (primeiro) dia corrido contado do inadimplemento, não devendo ultrapassar 90 (noventa) dias do vencimento.</p>
                        
                        <p>c) Despesas/taxas da locação em geral</p>
                        <p>No que tange às contas de consumo de água e luz, essas devem estar OBRIGATORIAMENTE em nome do proprietário do imóvel para poderem ter seu sinistro aceito. Já os sinistros relativamente às despesas de IPTU, gás, taxa de lixo e taxa de seguro incêndio poderão ser aceitos independente da titularidade, mas tais despesas devem estar OBRIGATORIAMENTE registradas no endereço do imóvel, inclusive com o complemento.</p>
                
                        <p>O sinistro deverá ser acionado a partir do 30º (trigésimo) dia do inadimplemento, com o prazo de 15 (quinze) dias corridos contados a partir do 30º dia do vencimento.</p>
                
                        <p>Caso o Parceiro não acione o sinistro no prazo acima indicado, poderá no momento da rescisão contratual requerer o ressarcimento de despesas de consumo de água, luz, IPTU, gás, taxa de lixo e taxa de seguro incêndio de todo o período da locação.</p>
                        
                        <p>d) Rescisão Contratual</p>
                        <p>Os sinistros de rescisão contratual poderão ser acionados em até 60 (sessenta) dias contados da entrega definitiva das chaves, desocupação efetiva do imóvel ou comprovação do abandono (cuja apuração deverá seguir os procedimentos determinados pela <b>Onda Segura</b>).</p>
                
                        <p>Observação:</p>
                        <ul>
                            <li>A perda dos prazos ou não observação das regras, exigências ou procedimentos de acionamento de sinistro ocasiona a perda do direito de cobertura pelo Parceiro.</li>
                            <li>Após o aceite por parte do Parceiro do resultado do sinistro de rescisão contratual não será permitido nova inclusão de outro sinistro.</li>
                            <li>A multa decorrente da rescisão contratual será limitada em até 3 (três) vezes o valor do aluguel proporcional ao tempo restante do contrato, não podendo ser cumulada com multa de aviso prévio.</li>
                            <li>Se, após a solicitação de documentação ou informação pela <b>Onda Segura</b> para a análise de sinistro, o Parceiro demorar mais que 30 (trinta) dias corridos para responder. Caso não houver resposta neste prazo ou fornecimento das informações ou documentos solicitados, o sinistro se considerará encerrado, não podendo os mesmos fatos serem objeto de novo pedido de sinistro e isentando a <b>Onda Segura</b> do pagamento de qualquer indenização relativamente eles.</li>
                        </ul>
                
                        <p>Os prazos para retorno pela <b>Onda Segura</b> são os seguintes:</p>
                        <ul>
                            <li>Avaliação do sinistro: A <b>Onda Segura</b> se reserva ao direito de avaliar a comunicação de sinistro no prazo de 15 (quinze) dias corridos, contado a partir do recebimento de todos os documentos e informações pela <b>Onda Segura</b> necessários para a análise do sinistro.</li>
                            <li>Prazo para pagamentos: A <b>Onda Segura</b> se compromete a pagar os valores por ela aceitos quanto da cobertura de sinistro, no prazo de 30 (trinta) dias corridos para os sinistros de aluguel, condomínio e despesas/taxas da locação e de 60 (sessenta) dias corridos para os sinistros de rescisão contratual, prazos estes contados após a assinatura do documento Resultado de Sinistro por parte do Parceiro, no portal da imobiliária, salvo quando a data de pagamento cair em uma sexta-feira ou segunda-feira ou final de semana e feriados, sendo processado no próximo dia de previsão de pagamento.</li>
                        </ul>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">14. Suspensão de direito de cobertura</p>
                        <p>A <b>Onda Segura</b> poderá suspender, imediatamente, a abertura, processamento e pagamento de sinistros caso haja qualquer tipo de interpelação extrajudicial ou judicial, notificação, ajuizamento de ações, etc.., relativamente à Locação, à Fiança e ao presente contrato, seja pelo Parceiro, por Locatários ou por Locadores dos imóveis geridos pelo Parceiro ou qualquer outra pessoa envolvida.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">15. Exoneração e Ação de Despejo</p>
                        <p>A <b>Onda Segura</b> tem a faculdade de se exonerar da Fiança, obedecendo as seguintes hipóteses:</p>
                
                        <p>a) Inadimplemento de no mínimo 4 (quatro) parcelas da Fiança Locatícia pelo Locatário;</p>
                        <p>b) Inadimplemento de no mínimo 2 (dois) aluguéis consecutivos pelo Locatário;</p>
                        <p>c) Qualquer alteração contratual ou fática da locação sem anuência da <b>Onda Segura</b>;</p>
                        <p>d) Descumprimento contratual do Locatário ou do Parceiro;</p>
                        <p>e) A não renovação da Carta Fiança;</p>
                        <p>f) A pedido do Parceiro.</p>
                
                        <p>A exoneração da Fiança feita a pedido do Parceiro será analisada pela <b>Onda Segura</b>, a critério desta, sendo que aceita a exoneração por solicitação do Parceiro, este isentará a <b>Onda Segura</b> do pagamento da multa rescisória e aviso prévio do contrato de locação, bem como será limitada a cobertura de Rescisão Contratual do Grupo 2 em 5 (cinco) vezes o valor do aluguel.</p>
                
                        <p>A partir da comunicação da exoneração para o Parceiro, a <b>Onda Segura</b> possuirá responsabilidade pelo prazo legal, conforme §2º do art. 12 da Lei de Locações.</p>
                
                        <p>Após o envio da exoneração ao Locatário, a <b>Onda Segura</b> não será obrigada a desfazer a exoneração.</p>
                
                        <p>Para propositura de ação judicial de despejo a <b>Onda Segura</b> deverá se exonerar do contrato de fiança e realizar o pagamento das custas processuais e caução, nos termos legais. A Onda Segura apenas ficará responsável pela ação de despejo em caso de inadimplência do Locatário. O Parceiro, desde já, se compromete fornecer todas as informações e documentos solicitados pelo advogado da <b>Onda Segura</b>, em especial o Contrato de Administração do imóvel e a procuração para ajuizamento da Ação de Despejo. Havendo o ajuizamento de ação de despejo, não será devida pela Onda Segura a multa de rescisão da locação em caso de acionamento de sinistro de rescisão contratual.</p>
                        <p>Em caso de exoneração de fiança motivada pelo encerramento da parceria entre Onda Segura e Imobiliária ou que não seja decorrente do descumprimento do Locatário, a Onda Segura não terá a obrigação de ajuizar despejo.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">16. Distrato e Estorno</p>
                        <p>O Parceiro poderá solicitar para a <b>Onda Segura</b> o distrato ou estorno da fiança, que são tratados da seguinte forma:</p>
                
                        <p>a) Distrato</p>
                        <p>Trata-se de cancelamento do contrato de fiança locatícia quando o locatário encerra seu contrato de locação após ter tomado posse do imóvel locado ou em caso de troca de garantia.</p>
                        <p>Deverá o Parceiro solicitar via Portal da Imobiliária, que será devidamente assinado, respeitando as regras constantes no termo de Solicitação de Distrato.</p>
                        <p>Após a análise pela <b>Onda Segura</b> e aviso de aprovação da solicitação de distrato, esta terá o prazo de 30 (trinta) dias após assinatura do distrato para a devolução dos valores (quando existentes) ou cancelamento das parcelas debitadas em cartão de crédito, recorrente ou boleto bancário.</p>
                        <p>Havendo abertura de qualquer sinistro (com ou sem ônus) ou pendências junto a <b>Onda Segura</b> ao longo do contrato de locação ou vigência da Carta de Garantia Locatícia, o valor da carta fiança será integralmente devido pelo Locatário não cabendo nenhum pedido de distrato.</p>
                
                        <p>b) Estorno</p>
                        <p>Trata-se de cancelamento do contrato de fiança quando o locatário não tomar posse do imóvel.</p>
                        <p>Deverá o Parceiro solicitar via Portal da Imobiliária, que será devidamente assinado pelo Parceiro, respeitando as regras constantes no termo de Solicitação de Extorno.</p>
                        <p>Após a análise pela <b>Onda Segura</b> e aviso de aprovação da solicitação de Estorno, esta terá o prazo de 7 (sete) dias úteis para a devolução dos valores (quando existentes) ou cancelamento das parcelas debitadas em cartão de crédito, recorrente ou boleto bancário.</p>
                        <p>A Taxa de adesão não será devolvida em hipótese alguma.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">17. Obrigações gerais do parceiro</p>
                        <p>Constituem obrigações gerais do Parceiro:</p>
                        <ul>
                            <li>Acessar o Portal da imobiliária e ler todos os documentos disponibilizados;</li>
                            <li>Anexar via Portal da Imobiliária o contrato de administração do imóvel e o contrato de locação devidamente assinado pelas partes, e outros documentos solicitados pela <b>Onda Segura</b>;</li>
                            <li>Elaborar o contrato de locação de acordo com a Legislação em vigor;</li>
                            <li>Abster-se de efetuar qualquer alteração no contrato de locação, sem prévia e expressa anuência da <b>Onda Segura</b>, enquanto estiver em vigor a cobertura desta Fiança Locatícia, sob pena de anulação da Fiança;</li>
                            <li>Abster-se de realizar cobranças de dupla garantia nas locações ou de exigir o aluguel de maneira antecipada, ou de realizar qualquer outro descumprimento legal da legislação que rege a locação, sob pena de perda de cobertura;</li>
                            <li>O Parceiro está obrigado a comunicar a <b>Onda Segura</b> via Portal da Imobiliária, logo que saiba, sobre qualquer alteração fática ou fato suscetível de agravar o risco coberto (ex. separação de casal de locatários, brigas e discussões entre locatários, crimes praticados no imóvel, utilização do imóvel em desacordo com o contrato de locação, etc.), sob pena de anulação da Fiança ou de perda da garantia;</li>
                            <li>Realizar o envio de análise e comunicação de sinistros somente via Portal da Imobiliária ou outro meio autorizado pela <b>Onda Segura</b>;</li>
                            <li>Respeitar os critérios de aprovação não enviando para análise outro locatário ligado ou indicado (exemplo: amigos, parentes, namorado) pelo reprovado, já enviado pelo Parceiro à <b>Onda Segura</b>, sob pena de anulação da Fiança;</li>
                            <li>Cadastrar e manter atualizados os dados bancários e chave PIX da conta de sua titularidade no Portal da Imobiliária para recebimento de sinistros;</li>
                            <li>Garantir que pelo menos uma das pessoas que contratem a fiança da <b>Onda Segura</b> residam no imóvel objeto da locação, sob pena de perda da garantia;</li>
                            <li>Garantir que todas as pessoas constantes no Contrato de Fiança Locatícia estejam inseridas e assinem o Contrato de Locação, mesmo que não seja como Locatário;</li>
                        </ul>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">18. Inclusão de cláusula da garantia locatícia no contrato de locação</p>
                        <p>O parceiro ainda deverá, sob pena de perda da garantia, acrescentar a cláusula de "GARANTIA LOCATÍCIA" no contrato de locação a ser assinado com o Locatário, sob pena de invalidade da Fiança e impossibilidade de acionamento de garantia, com a seguinte redação:</p>
                        <div style="border: thin solid #000; margin: 30px; padding: 5px;">
                            <p class="title-alert-contrato"><b>Contrato de fiança:</b>Para assegurar o cumprimento das obrigações decorrentes do presente contrato de locação, o(s) Locatário(s) concorda em celebrar Contrato de Fiança Locatícia com a ONDA SEGURA COBRANÇA LTDA, de nome fantasia ONDA SEGURA, registrada no CNPJ: 47.389.801/0001-54.</p>

                            <p class="title-alert-contrato">Os termos específicos da garantia locatícia estão minuciosamente descritos no Contrato de Fiança Locatícia, o qual constitui parte integrante e indissociável deste contrato de locação.</p>

                            <p class="title-alert-contrato"><b>Exoneração e despejo:</b> O(s) Locatário(s) manifesta(m) seu entendimento inequívoco de que, no caso de exoneração da ONDA SEGURA de sua qualidade de fiadora, assume o compromisso de efetuar a substituição da garantia locatícia no prazo máximo de 30 (trinta) dias, contados a partir da notificação formal de exoneração. A notificação de exoneração poderá ser enviada pela ONDA SEGURA, pelo Locador ou pela Imobiliária. O descumprimento do prazo estipulado sujeitará o(s) Locatário(s) à possibilidade de instauração da competente ação de despejo, que poderá ser ajuizada pelo Locador ou pela Imobiliária Parceira.</p>

                            <p class="title-alert-contrato"><b>Dados pessoais:</b> O(s) Locatário(s) autoriza(m) a <b>Onda Segura</b> a utilizar todos os seus dados pessoais para as finalidades relacionadas ao contrato de locação e de fiança, sem necessidade de outros atos de consentimento, permitido o compartilhamento de dados pessoais pela <b>Onda Segura</b> para as finalidades ou execução do contrato.</p>

                            <p class="title-alert-contrato"><b>Comunicações:</b> O(s) Locatário(s) autoriza(m) que toda e qualquer comunicação sejam enviadas pelos contatos de costume, especialmente Whatsapp e e-mail inclusive para fins de cobranças, notificações, exoneração, rescisões e citações de processos judiciais.</p>

                            <p class="title-alert-contrato">O(s) Locatário(s) com domicílio residencial ou comercial no imóvel locado outorgam reciprocamente poderes entre si para receber as comunicações decorrentes deste contrato, sendo que a comunicação feita apenas para um deles surtirá efeito perante os demais, sem necessidade de comunicação individual para tais pessoas.</p>

                            <p class="title-alert-contrato">O Locatário possui o compromisso de visualizar e responder as comunicações feitas pela <b>Onda Segura</b>, sendo que, em caso de envio de comunicação pela <b>Onda Segura</b>, caso o(s) Locatário(s) não responda(m) no prazo de 48h (quarenta e oito horas), será automaticamente considerada lida a respectiva comunicação, independentemente de visualização/confirmação de leitura ou resposta.</p>

                            <p class="title-alert-contrato"><b>Relação contratual e civil da <b>Onda Segura</b>:</b> O(s) Locador(es) está(ão) ciente(s) que a <b>Onda Segura</b> possui relação contratual com a imobiliária parceira e com o(s) Locatário(s), garantindo para a imobiliária obrigações do Locatário relativamente ao contrato de locação. A <b>Onda Segura</b> não possui nenhuma relação contratual com o(s) Locador(es), nem responsabilidade civil perante ele(s), sendo que toda a relação da Locação e contato com o Locador deverá ser feito entre ele(s) e a imobiliária, não podendo ser a <b>Onda Segura</b> obrigada a realizar pagamentos diretamente ao(s) Locador(es). O(s) Locador(es), desde já, autoriza(m) a imobiliária parceira a representá-lo em todas as situações que envolvam a <b>Onda Segura</b> relacionadas à locação e autoriza ela a realizar e receber todas as comunicações relativas à locação (em especial as da Lei de Locações) diretamente com a imobiliária parceira, dispensando a <b>Onda Segura</b> de qualquer contato direto perante o(s) Locador(es).</p>

                            <p class="title-alert-contrato"><b>Da responsabilidade dos Locatários e Coparticipantes:</b> Os signatários deste contrato na qualidade de LOCATÁRIOS e COPARTICIPANTES têm a obrigação de efetuar Ressarcimentos de eventuais Valores Contratados inadimplidos pelo(s) Locatário(s) e quitados pela ONDA SEGURA.</p>
                        </div>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">19. Pagamento dos valores da fiança locatícia</p>
                        <p>Os valores da Fiança Locatícia serão calculados com base no plano escolhido pelo Parceiro no momento do envio da análise, cabendo ao Locatário ou ao Parceiro o pagamento do respectivo valor da Fiança Locatícia a cada período de vigência, conforme acordo celebrado em cada contrato de locação.</p>
                        <p>A <b>Onda Segura</b> encaminhará o documento de cobrança via e-mail, SMS ou WhatsApp, diretamente ao Locatário ou seu representante, ou ainda, por expressa solicitação de qualquer um destes, observada a antecedência mínima de 5 (cinco) dias em relação à data do respectivo vencimento.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">20. Vistorias nos imóveis</p>
                        <p>A vistoria prévia do imóvel somente será válida se constar fotos e descrição das condições do imóvel, dos móveis e se for assinada pelo Locatário independentemente, se a vistoria seja feita pela <b>Onda Segura</b> (ou terceiro contratado por ela) ou pelo Parceiro.</p>
                        <p>É de responsabilidade do Parceiro realizar a vistoria às suas expensas e reponsabilidades.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">21. Bonificações</p>
                        <p>Ao que tange as bonificações, essas serão regidas conforme o "Termo de Adesão de Bonificações", que é parte integrante deste contrato.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">22. Lei Geral de Proteção de Dados Pessoais</p>
                        <p>As partes se comprometem a tratar os Dados Pessoais envolvidos na execução do presente Contrato, única e exclusivamente para cumprir com a finalidade a que se destinam e em respeito não só a toda a legislação aplicável sobre segurança da informação, privacidade e proteção de Dados Pessoais, inclusive, mas não se limitando à Lei Federal nº 13.709/2018 ("Lei Geral de Proteção de Dados" ou "LGPD"), sob pena de incidência de multa por descumprimento contratual, sem prejuízo de perdas e danos oriundas de utilização ilícita ou vazamento de dados.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">23. Confidencialidade</p>
                        <p>Fique tranquilo, pois seus dados estão à salvo conosco. Tomaremos todas as medidas para garantir a confidencialidade de todas as informações que você transmitir para nós. De qualquer forma, esperamos reciprocidade neste ponto e também exigiremos do Parceiro que mantenha a confidencialidade de todas as informações e documentos que tiver acesso em razão desta parceria ou da relação entre as partes.</p>
                        <p>Os dados, contratos e mensagens trocadas entre a <b>Onda Segura</b> e o Parceiro são confidenciais e não podem ser repassadas a terceiros, sem o consentimento expresso das partes.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">24. Comunicações entre as partes</p>
                        <p>As comunicações oficiais para o Parceiro serão feitas diretamente pelo Portal da Imobiliária, e-mail ou Whatsapp.</p>
                        <p>Lembre-se que o nosso contrato é apenas com o Parceiro. A <b>Onda Segura</b> nenhuma gerência sobre a Locação e nenhuma responsabilidade com relação ao Locador.</p>
                        <p>Todas as comunicações necessárias ou exigidas por lei, especialmente aquelas previstas na Lei de Locações (ex.: §2º do art. 12), que devam ser direcionadas ao Locador, poderão ser realizadas pela <b>Onda Segura</b> diretamente ao Parceiro. O Parceiro compromete-se a obter a devida autorização do Locador para receber, em seu nome, todas as comunicações relacionadas à Locação e/ou necessárias em razão dela, ficando a <b>Onda Segura</b> dispensada de realizar comunicações ou tratativas diretamente com o Locador. Será considerada a efetiva comunicação do Locador a partir da entrega da comunicação ao Parceiro. A responsabilidade integral pelo cumprimento desta obrigação e por quaisquer tratativas decorrentes será exclusivamente do Parceiro, que responderá inclusive por eventuais alegações do Locador de não recebimento das comunicações.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">25. Situações de omissão ou tolerância</p>
                        <p>Caso ocorram situações que representem omissão, contradição, antinomias ou sobreposição de aplicabilidade de dispositivos contratuais ou legais, elas serão analisadas pela <b>Onda Segura</b>, cuja decisão ficará a critério dela, utilizando-se dos princípios e objetivos do contrato.</p>
                        <p>Em caso de haver tolerância por parte da <b>Onda Segura</b> no cumprimento das obrigações do Parceiro, isso não significará alteração das condições pactuadas ou precedentes a serem invocados pelo Parceiro, que poderão ser exigidas a qualquer tempo e integralmente pela <b>Onda Segura</b>.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">26. Alterações deste instrumento</p>
                        <p>A <b>Onda Segura</b> se reserva, desde já, o direito de atualizar e alterar o conteúdo do presente Instrumento, a qualquer tempo e a seu exclusivo critério, sendo que estas serão comunicadas o Parceiro por meio de aviso ou carregamento de nova versão deste contrato no Portal da Imobiliária. Eventuais alterações serão exigíveis a partir do carregamento no Portal da Imobiliária, sendo que, caso seja exigido aceite, poderá ser suspensa a abertura de sinistros no portal até o efetivo aceite pelo Parceiro, podendo o Parceiro optar pela rescisão imediata do contrato.</p>
                    </div>
                
                    <div class="clausula">
                        <p class="clausula-title">27. Foro</p>
                        <p>As questões judiciais entre o Locador e/ou Imobiliária e a <b>Onda Segura</b> e Locatário e a <b>Onda Segura</b>, serão processadas no foro de Navegantes, objeto da locação, inclusive com relação à sub-rogação da <b>Onda Segura</b> relativamente à fiança.</p>
                
                        <p>Assim, por estarem justas e contratadas, as partes elegem e reconhecem como válida a assinatura eletrônica e autenticação via sistema do Portal Onda Segura (https://portal.ondasegura.com.br/), bem como o registro do aceite por meio do endereço IP, navegador utilizado e localização geográfica, para que surtam seus legais e jurídicos efeitos.</p>
                        </br>
                        ${logsDeVisualizacao}
                    </div>

                    <div class="signature-block">
                        <div >${String(imobiliaria?.imobRazaoSocial).toUpperCase()}<br>
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
                    <p >Navegantes, SC ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${
            getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]
        }</p>
                    </div>
                                <div>
                <div>
                    ${utilsPdf.pdfAssinatura()}
                </div>    
                <div><i>ONDA SEGURA COBRANÇA LTDA</i></div>
                <div><i>CNPJ: 47.389.801/0001-54</i></div>
           </div>
                </div>
            </body>
            </html>
        `;

        return content;
    }
};

export default novoContratoAnexo1ParaAssinaturaModal;
