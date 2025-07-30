//BIBLIOTECAS
import puppeteer from "puppeteer";
import BigNumber from "bignumber.js";
//HELPERS
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS
import moeda from "../../mvc/utils/formatar/modeda.js";
import onda_config_taxas from "../../mvc/models/analise/onda_config_taxas.js";
import onda_parametros_carta_fianca from "../../mvc/models/mongoose/onda_parametros_carta_fianca.js";
import cpfCnpj from "../../mvc/utils/formatar/cpf-cnpj.js";
//SERVICES

const pdfGenerate = class pdfGenerate {
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

    static headerAnexo1() {
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
                        width: 140px;
                        height: 60px;
                        margin-left: 45px;                        
                        margin-top: -12px;                        
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
                        align-itens: flex-end;
                        height: 180px;
                        width: 100%;
                    }
                    .containerAssinatura {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-itens: center;
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
                    .marginRigth {
                        margin-rigth: 5px;
                    }
                    h6 {
                        line-height: 1;
                        text-align: left;
                        vertical-align: top;
                        margin-top: 3px;
                      }
                </style>
            </head>
        `;
    }

    static headerSimulacaoAnexo1() {
        return `
            <head>
                <title>Contrato</title>
                <style>
                body {
                    font-family: sans-serif;
                    background: url("https://api-portal.ondasegura.com.br/bucket/imagem/imagem-25443498591751-2024.png")
                    
                    no-repeat;
                    background-size: cover;
                    display: flex;
                    flex-direction: column;
                }
                .container-principal {
                    display: flex;
                    flex-direction: column;
                    margin-left: 270px;
                    height: 100%;
                }
                columun > * {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    width: 100%;
                    padding: 0;
                }
                label {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    width: 100%;
                    margin-right: 5px;
                }
    
                h1 {
                    color: #3730a3;
                    margin-bottom: 0;
                    font-weight: 600;
                    padding: 0;
                    font-size: 25px;
                }
                h2 {
                    color: #3730a3;
                    margin-bottom: 0;
                    font-weight: 500;
                    margin: 20px 0px 5px 0px;
                    padding: 0;
                    font-size: 22px;
                }
                h3 {
                    color: #3730a3;
                    margin-bottom: 0;
                    font-weight: 400;
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    font-size: 20px;
                }
                p {
                    color: #808080;
                    margin-bottom: 0;
                    text-align: start;
                    text-justify: center;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                    font-size: 14px;
                }
                
                p2 {
                    color: #3730a3;
                    margin-bottom: 0;
                    text-align: start;
                    text-justify: inter-word;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                    font-size: 14px;
                }
                p3 {
                    color: #808080;
                    margin-bottom: 0;
                    text-align: start;
                    text-justify: center;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                    font-size: 16px;
                }
                hr {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                }
                h4 {
                    display: flex;
                    color: #808080;
                    text-align: start;
                    text-justify: inter-word;
                    margin: 0;
                    padding: 0;
                    font-size: 12px;
                }
                stack > * {
                    margin-top: 5px;
                }
                espace {
                    margin: 1px;
                    background-color: red;
                }
                icon {
                    display: flex;
                    width: 25px;
                    height: 25px;
                    margin: 5px;
                }
                centralizar {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                footer {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    width: 100%;
                    margin-left: 100px;
                    padding: 20px; /* Espaçamento opcional */
                    position: fixed;
                    bottom: 0;
                }
            </style>
            </head>
        `;
    }

    static async anexo1(cartaFianca, payments) {
        function generatePaymentsAnexo4() {
            let payment = "";

            function verificarSeTemAdesaoRetirarValor(item) {
                if (item?.payParcelas > 1) return item?.payValorparcelas;

                if (typeof item?.payMetaData !== "string") return item?.payValorparcelas;

                const textoLower = item?.payMetaData.toLowerCase();

                if (textoLower.includes("cartão crédito")) return item?.payValorparcelas;

                return String(Number(item?.payValorparcelas) - 150);
            }

            payments.forEach((item, index) => {
                if (index === 0) {
                    if (payments.length > 1) {
                        payment =
                            payment +
                            `sendo pago nas condições a seguir: <strong>${item?.payParcelas}x de R$ ${moeda.format(verificarSeTemAdesaoRetirarValor(item))}</strong> no ${
                                item?.payTipopagamentoDesc
                            }`;
                        return;
                    } else {
                        payment =
                            payment +
                            `sendo pago na condição a seguir: <strong>${item?.payParcelas}x de R$ ${moeda.format(verificarSeTemAdesaoRetirarValor(item))}</strong> no ${
                                item?.payTipopagamentoDesc
                            }`;
                        return;
                    }
                } else {
                    if (payments.length == index + 1) {
                        payment =
                            payment + ` e <strong>${item?.payParcelas}x de R$ ${moeda.format(verificarSeTemAdesaoRetirarValor(item))}</strong> no ${item?.payTipopagamentoDesc}`;
                        return;
                    } else {
                        payment =
                            payment + `, <strong>${item?.payParcelas}x de R$ ${moeda.format(verificarSeTemAdesaoRetirarValor(item))}</strong> no ${item?.payTipopagamentoDesc}`;
                        return;
                    }
                }
            });

            return payment;
        }

        function verificarSeVaiSomarAdesao() {
            const totalPagar = cartaFianca?.valorCartaFianca;
            const testeValorPago = Number(cartaFianca?.payTotalPago) - Number(totalPagar);
            if (testeValorPago < 1) return cartaFianca?.payTotalPago;

            return totalPagar;
        }

        const content = `
            <!DOCTYPE html>
            <html>
                ${this.headerAnexo1()}
            <body>
                <div class="container2">
                    <img src="https://lh3.googleusercontent.com/pw/ADCreHd3qtDe-qQXYw4N7lGyvA-FbW4XNLzHjnsNaRhfiK6y7ydzx8U0jtb7WZD02y7L_oTpgIjKUElNXoSoxGepaOngoEanjBpavfcvnEXN7Rg6i2Q37kWVE5fabm-1n_ppSSJUF8GjV64-SRXxA9O1iUqg=w370-h140-s-no">
                    <div style="display: "flex"; flex-direction: "row">
                        <p class="titleCf">ANEXO 1 - DA FIANÇA LOCATÍCIA</p>
                        <h6>Contrato:<b>&nbsp${cartaFianca?.contrato}</b></h6>
                    </div>
                </div>

                <hr/>
            
                <div class="container">
                    <div style="display: "flex"; flex-direction: "row">
                        <div class="container">
                            <div class="item"><strong class="marginRigth">Locatário:</strong>&nbsp${cartaFianca?.locatario}</div>
                            <div class="item"><strong class="marginRigth">CPF/CNPJ:</strong>&nbsp${cartaFianca?.cpf}</div>
                        </div>
                        <div class="container">
                            <div class="item"><strong class="marginRigth">Imobiliária:</strong>&nbsp${cartaFianca?.ImobiliariaRazao}</div>
                            <div class="item"><strong class="marginRigth">CPF/CNPJ:</strong>&nbsp${cartaFianca?.imobiliariaCNPJ}</div> 
                        </div>
                    ${
                        (cartaFianca?.coparticipante1 &&
                            `<div class="container">
                            <div class="item">
                                <strong class="marginRigth">Coparticipante 1:</strong>&nbsp${cartaFianca?.coparticipante1}
                            </div>
                            <div class="item">
                                <strong class="marginRigth">CPF/CNPJ:</strong>&nbsp${cartaFianca?.cpfcoparticipante1}
                            </div>
                        </div>`) ||
                        `</>`
                    }
                    ${
                        (cartaFianca?.coparticipante2 &&
                            `<div class="container">
                            <div class="item">
                                <strong class="marginRigth">Coparticipante 2:</strong>&nbsp${cartaFianca?.coparticipante2}
                            </div>
                            <div class="item">
                                <strong class="marginRigth">CPF/CNPJ:</strong>&nbsp${cartaFianca?.cpfcoparticipante2}
                            </div>
                        </div>`) ||
                        `</>`
                    }       
                    </div>
                    <div class="children">
                        <div class="item2">                                
                            <div>Responsável pelo pagamento:<strong>&nbsp${payments[0]?.payTitular || "Não informado"}&nbsp</strong></div>                                   
                            <div>CPF/CNPJ:<strong>&nbsp${payments[0]?.payCpf || "Não informado"}&nbsp</strong></div>                                   
                        </div>
    
                    </div>
                </div>
                    
                <hr/>
                    
                </br>
                    
                <p><strong>Cláusula 1: </strong>O presente anexo é parte integrante do contrato de locação do imóvel cujo o aluguel, ora afiançado, não pode ultrapassar o valor de <strong> R$ ${moeda.format(
                    cartaFianca?.valoraluguel
                )}</strong> (${moeda.escrito(cartaFianca?.valoraluguel)}).</p>

                <p><strong>Cláusula 2: </strong>O LOCATÁRIO contratou a CARTA FIANÇA LOCATÍCIA junto à empresa ONDA SEGURA COBRANCA LTDA. Inscrita no CNPJ/MF: 47.389.801/0001-54, nome fantasia <strong>ONDA SEGURA</strong>, para garantir a presente locação.</p>

                <p><strong>Cláusula 3: </strong>A vigência da referida carta fiança é de <strong>12 (doze) meses</strong>, seguida de renovações obrigatórias anualmente, na qual garantirá esta locação, nos termos do inciso III, do artigo 37º, da Lei do Inquilinato, mediante pagamento do valor descrito a seguir.</p>        

                <p><strong>Cláusula 4: </strong>O valor desta Carta Fiança Locaticia é de  <strong>R$ ${moeda.format(verificarSeVaiSomarAdesao())}</strong> (${moeda
            .escrito(verificarSeVaiSomarAdesao())
            .toString()}),
            
                    ${generatePaymentsAnexo4()}${cartaFianca?.adicionarTextoAdesao}, em nome do responsável pelo pagamento: <strong>${
            payments[0]?.payTitular
        }.</strong> O referido valor deve ser pago de acordo com o inciso XI, do artigo 23° da Lei do Inquilinato, sob pena de rescisão desta locação, com o consequente despejo e cancelamento da mesma.</p>

                <p><strong>Cláusula 5: </strong>No caso de inadimplemento quanto ao valor da carta fiança, será acrescido de multa de 10%, juros de 1% a.m. e imediato vencimento antecipado das parcelas vincendas, no caso de pagamento parcelado.</p>

                <p><strong>Cláusula 6: </strong>A cobertura desta Carta Fiança Locaticia é denominada <strong>${cartaFianca?.plano} (adicionais de pintura externa: ${
            cartaFianca?.pintura
        }; limpeza: ${
            cartaFianca?.limpeza
        }; Vistoria: entrada e saída inclusas no plano)</strong>, Parágrafo único: Para início da cobertura acima, é necessário que o Contrato de Locação seja assinado antes que o(s) LOCATARIO(S) esteja na posse do imóvel, sob pena de isenção de responsabilidade pela empresa <strong>ONDA SEGURA</strong></p>

                <p><strong>Cláusula 7: </strong>Eventuais débitos decorrentes do presente contrato de locação, não pagos pelos LOCATÁRIOS após regularmente notificados (ainda que por aplicativo de mensagem e/ou e-mail), a tanto serão comunicadas as entidades mantenedoras de bancos de dados de proteção ao crédito (SERASA, SPC, Cartórios etc.), quer pelos locadores, quer pela <strong>ONDA SEGURA</strong></p>

                <p><strong>Cláusula 8: </strong>O ADMINISTRADOR constitui a <strong>ONDA SEGURA</strong> sua mandatária, com poderes para defender seus direitos e interesses, representá-lo em juízo ou fora dele, outorgar, aceitar, receber e quitar tudo quanto lhe for devido a título de aluguéis, encargos e multas decorrentes do sinistro, anuir e assinar, com poderes especiais para transigir, confessar, fazer acordos, firmar compromissos, propor ações e respondê-las, nomear advogado, outorgar mandato, representá-lo perante o foro em geral e praticar todos os atos afins.</p>        
            
                <p><strong>Cláusula 9: </strong>Para exercer os direitos e dar cumprimento às obrigações desse contrato, os LOCATÁRIOS constituem-se reciprocamente PROCURADORES, conferindo-se mutuamente poderes especiais para receber citações, notificações e intimações, confessar, desistir e assinar tudo quanto se tornar necessário, transigir em juízo ou fora dele, fazer acordos, firmar compromissos judiciais ou extrajudiciais, receber e dar quitação.</p>        
            
                <p><strong>Cláusula 10: </strong>As partes acordam, expressamente, que o inadimplemento, referente ao aluguel, superior ao período de 15 dias, dará direito à imediata ordem de despejo independentemente de ordem judicial e sem devolução do valor pago a título de garantia locatícia.</p>

                <p><strong>Cláusula 11: </strong>No mesmo sentido, fica acordado entre as partes que, o inadimplemento referente à carta fiança ou qualquer de suas parcelas, num período superior a 15 (quinze) dias, ensejará a imediata rescisão unilateral, sendo o LOCATÁRIO responsável por substituir a garantia junto ao Locador Imobiliária</p>

                <p><strong>Cláusula 12: </strong>O valor pago referente a taxa de adesão, não cabe estorno em hipótese alguma.</p>
            
                <p class="no-space-below"><strong>Cláusula 13:</strong> No caso de desistência da contratação da Carta Fiança, seja pelo Locador, Locatário e/ouImobiliária, antes ou após a entrega das chaves, o valor eventualmente pago e não utilizado até a desistência da locação será devolvido através de depósito bancário (sempre em nome do titular do contrato), com retenção de multa na razão de 20% (vinte por cento) do valor da carta fiança, a titulo de encargos bancários, no prazo máximo de até 30 (trinta) dias corridos, após a assinatura do Distrato de Carta Fiança, nos termos legalmente contados da desistência expressa do LOCATÁRIO.</p>
                <p class="no-space-above"><strong>13.1:</strong> Em circunstâncias nas quais ocorra a desistência ou a saída antecipada do imóvel, e haja a abertura de sinistro durante a vigència da Carta Fiança, é de suma importância enfatizar que nenhum montante será objeto de reembolso ao Locatário</p>
            
                <p><strong>Cláusula 14:</strong> As partes se comprometem a tratar os dados pessoais envolvidos na execução do presente contrato, única e exclusivamente para cumprir com a finalidade a que se destina e em respeito não só a toda a legislação aplicável sobre segurança da informação, privacidade e proteção de Dados Pessoais, inclusive, mas não se limitando à Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados" ou "LGPD), sob pena de incidência de multa por descumprimento contratual, sem prejuízo de perdas e danos oriundas de utilização ilícita ou vazamento de dados.</p>
            
                <p><strong>Cláusula 15:</strong> No caso de cobrança extrajudicial e/ou judicial (da fiança e/ou da locação), ficará o locatário responsável pelas custas de cada procedimento de cobrança sendo responsável ainda por honorários advocaticios, na razão de 20% sobre o valor atualizado do débito</p>
            
                <p class="txtnegrito"><strong>Cláusula 16:</strong> Os LOCATARIOS e seus respectivos COPARTICIPANTES, no ato da assinatura do Contrato de Locação, estão plenamente cientes do conteúdo integral da presente Carta Fiança (Anexo 1), a qual foi disponibilizada durante as negociações mantidas com a Onda Segura.</p>
            
                <p><strong>Cláusula 17:</strong> Os COPARTICIPANTES, se houver, subscrevem uma responsabilidade solidária no âmbito do presente contrato de Carta Fiança, configurando-se como coobrigados quanto ao cumprimento das disposições referentes ao pagamento desta Carta Fiança, conforme estabelecido nos termos delineados na <strong>Cláusula 4</strong>.</p>
            
                <p><strong>Cláusula 18:</strong> Sempre que exigido, as partes elegem e reconhecem como válida a assinatura digital e autenticação via sistema ZapSign (app.zapsign.com.br), ou outro semelhante, para que surtam seus legais e jurídicos efeitos.</p>
                <div class="container3">
                    <div class="containerAssinatura">
                        <p style="margin-left: 5px">Navegantes, ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${
            getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]
        }</p>
                        <img class="imgAss" src="https://lh3.googleusercontent.com/pw/ABLVV86NpwlDCThtWbQ09ue2y2woqYsiJmAjpICkPTGlF-NjGQ0zHdb7GTcM_U5QAbOmcAiaTRn1f0MBSrPnCTNaw872mPhRtuWrLqVUThapKGr2u9UYMwSFWUH2WFYjVh14O-u24vMtKPxCKEyvPiodkc1u=w110-h57-s-no-gm?authuser=1">
                        <hr>
                            <div class="divcnpj">
                                <h6>
                                    <strong>
                                        ONDA SEGURA </br>
                                        CNPJ: 47.389.801/0001-54
                                    </strong>
                                </h6>
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

    static async simulacaoAnexo1(cartaFianca) {
        //Buscar taxas no db
        const ultimaTaxa = await onda_config_taxas.buscarTaxaPeloId_query(cartaFianca?.configTaxaId);

        const get_onda_parametros_carta_fianca = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cartaFianca?.contrato});

        function gerarValorParcelasAPrazo({parecelas, totalAPrazo}) {
            const parcelas = new BigNumber(parecelas);
            const valorTotalAPrazo = new BigNumber(totalAPrazo);

            return valorTotalAPrazo.dividedBy(parcelas);
        }

        function gerarLinhasHTML() {
            return get_onda_parametros_carta_fianca?.onda_config_valores_adicionais
                .filter((plano) => plano.ativo)
                .map(
                    (plano) => `
                    <label>
                        <b><p>Adicional de ${plano.label}:</p></b>
                        <p2>R$ ${plano.valor.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p2>
                    </label>`
                )
                .join("");
        }

        const content = `
            <!DOCTYPE html>
            <html>
                ${this.headerSimulacaoAnexo1()}
            <body>
                    <div class="container-principal">
                    <centralizar>
                    <h1>Parabéns você foi aprovado!</h1>
                    </centralizar>
                    <br />
                    <columun>
                        <stack style="align-items: flex-end">
                            <h4>Código: &nbsp${cartaFianca?.contrato}</h4>
                        </stack>
                        
                        <hr />
                    </columun>
                    <label>
                        <h2>Dados da locação:</h2>
                    </label>
                    <div>
                        <label>
                            <b><p>Imobiliária: &nbsp</p></b>
                            <p>${cartaFianca?.ImobiliariaRazao}</p>
                        </label>
                        <label>
                            <b><p>Locatário: &nbsp</p></b>
                            <p>${cartaFianca?.locatario}</p>
                        </label>
                        <label>
                        <b><p>Cpf/Cnpj: &nbsp</p></b>
                        <p>${cpfCnpj.formatarCpfCnpj(cartaFianca?.cpf)}</p>
                    </label>
                        <label>
                            <b><p>Aluguel estimado: &nbsp</p></b>
                            <p2>R$ ${moeda.format(cartaFianca?.valoraluguel)}</p2>
                        </label>
                        <label>
                            <b><p>Adesão: &nbsp</p></b>
                            <p2>R$ ${moeda.format(cartaFianca?.valoradesao)} (via pix)</p2>
                        </label>
                        <label>
                            <b><p>Cobertura: &nbsp</p></b>
                            <p2>${cartaFianca?.plano.charAt(0).toUpperCase() + cartaFianca?.plano.slice(1).toLowerCase()}</p2>
                        </label>             
                            ${gerarLinhasHTML()}
                    </div>
                    <br />
                    <hr />
                    <centralizar>
                        <h1>Formas de Pagamento</h1>
                        </br>
                        <div style="display: flex; align-items: baseline">
                          
                            <p3><b>Valor à vista:</b> Carta fiança de R$ ${moeda.format(cartaFianca?.valorvista)}${cartaFianca?.adicionarTextoAdesao}.</p3>
                        </div>
                    </centralizar>
                    <br/>
                    <hr />
                    <div>
                        <h2>Opções de parcelamento:</h2>
                        <div>
                        </div>
                        
                        <label>
                            <p3>
                                <b>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                                        <path
                                            d="M48-144v-192h72v120h120v72H48Zm672 0v-72h120v-120h72v192H720ZM168-264v-432h72v432h-72Zm120 0v-432h48v432h-48Zm120 0v-432h72v432h-72Zm120 0v-432h96v432h-96Zm132 0v-432h48v432h-48Zm84 0v-432h48v432h-48ZM48-624v-192h192v72H120v120H48Zm792 0v-120H720v-72h192v192h-72Z"
                                        />
                                    </svg>
                                    Entrada + Parcelas:
                                </b>

                                Entrada de ${Number(ultimaTaxa?.onda_config_porcentagem_pix_mais_boletos * 100)}% no valor de R$ ${moeda.format(
            cartaFianca?.valorvista * Number(ultimaTaxa?.onda_config_porcentagem_pix_mais_boletos)
        )} e saldo em ${cartaFianca?.parcelas}x de R$ ${moeda.format(
            (cartaFianca?.valorvista * (1 - Number(ultimaTaxa?.onda_config_porcentagem_pix_mais_boletos))) / cartaFianca?.parcelas
        )} sem juros no boleto ${cartaFianca?.adicionarTextoAdesao}.
                            </p3>
                        </label>
                        <label>
                        <p3>
                            <b>
                                <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                                <path
                                d="M864-696v432q0 29-21.15 50.5T792-192H168q-29 0-50.5-21.5T96-264v-432q0-29 21.5-50.5T168-768h624q29.7 0 50.85 21.5Q864-725 864-696Zm-696 72h624v-72H168v72Zm0 144v216h624v-216H168Zm0 216v-432 432Z"
                            />
                                </svg>
                                Cartão de crédito:
                            </b>
                            Entrada de ${Number(ultimaTaxa?.onda_config_porcentagem_pix_mais_cartao_credito * 100)}% no valor de R$ ${moeda.format(
            cartaFianca?.valorvista * Number(ultimaTaxa?.onda_config_porcentagem_pix_mais_cartao_credito)
        )} e saldo em ${cartaFianca?.parcelas}x de R$ ${moeda.format(
            (cartaFianca?.valorvista * (1 - Number(ultimaTaxa?.onda_config_porcentagem_pix_mais_cartao_credito))) / cartaFianca?.parcelas
        )}
        sem juros no cartão ${cartaFianca?.adicionarTextoAdesao}.
        </label>
        ${
            cartaFianca?.renovacao == 1
                ? `
                <label>
                <p3>
                    <b>
                        <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                            <path
                                d="M48-144v-192h72v120h120v72H48Zm672 0v-72h120v-120h72v192H720ZM168-264v-432h72v432h-72Zm120 0v-432h48v432h-48Zm120 0v-432h72v432h-72Zm120 0v-432h96v432h-96Zm132 0v-432h48v432h-48Zm84 0v-432h48v432h-48ZM48-624v-192h192v72H120v120H48Zm792 0v-120H720v-72h192v192h-72Z"
                            />
                        </svg>
                        Entrada + Parcelas:
                    </b>

                    1x de R$ ${moeda.format(gerarValorParcelasAPrazo({totalAPrazo: cartaFianca?.valorprazo, parecelas: Number(cartaFianca?.parcelas)}))} 
                    ${
                        cartaFianca?.parcelas > 1
                            ? ` e saldo em ${cartaFianca?.parcelas - 1}x de R$ ${moeda.format(
                                  gerarValorParcelasAPrazo({totalAPrazo: cartaFianca?.valorprazo, parecelas: Number(cartaFianca?.parcelas)})
                              )}  
                    com juros no boleto`
                            : ""
                    } .
                </p3>
            </label>   
            `
                : ""
        }
        </p3>

                      <br/><br/>
                       <p3><b>${cartaFianca?.renovacao == 1 ? "" : "* A taxa de adesão deve ser paga via pix, em caso de desistência a mesma não será devolvida."}<b></p3>
                    </div><br/><br/>
                    <br/><br/>
                    <br/><br/>
                    <label>
                    <p>"As condições de pagamento e parcelas podem variar conforme a simulação realizada. Pacotes adicionais podem afetar essas condições. Por favor, solicite uma nova simulação em caso de dúvidas. Em caso de pagamento recorrente, o titular do cartão deverá  constar no contrato de locação."
                    </p>
                    </label>
              
                </div>
               
                <footer>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p><b>*Esta simulação é válida até ${getDataHorarioAtual.GET_10_DIAS_AFRENTE()}.</b></p>
                    <p>Após esta data, favor solicitar uma nova simulação.</p>
                    
        
                </footer>
                
            </body>
            </html>        
        `;

        function valorAvistaValorPrazoByParcelas(parcelas) {
            if (parcelas > 1) {
                return cartaFianca?.valorprazo;
            } else {
                return cartaFianca?.valorvista;
            }
        }
        return content;
    }

    static async gerarEstornoAnexo1({cartaFianca}) {
        const content = `
        <!DOCTYPE html>
        <html>
            ${this.headerAnexo1()}
        <body>
            <div class="container2">
                <img src="https://lh3.googleusercontent.com/pw/ADCreHd3qtDe-qQXYw4N7lGyvA-FbW4XNLzHjnsNaRhfiK6y7ydzx8U0jtb7WZD02y7L_oTpgIjKUElNXoSoxGepaOngoEanjBpavfcvnEXN7Rg6i2Q37kWVE5fabm-1n_ppSSJUF8GjV64-SRXxA9O1iUqg=w370-h140-s-no">
                <div style="display: "flex"; flex-direction: "row">
                    <p class="titleCf">NOTIFICAÇÃO DE EXONERAÇÃO</p>
                    <h6>Contrato:<b>&nbsp${cartaFianca?.contrato}</b></h6>
                </div>
            </div>
                
            <hr/>
                
            </br>
                <p>Referente ao <b>Contrato de Garantia</b> firmado em ${getDataHorarioAtual.DD_MM_YYYY(cartaFianca.criacao)} por intermédio da imobiliária <b>${
            cartaFianca?.imobiliaria
        }</b>, CNPJ/CPF: <b>${cartaFianca?.imobiliariaCNPJ}</b> e o locatário(ª) <b>${cartaFianca.locatario}</b>, com CPF/CNPJ: <b>${
            cartaFianca.cpf
        }</b>, afiançado pela <b>ONDA SEGURA COBRANÇA LTDA</b> vem:<p>

                <p>Nos termos dispostos no contrato de Carta Fiança Locatícia do imóvel acima descrito e detalhado em cláusula contratual, o dever de prestar Fiança Locatícia pelo tempo que 
                durar o presente contrato. </p>

                <p>Com fundamento no artigo 40, inciso IV da Lei 8245/1991 e artigo 837 do Código Civil, a empresa <b>ONDA SEGURA COBRANÇA LTDA</b> notifica ao locatário(ª) bem como a imobiliária,
                 sobre sua <b>EXONERAÇÃO</b> quanto a obrigatoriedade em continuar a prestar a fiança locatícia a partir da presente data.</p>
               
                <p>Nesses termos, serve a presente para <b>NOTIFICAR</b> Vossas Senhorias, locatário(ª) e imobiliária, que, como lhe faculta a Lei, à partir desta data, a empresa 
                <b>ONDA SEGURA COBRANÇA</b> LTDA não mais se responsabilizará 
                por qualquer dívida proveniente do contrato de locação, <b>EXONERANDO-SE</b> em caráter definitivo e, permanecendo responsável, apenas, pelo prazo legalmente previsto.</p>
                
                <p>Assim, por estarem justas e contratadas, as partes elegem e reconhecem como válida a assinatura digital e autenticação via sistema ZapSign (app.zapsign.com.br), 
                para que surtam seus legais e jurídicos efeitos. Sem mais, cordialmente.</p>
            <div class="container3">
                <div class="containerAssinatura">
                    <p style="margin-left: 5px">Navegantes, ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${
            getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]
        }</p>
                    <img class="imgAss" src="https://lh3.googleusercontent.com/pw/ABLVV86NpwlDCThtWbQ09ue2y2woqYsiJmAjpICkPTGlF-NjGQ0zHdb7GTcM_U5QAbOmcAiaTRn1f0MBSrPnCTNaw872mPhRtuWrLqVUThapKGr2u9UYMwSFWUH2WFYjVh14O-u24vMtKPxCKEyvPiodkc1u=w110-h57-s-no-gm?authuser=1">
                    <hr>
                        <div class="divcnpj">
                            <h6>
                                <strong>
                                    ONDA SEGURA COBRANÇA LTDA</br>
                                    CNPJ: 47.389.801/0001-54
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

    static async novaSimulacao(cartaFianca) {
        //Buscar taxas no db
        const ultimaTaxa = await onda_config_taxas.buscarTaxaPeloId_query(cartaFianca?.configTaxaId);

        const get_onda_parametros_carta_fianca = await onda_parametros_carta_fianca.buscar_configuracao_carta_fianca({contrato: cartaFianca?.contrato});

        function gerarValorParcelasAPrazo({parecelas, totalAPrazo}) {
            const parcelas = new BigNumber(parecelas);
            const valorTotalAPrazo = new BigNumber(totalAPrazo);

            return valorTotalAPrazo.dividedBy(parcelas);
        }

        function renderizar_pagamento_boleto() {
            const tipopagamento = cartaFianca.tipopagamentoID;
            const parcelas = cartaFianca.parcelas;

            if (tipopagamento === 10 && parcelas > 1) {
                return `<label>
                        <p>
                            <b>
                                <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                                    <path
                                        d="M48-144v-192h72v120h120v72H48Zm672 0v-72h120v-120h72v192H720ZM168-264v-432h72v432h-72Zm120 0v-432h48v432h-48Zm120 0v-432h72v432h-72Zm120 0v-432h96v432h-96Zm132 0v-432h48v432h-48Zm84 0v-432h48v432h-48ZM48-624v-192h192v72H120v120H48Zm792 0v-120H720v-72h192v192h-72Z"
                                    />
                                </svg>
                                Boleto (até 12x com juros):
                            </b>
                            Até 12x de R$ ${moeda.format((Number(cartaFianca?.valorprazo || 0) + Number(cartaFianca?.valoradesao || 0)) / 12)},
                            total de R$ ${moeda.format(Number(cartaFianca?.valorprazo || 0) + Number(cartaFianca?.valoradesao || 0))}.
                        </p>
                    </label>`;
            } else {
                return ``;
            }
        }

        function gerarLinhasHTML() {
            return get_onda_parametros_carta_fianca?.onda_config_valores_adicionais
                .filter((plano) => plano.ativo)
                .map(
                    (plano) => `
                    <label>
                        <b><p>Adicional de ${plano.label}:</p></b>
                        <p2>R$ ${plano.valor.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p2>
                    </label>`
                )
                .join("");
        }

        const content = `
            <!DOCTYPE html>
            <html>
                ${this.headerSimulacaoAnexo1()}
            <body>
                    <div class="container-principal">
                    <centralizar>
                    <h1>Parabéns você foi aprovado!</h1>
                    </centralizar>
                    <br />
                    <columun>
                        <stack style="align-items: flex-end">
                            <h4>Código: &nbsp${cartaFianca?.contrato}</h4>
                        </stack>

                        <hr />
                    </columun>
                    <label>
                        <h2>Dados da locação:</h2>
                    </label>
                    <div>
                        <label>
                            <b><p>Imobiliária: &nbsp</p></b>
                            <p>${cartaFianca?.ImobiliariaRazao}</p>
                        </label>
                        <label>
                            <b><p>Locatário: &nbsp</p></b>
                            <p>${cartaFianca?.locatario}</p>
                        </label>
                        <label>
                        <b><p>Cpf/Cnpj: &nbsp</p></b>
                        <p>${cpfCnpj.formatarCpfCnpj(cartaFianca?.cpf)}</p>
                    </label>
                        <label>
                            <b><p>Aluguel estimado: &nbsp</p></b>
                            <p2>R$ ${moeda.format(cartaFianca?.valoraluguel)}</p2>
                        </label>
                        <label>
                            <b><p>Adesão: &nbsp</p></b>
                            <p2>R$ ${moeda.format(cartaFianca?.valoradesao)} (paga junto a carta fiança)</p2>
                        </label>
                        <label>
                            <b><p>Cobertura: &nbsp</p></b>
                            <p2>${cartaFianca?.plano.charAt(0).toUpperCase() + cartaFianca?.plano.slice(1).toLowerCase()}</p2>
                        </label>
                            ${gerarLinhasHTML()}
                    </div>
                    <br />
                    <hr />

                    <centralizar>
                        <h1>Formas de Pagamento à vista sem juros</h1>
                        <br/>

                        <label>
                            <p>
                                <b>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                                        <path
                                            d="M864-696v432q0 29-21.15 50.5T792-192H168q-29 0-50.5-21.5T96-264v-432q0-29 21.5-50.5T168-768h624q29.7 0 50.85 21.5Q864-725 864-696Zm-696 72h624v-72H168v72Zm0 144v216h624v-216H168Zm0 216v-432 432Z"
                                        />
                                    </svg>
                                    PIX:
                                </b>
                                Pagamento de <strong>R$ ${moeda.format(Number(cartaFianca?.valorvista || 0) + Number(cartaFianca?.valoradesao || 0))}</strong>.
                            </p>
                        </label>

                        <label>
                            <p>
                                <b>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                                        <path
                                            d="M864-696v432q0 29-21.15 50.5T792-192H168q-29 0-50.5-21.5T96-264v-432q0-29 21.5-50.5T168-768h624q29.7 0 50.85 21.5Q864-725 864-696Zm-696 72h624v-72H168v72Zm0 144v216h624v-216H168Zm0 216v-432 432Z"
                                        />
                                    </svg>
                                    Cartão de Crédito (1x):
                                </b>
                                Pagamento de <strong>R$ ${moeda.format(Number(cartaFianca?.valorvista || 0) + Number(cartaFianca?.valoradesao || 0))}</strong> sem juros.
                            </p>
                        </label>

                        <label>
                            <p>
                                <b>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                                        <path
                                            d="M48-144v-192h72v120h120v72H48Zm672 0v-72h120v-120h72v192H720ZM168-264v-432h72v432h-72Zm120 0v-432h48v432h-48Zm120 0v-432h72v432h-72Zm120 0v-432h96v432h-96Zm132 0v-432h48v432h-48Zm84 0v-432h48v432h-48ZM48-624v-192h192v72H120v120H48Zm792 0v-120H720v-72h192v192h-72Z"
                                        />
                                    </svg>
                                </b>
                                <strong>Boleto (1x)</strong>:</b> Pagamento à vista de <strong>R$ ${moeda.format(
                                    Number(cartaFianca?.valorvista || 0) + Number(cartaFianca?.valoradesao || 0)
                                )}</strong>.
                            </p>
                        </label>

                    </centralizar>

                    <br/>
                        <hr />
                    <div>

                    <h2>Formas de pagamento a prazo com juros</h2>

                    <label>
                        <p>
                            <b>
                                <svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -1300 960 960" width="20px" fill="#000000">
                                    <path
                                        d="M864-696v432q0 29-21.15 50.5T792-192H168q-29 0-50.5-21.5T96-264v-432q0-29 21.5-50.5T168-768h624q29.7 0 50.85 21.5Q864-725 864-696Zm-696 72h624v-72H168v72Zm0 144v216h624v-216H168Zm0 216v-432 432Z"
                                    />
                                </svg>
                                Cartão de Crédito (até 12x com juros):
                            </b>
                            Até 12x de R$ ${moeda.format((Number(cartaFianca?.valorprazo || 0) + Number(cartaFianca?.valoradesao || 0)) / 12)},
                            total de R$ ${moeda.format(Number(cartaFianca?.valorprazo || 0) + Number(cartaFianca?.valoradesao || 0))}.
                        </p>
                    </label>

                    ${renderizar_pagamento_boleto()}

                </div>

                    <br/><br/>
                    <br/><br/>
                    <br/><br/>
                    <p3><b>${
                        cartaFianca?.renovacao == 1 ? "" : "* A taxa de adesão está embutida no pagamento da carta fiança e, em caso de desistência, a mesma não será devolvida."
                    }<b></p3>
                    <br/><br/>
                    <label>
                    <p>"As condições de pagamento e parcelas podem variar conforme a simulação realizada. Pacotes adicionais podem afetar essas condições. Por favor, solicite uma nova simulação em caso de dúvidas. Em caso de pagamento recorrente, o titular do cartão deverá  constar no contrato de locação."
                    </p>
                    </label>
                       </div>

                </div>

                <footer>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <p><b>*Esta simulação é válida até ${getDataHorarioAtual.GET_10_DIAS_AFRENTE()}.</b></p>
                    <p>Após esta data, favor solicitar uma nova simulação.</p>

                </footer>

            </body>
            </html>
        `;

        function valorAvistaValorPrazoByParcelas(parcelas) {
            if (parcelas > 1) {
                return cartaFianca?.valorprazo;
            } else {
                return cartaFianca?.valorvista;
            }
        }
        return content;
    }
};

export default pdfGenerate;
