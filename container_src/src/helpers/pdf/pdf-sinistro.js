//BIBLIOTECAS
//HELPERS
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS
//SERVICES
//UTILS
import moeda from "../../mvc/utils/formatar/modeda.js";
import utilsPdf from "./utils-pdf.js";
const pdfSinistro = class pdfSinistro {
    static headerFinalizarSinistro() {
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

    static finalizarSinistro(props) {
        const { sinistro, cartaFianca, itensSinistro, valoresSinistro, contaBancaria } = props;
        const content = `
                <!DOCTYPE html>
                <html>
                    ${this.headerFinalizarSinistro()}
                <body>
                    <div class="container2">
                        <img src="https://lh3.googleusercontent.com/pw/ADCreHd3qtDe-qQXYw4N7lGyvA-FbW4XNLzHjnsNaRhfiK6y7ydzx8U0jtb7WZD02y7L_oTpgIjKUElNXoSoxGepaOngoEanjBpavfcvnEXN7Rg6i2Q37kWVE5fabm-1n_ppSSJUF8GjV64-SRXxA9O1iUqg=w370-h140-s-no">
                        <div style="display: "flex"; flex-direction: "row">
                            <p class="titleCf">RESULTADO DE SINISTRO</p>
                        </div>
                    </div>
    
                    <hr/>
                
                    <div class="container">
                        <div style="display: "flex"; flex-direction: "row">
                            <div class="container">
                                <div class="item"><strong class="marginRigth">Sinistro:</strong>&nbsp${itensSinistro[0]?.sinistroItemMatrix}</div>
                            </div>       
                        </div>
                    </div>
                        
                    <hr/>
                        
                    </br>
                        
                    <p><strong>Referente </strong>: Contrato de Garantia Locatícia, parte integrante do contrato ${cartaFianca?.contrato
            } de locação assinado pelo(s) LOCATÁRIO(S), <strong>${cartaFianca?.locatario}</strong> brasileiro(a), inscrito(a) no CPF/MF nº ${cartaFianca?.cpf}
            ${!cartaFianca?.coparticipante1 && !cartaFianca?.coparticipante2
                ? ""
                : cartaFianca?.coparticipante1 && !cartaFianca?.coparticipante2
                    ? ` e <strong>${cartaFianca?.coparticipante1}</strong> brasileiro(a), inscrito(a) no CPF/MF nº ${cartaFianca?.cpfcoparticipante1}; e de outro lado `
                    : cartaFianca?.coparticipante1 && cartaFianca?.coparticipante2
                        ? ` , <strong>${cartaFianca?.coparticipante1}</strong> brasileiro(a), inscrito(a) no CPF/MF nº ${cartaFianca?.cpfcoparticipante1} e  <strong>${cartaFianca?.coparticipante2}</strong> brasileiro(a), inscrito(a) no CPF/MF nº ${cartaFianca?.cpfcoparticipante2} ;  e de outro lado `
                        : ""
            }
            
            ${cartaFianca.imobiliaria}, pessoa jurídica, inscrita no CNPJ nº ${cartaFianca?.imobiliariaCNPJ}.</p>
    
                    <p>Considerando os termos do sinistro n.º ${itensSinistro[0]?.sinistroItemMatrix}, com abertura em  <strong>${sinistro?.sinistroDataCriacaoFormat
            }</strong> segue o resultado. .</p>
                    <p>Após diligências restou configurada a inadimplência do locatário no que tange aos seguintes valores: </p>
    
                    
                    <br/>  
                    <p><strong>TOTAL A PAGAR REFERENTE AO SINISTRO:<span>R$ ${moeda.format(valoresSinistro?.grupos?.totalAprovado)}</span></strong></p>
                     
                    <table>
                        <thead>
                            <tr>
                                <th style="width:20%">Categoria</th>
                                <th style="width:10%">Valor</th>
                                <th style="width:10%">Valor Aprovado</th>
                                <th style="width:20%">Status</th>
                                <th style="width:40%">Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
    
         ${itensSinistro
                .map(
                    (item) => `
                            <tr>
                                <td>${item?.sinistroItemGrupoDesc}</td>
                                <td>${moeda.format(item?.sinistroItemValorTotal)}</td>
                                <td>${item?.onda_status_descricao == "Aprovado" ? moeda.format(item?.sinistroItemValorAprovado) : moeda.format(0)}</td>
                                <td>${item?.onda_status_descricao}</td>
                                <td>${item?.sinistroItemDescOnda}</td>
                            </tr>
                        `
                )
                .join("")}
                        </tbody>
                    </table>
                   <br/> 
    
                    <p><strong>Motivo: </strong> ${sinistro?.sinistroDescricaoOnda}</p>
    
                    <p>Os valores acima serão pagos à imobiliária pela <strong>ONDA SEGURA</strong> em <strong>${itensSinistro.some((item) => item?.sinistroItemGrupoDesc == "Distrato de Locação") ? "60" : "30"
            } dias</strong> após assinatura deste resultado de sinistro, <b>lembrando que os pagamentos ocorrem somente nas as terças, quartas e quintas-feiras.</b></p>
    
                    <p>A imobiliária se compromete, neste ato, a fazer o repasse desses valores ao(s) proprietário(s) do imóvel.</p>
    
                    <p>Após a quitação das parcelas supra, o ADMINISTRADOR/PROPRIETÁRIO dará plena, geral e irrevogável quitação do Sinistro nº ${itensSinistro[0]?.sinistroItemMatrix
            }.</p>
    
                    <p>Para dirimir as questões oriundas do presente instrumento, é competente o foro de Navegantes.</p>        
                
                    <p>Assim, ao aceitarem os termos e condições apresentados no momento da confirmação eletrônica no site/aplicativo, as partes reconhecem que essa aceitação equivale à assinatura digital e serve como meio válido de autenticação.</p>        
                
                    <p>Assinatura digital e autenticação via sistema Portal (https://portal.ondasegura.com.br/), para que surtam seus legais e jurídicos efeitos.</p>
                    
                    <div class="container3">
                        <div class="containerAssinatura">
                            <p style="margin-left: 5px">Navegantes, ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]
            }</p>
                           ${utilsPdf.pdfAssinatura()}
                            <div class="divcnpj">
                            <hr>
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

        //do imóvel estabelecido na  AAAAAAAAAAAA
        //via <strong>TED (Banco: ${contaBancaria?.contaBancariaBanco}, Agência:${contaBancaria?.contaBancariaAgencia}, Conta Corrente: ${contaBancaria?.contaBancariaNumeroConta}, CNPJ/CPF:${contaBancaria?.cnpjcpf}, Titular:${contaBancaria?.nomeBeneficiario}) </strong>
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

export default pdfSinistro;
