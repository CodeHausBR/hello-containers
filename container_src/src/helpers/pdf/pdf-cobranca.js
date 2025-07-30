//BIBLIOTECAS
import puppeteer from "puppeteer";
//HELPERS
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS
//SERVICES
//UTILS
import moeda from "../../mvc/utils/formatar/modeda.js";
import formatarTexto from "../../mvc/utils/formatar/numero-por-extenso.js";
import cpfCnpj from "../../mvc/utils/formatar/cpf-cnpj.js";

const pdfCobranca = class pdfCobranca {
    static async gerarPdf(pageHtml, nome, fileId) {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox", "node --trace-warnings"],
        });
        const page = await browser.newPage();

        await page.setContent(pageHtml);

        const pdfBuffer = await page.pdf({
            //path: "cobranca.pdf",
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

    static headerTermoConfissao() {
        return `
                <head>
                    <title>Contrato</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            color: #333;
                            margin: 300;
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
                            width: 200px;
                            height: 80px;
                        }


                        hr {
                            border: none;
                            border-top: 1.1px solid #444;
                        }
                        .container {
                            display: flex;
                            justify-content: space-between;
                            color: #ccc;
                        }
                        .container3 {
                            display: flex;
                            justify-content: flex-start;
                            align-itens: center;
                            width: 100%;
                            height: 400px;
                        }
                        .containerAssinatura {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-itens: center;
                            height: 200px;
                            width: 100%;
                            margin-top: 150px;
                        }
                        .divcnpj {
                            display: flex;
                            flex-direction: column;
                            margin-top: -20px;
                            border-top: 2px solid #000;
                            text-align: left;
                            vertical-align: top;
                            width: 260px;
                            
                        }
                        .ondaassinatura .testemunhasAssinaturas {
                            position: relative;
                        }

                        .ondaassinatura {
                            margin-top: 20px;
                            margin-left: 40px;
                        }

                        .divlocatarios, .divtestemunhas {
                            display: flex;
                            flex-direction: row;
                            justify-content: space-around;
                            width: 100%;
                        }

                        .testemunhasAssinaturas{
                            display: flex;
                            flex-direction: column;
                        }

                        imgOndaAssinatura {
                            position: absolute;
                            object-fit: cover;
                            text-align: center;
                            margin-left: 45px;                        
                            margin-top: -12px; 
                            width: 200px;
                            height: 80px;
                            bottom: -25px;
                        }

                        imgTestemunha {
                            width: 160px;
                            height: 60px;
                            margin-top: 0px;
                            object-fit: cover;
                            text-align: center;
                            margin-left: 45px;    
                            position: absolute;                    
                        }

                        .container2 {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            bottom: 0;
                        }
                        .children {
                        
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
                            font-size: 16px;
                            font-weight: bold; 
                            color: #ccc;
                        }
                        .titleCfH1 {
                            font-size: 16px;
                            font-weight: bold; 
                            color: #107ece;
                        }
                        .marginRigth {
                            margin-rigth: 5px;
                        }
                        h6 {
                            line-height: 1;
                            text-align: left;
                            vertical-align: top;
                            margin-top: 3px;
                          }
                        table {
                            width: 50%;
                            border-collapse: collapse;
                            margin: 20px auto;
                        }
    
                        table, th, td {
                            border: 1px solid black;
                        }
    
                        th, td {
                            padding: 3px;
                            text-align: center;
                        }
    
                        th {
                            background-color: #f2f2f2;
                            font-size: 10px;
                        }
                        
                        td {
                            font-size: 10px;
                        }
                    </style>
                </head>
            `;
    }

    static quitacaoDebito({cartaFianca, valorQuitacao}) {
        const content = `
                <!DOCTYPE html>
                <html>
                    ${this.headerTermoConfissao()}
                <body>
                    <div class="container2">
                        <img src="https://lh3.googleusercontent.com/pw/ADCreHd3qtDe-qQXYw4N7lGyvA-FbW4XNLzHjnsNaRhfiK6y7ydzx8U0jtb7WZD02y7L_oTpgIjKUElNXoSoxGepaOngoEanjBpavfcvnEXN7Rg6i2Q37kWVE5fabm-1n_ppSSJUF8GjV64-SRXxA9O1iUqg=w370-h140-s-no">
                        <div style="display: "flex"; flex-direction: "row">
                            <p class="titleCfH1">
                                TERMO DE QUITAÇÃO DE DÉBITO
                            </p>
                        </div>
                    </div>
                    </br>
                    <p>
                        Pelo presente instrumento particular de quitação de débitos, a empresa <b>LATIN
                        AMERICA INV SERVICE LTDA</b>, com nome fantasia <b>Onda Segura</b>, pessoa jurídica de
                        direito privado, inscrita no CNPJ/MF sob o nº 34.637.270/0001-20, com endereço na Av.
                        João Sacavém, 571, Centro, Navegantes, Santa Catarina, doravante denominada
                        "Credora", declara, que recebeu, na data de ${getDataHorarioAtual.DD_MM_YYYY()}, o valor de <b>R$ ${moeda.format(valorQuitacao)}</b> (${moeda
            .escrito(valorQuitacao)
            .toString()}) do(a) locatário(a) <b>${String(cartaFianca?.locatario)?.toUpperCase()}</b>, inscrito(a) no CPF/CNPJ sob o nº ${String(
            cpfCnpj.formatarCpfCnpj(cartaFianca?.cpf)
        )}, doravante denominado(a) "Locatário(a)".
                    </p>

                    <p>
                        A Credora reconhece que o pagamento efetuado pelo(a) Locatário(a) se refere à quitação de todos os débitos pendentes relacionados aos sinistros ocasionados durante vigência de seu contrato de locação e contrato de garantia fiança locatícia, celebrados entre as partes, não havendo mais valores em aberto a serem cobrados.
                    </p>

                    <p>
                        As partes declaram, de comum acordo, que o presente termo de quitação é firmado de boa-fé e em conformidade com a legislação aplicável, extinguindo qualquer obrigação pecuniária pendente entre as partes relacionada aos referidos contratos.
                    </p>        
                        
                    <div class="container3">
                        <div class="containerAssinatura">
                            <p style="margin-left: 5px">
                                Navegantes, ${getDataHorarioAtual?.ARRAY_DIA_MES_ANO()?.[0]} de ${getDataHorarioAtual?.ARRAY_DIA_MES_ANO()?.[1]} de ${
            getDataHorarioAtual?.ARRAY_DIA_MES_ANO()?.[2]
        }
                            </p>
                            <img class="imgAss" src="https://lh3.googleusercontent.com/pw/AP1GczNcfSiFRyG6YiaIT1ybnSL0PQsvLkdhw--FWiNbPJDAysm6AwBBG6K_WDeLelK_DWUWWrcXRxGb6A0ieTCx5T-zDIzVFZgCd5Qd_fFyu5ARIeJV-p2b_V43fgCme2JtohuExnCZISOkvaLRoEOmn1he=w732-h341-s-no-gm">
                                <div class="divcnpj">
                                    <hr>
                                    <h6>
                                        <strong>
                                            ONDA SEGURA </br>
                                            CNPJ: 34.637.270/0001-20
                                        </strong>
                                    </h6>
                                </div>
                            </div>
                    </div>
                </body>
                </html>        
            `;
        return content;
    }

    static confissaoDivida({cartaFianca, negociacao, sinistros, itensSinistro}) {
      
        const content = `
                <!DOCTYPE html>
                <html>
                    ${this.headerTermoConfissao()}
                <body>
                    <div class="container2">
                        <img src="https://lh3.googleusercontent.com/pw/ADCreHd3qtDe-qQXYw4N7lGyvA-FbW4XNLzHjnsNaRhfiK6y7ydzx8U0jtb7WZD02y7L_oTpgIjKUElNXoSoxGepaOngoEanjBpavfcvnEXN7Rg6i2Q37kWVE5fabm-1n_ppSSJUF8GjV64-SRXxA9O1iUqg=w370-h140-s-no">
                        <div style="display: "flex"; flex-direction: "row">
                            <p class="titleCfH1">
                                TERMO DE CONFISSÃO DE DÍVIDA
                            </p>
                        </div>
                    </div>
                    </br>
                    <p>
                        <strong>${cartaFianca?.locatario}</strong>, brasileiro(a), inscrito(a) no CPF sob o nº ${cpfCnpj.formatarCpfCnpj(cartaFianca?.cpf)?.trim()} 
                        ${
                            !cartaFianca?.coparticipante1 && !cartaFianca?.coparticipante2
                                ? ","
                                : cartaFianca?.coparticipante1 && !cartaFianca?.coparticipante2
                                ? ` e <strong>${cartaFianca?.coparticipante1}</strong> brasileiro(a), inscrito(a) no CPF nº ${cartaFianca?.cpfcoparticipante1},`
                                : cartaFianca?.coparticipante1 && cartaFianca?.coparticipante2
                                ? `, <strong>${cartaFianca?.coparticipante1}</strong> brasileiro(a), inscrito(a) no CPF nº ${cartaFianca?.cpfcoparticipante1} e  <strong>${cartaFianca?.coparticipante2}</strong> brasileiro(a), inscrito(a) no CPF nº ${cartaFianca?.cpfcoparticipante2},`
                                : ","
                        } na qualidade de <strong>LOCATÁRIO(A)/DEVEDOR(A)</strong> e <strong>MATRIZ ONDA SEGURA COBRANCA LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o 
                        nº 47.389.801/0001-54, com sede Avenida João Sacavem, nº 571, sala 1206, Centro, cidade de Navegantes, Estado de Santa Catarina, CEP 88370-438, nome fantasia Onda Segura, com endereço eletrônico 
                        juridico@ondasegura.com.br, na qualidade de <strong>CREDORA</strong>, têm justo e firmado entre si este <strong>TERMO DE CONFISSÃO DE DÍVIDA</strong>, nos seguintes termos: 
                    </p>

                    <p>
                        <strong>CLÁUSULA PRIMEIRA - DO OBJETO</strong>
                    </p>

                    <p>
                        1. O presente termo tem por objeto a formalização do adimplemento dos valores pagos pela Onda Segura para a imobiliária, 
                        referente  aos sinistros: ${sinistros?.map((item, i) => `<strong> ${item}</strong>`)}.
                    </p>      
                    
                    <p>
                        <strong>CLÁUSULA SEGUNDA – DOS VALORES DEVIDOS </strong>
                    </p>

                    <p>
                        2. O <strong>LOCATÁRIO(A)/DEVEDOR(A)</strong> confessa dever a <strong>CREDORA</strong>  o valor de 
                        <strong>${moeda.format(negociacao?.valor_corrigido)} (${moeda.escrito(String(negociacao?.valor_corrigido))})</strong>, 
                        devidamente corrigido, referente:
                        ${
                            itensSinistro?.map((item) => ` <b>${item?.sinistroItemGrupoDesc}</b> - ${item?.sinistroItemDescImob}` )
                        }
                        . 
                    </p>

                    <p>
                        2.1. Para fins de formalização do presente acordo, convencionam as partes que o <strong>LOCATÁRIO(A)/DEVEDOR(A)</strong> se compromete a realizar o pagamento do 
                        valor acima em ${negociacao?.quantidade_parcelas} (${formatarTexto.numero_por_extenso({value:negociacao?.quantidade_parcelas})}) parcelas iguais e sucessivas, conforme abaixo: 
                    </p>

                    <table>
                        <thead>
                            <tr>
                                <th style="width:33.3%">Parcela</th>
                                <th style="width:33.3%">Data</th>
                                <th style="width:33.3%">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${
                            negociacao?.parcelamento?.map((item) => 
                                      `<tr>
                                            <td>${item?.parcela}ª</td>
                                            <td>${item?.data}</td>
                                            <td>${item?.valor}</td>
                                        </tr>
                                      `  
                            ).join("")

                        }
                     
                        </tbody>
                    </table>

                    <p>
                        2.2. Os valores acima deverão ser pagos por meio de boleto bancário, valendo o recibo como comprovante de pagamento. 
                    </p>

                    <p>
                        2.3. O não pagamento, no vencimento, de qualquer parcela, fará com que o <strong>LOCATÁRIO(A)/DEVEDOR(A)</strong> incorra em mora, sujeitando-se desta forma, 
                        a cobranças extrajudiciais ou judiciais que se fizerem necessárias, independentemente de notificação.  
                    </p>

                    <p>
                    2.4. Incidirá também a cobrança de multa de 10% (dez por cento) sobre o total do débito existente à época, juros moratórios de 1% (um por cento) ao mês, 
                    honorários advocatícios, estes na base de 20% (vinte por cento), bem como vencimento antecipado  das parcelas vincendas, independentemente de aviso ou interpelação. 
                    </p>
                    <p>
                        <strong>CLÁUSULA TERCEIRA – DA QUITAÇÃO</strong>
                    </p>
                    <p>
                    3. O presente Termo de Confissão de Dívida é firmado em caráter irrevogável e irretratável, obrigando-se as partes por si, seus herdeiros ou sucessores, 
                    a qualquer título, cumprir as obrigações ora assumidas no presente Instrumento. 
                    </p>
                    <p>
                    3.1. Havendo a inadimplência do débito, a dívida voltará para <strong>${moeda.format(negociacao?.valor_corrigido)} (${moeda.escrito(String(negociacao?.valor_corrigido))})</strong>
                    </p>
                    <p>
                    3.2. Após a quitação das parcelas supra, a <strong>CREDORA</strong> dará plena, geral e irrevogável quitação dos débitos pendentes, 
                    para nada mais reclamar, seja a que título for. 
                    </p>
                    <p><strong>CLÁUSULA QUARTA – DAS DISPOSIÇÕES FINAIS </strong></p>
                    <p>
                    4. A dívida ora reconhecida e assumida pelo <strong>LOCATÁRIO(A)/DEVEDOR(A)</strong> como líquida, certa e exigível, no valor acima mencionado, 
                    aplica-se o disposto no artigo 784, III, do Código de Processo Civil, haja vista o caráter de título executivo extrajudicial do presente instrumento. 
                    </p>
                    <p>
                    4.1 Para dirimir as questões oriundas do presente instrumento, é competente o foro da Comarca de Navegantes, Santa Catarina. 
                    </p>
                    <p>
                    E, por estarem de acordo com todas as condições e termos aqui explicitados as partes elegem e reconhecem como válida a assinatura digital e autenticação via sistema ZapSign 
                    (app.zapsign.com.br), para que surtam seus legais e jurídicos efeitos. 
                    </p>


                        
                    <div class="container3">
                        <div class="containerAssinatura">
                            <p style="margin-left: 5px">
                                Navegantes, ${getDataHorarioAtual?.ARRAY_DIA_MES_ANO()?.[0]} de ${getDataHorarioAtual?.ARRAY_DIA_MES_ANO()?.[1]} de ${
                                getDataHorarioAtual?.ARRAY_DIA_MES_ANO()?.[2]
                                }
                            </p>
                            <div class="ondaassinatura">
                                <img class="imgOndaAssinatura" src="https://lh3.googleusercontent.com/pw/AP1GczNcfSiFRyG6YiaIT1ybnSL0PQsvLkdhw--FWiNbPJDAysm6AwBBG6K_WDeLelK_DWUWWrcXRxGb6A0ieTCx5T-zDIzVFZgCd5Qd_fFyu5ARIeJV-p2b_V43fgCme2JtohuExnCZISOkvaLRoEOmn1he=w732-h341-s-no-gm"/>
                                <div class="divcnpj">
                                        <h6>
                                            <strong>
                                            LATIN AMERICA INV SERVICE LTDA  
                                            </strong>
                                            </br>
                                            CNPJ: 34.637.270/0001-20
                                        </h6>
                                </div>
                            </div>
                            <div class="divtestemunhas">
                                <div class="testemunhasAssinaturas">
                                    <img class=" imgTestemunha" src="https://lh3.googleusercontent.com/pw/AP1GczPwoDikzI5b0d-NvDf5I74jlupquLgRLrjTIS8wQ55oUwIB1ymi00m0w7kfcOukWpnni60NfLxeGX8eV17wQ_4oT-uRLl8ORQbFpT4ASHztMFRqdNn2vmntRrVNWewmviFrO0GtCta71weFkiEZQunr=w1280-h766-s-no?authuser=0"/>
                                    <div class="divcnpj">
                                        <h6>
                                            <strong>
                                                Anderson Salviano de Morais
                                            </strong>
                                            </br>
                                            CPF: 201.242.338-80
                                        </h6>
                                    </div>
                                </div>
                                <div class="testemunhasAssinaturas">
                                    <img class=" imgTestemunha" src="https://lh3.googleusercontent.com/pw/AP1GczNfRp_4uOcr4AKn02maiqYhLisF8gWxNrWggmkEJMBBOvgejwIlC_V_Wx4KPt2sm3a2AHP1Q4eXNauJ7LpZr-EZ6CI29DaG3q_tdetNMnebgH7Bvd3YFmyFCsAgPRw1mFDvlx2Ss5jvHbapbIgQ-XsE=w1280-h848-s-no?authuser=0"/>
                                    <div class="divcnpj">
                                        <h6>
                                            <strong>
                                                Brenda Senna da Rosa Porto
                                            </strong>
                                            </br>
                                            CPF: 043.480.590-47
                                        </h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>        
            `;
            // informações referente ao endereço do imovel   
            // com endereço na Rua Célio Renato Gonçalves, nº 36, Ap 302, Edifício Jardim 36, bairro Salto Weissbach, na cidade de Blumenau, Estado de Santa Catarina, 
            // CEP 89032-271
        // cnpj carta fiança 47.389.801/0001-54

        // <p><strong>TOTAL A PAGAR REFERENTE AO SINISTRO:<span>R$ ${moeda.format(valoresSinistro?.grupos?.totalAprovado)}</span></strong></p>

        //             <table>
        //             <thead>
        //                 <tr>
        //                     <th style="width:20%">Categoria</th>
        //                     <th style="width:10%">Valor</th>
        //                     <th style="width:10%">Valor Aprovado</th>
        //                     <th style="width:20%">Status</th>
        //                     <th style="width:40%">Motivo</th>
        //                 </tr>
        //             </thead>
        //             <tbody>

        // ${itensSinistro
        //  ?.map(
        //      (item) => `
        //                 <tr>
        //                     <td>${item?.sinistroItemGrupoDesc}</td>
        //                     <td>${moeda.format(item?.sinistroItemValorTotal)}</td>
        //                     <td>${item?.onda_status_descricao == "Aprovado" ? moeda.format(item?.sinistroItemValorAprovado) : moeda.format(0)}</td>
        //                     <td>${item?.onda_status_descricao}</td>
        //                     <td>${item?.sinistroItemDescOnda}</td>
        //                 </tr>
        //             `
        //  )
        //  .join("")}
        //             </tbody>
        //         </table>

        // <div class="divlocatarios">
        // <div>
        //     <hr>
        //     <h6>
        //         <strong>
        //             locatario 1
        //         </strong>
        //         </br>
        //         CNPJ: 34.637.270/0001-20
        //     </h6>
        // </div>
        // <div>
        //     <hr>
        //     <h6>
        //         <strong>
        //             locatario 2  
        //         </strong>
        //         </br>
        //         CNPJ: 34.637.270/0001-20
        //     </h6>
        // </div>
        // </div>

        return content;
    }
};

export default pdfCobranca;
