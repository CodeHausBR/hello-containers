//BIBLIOTECAS

//HELPERS
import sendEmailComEscopoDinamico from "../../../../helpers/email/send-email-com-escopo-dinamico.js";
import setResponse from "../../../../helpers/response/setResponse.js";
import onda_followup from "../../../models/public/onda_followup.js";
import {emailComercial, emailTeste} from "../../../../helpers/email/emails-setores.js";
import utilsEmailFooterHeader from "../../../utils/email/utilsEmailFooterHeader.js";

//BANCO DE DADOS

//SERVICES

const servicesJuridicoEmail = class servicesJuridicoEmail {
    static async func() {
        // Seu código aqui
    }

    static async enviarEmailExoneracaoCf(cartaFianca = {}, pdfBuffer = Buffer(), email = false, token) {
        if (email == "false") {
            return;
        }

        const escopoEmail = {
            email: [cartaFianca?.ImobEmail, emailComercial, cartaFianca?.ImobEmail, emailTeste],
            subject: `Exoneração - ${cartaFianca?.locatario}`,
            attachments: [],
            html: `
                    <html>
                        ${utilsEmailFooterHeader.styles}
                        <cartaFianca>
                            ${utilsEmailFooterHeader.header}                        
                            <p>Prezados,</p>
                            <p>Gostaria de informar que em anexo a esta mensagem está o termo de <b>EXONERAÇÃO</b> da Garantia Locatícia do contrato nº <b>${cartaFianca?.contrato}</b></p>
                            <h2><b>Informações relevantes:</b></h2>
                            <li><p>Imobiliária: <b>${cartaFianca?.imobiliaria}</b></p></li>
                            <li><p>Locatário: <b>${cartaFianca?.locatario}</b></p></li>
                            <li><p>CPF/CNPJ: <b>${cartaFianca?.cpf}</b></p></li>
                            <li><p>Plano: <b>${cartaFianca?.plano}</b></p></li>
                            <p>Lembramos que este documento também se encontra disponível para <b>download</b> no aplicativo <a href="https://storage.googleapis.com/onda-app/onda-app.html"><b>mobile</b></a> e <a href="https://portal.ondasegura.com.br/analise"><b>portal</b></a> de clientes da <b>Onda Segura</b>.</p>
                            <h3>Atenção:</h3>
                            <p>Se houver alguma duvida ou necessidade de esclarecimentos adicionais, por favor, envie um e-mail para o nosso <b>SAC sac@ondasegura.com.br</b>.</p>
                            <p><strong>Até Breve!</strong></p>
                            <p>Uma <b>Onda</b> muda tudo 🌊</p>                            
                            ${utilsEmailFooterHeader.footerVistoria}
                        </cartaFianca>
                    </html>
                `,
        };

        escopoEmail.attachments.push({
            filename: `Exoneração_${cartaFianca?.contrato}.pdf`,
            content: pdfBuffer,
            contentType: "aplication/pdf",
        });

        return await sendEmailComEscopoDinamico(escopoEmail)
            .then(async () => {
                await onda_followup.postFollowup({
                    token: token,
                    cod: cartaFianca?.contrato,
                    event: `*Sucesso ao enviar e-mail de exoneração para imobiliária: ${cartaFianca?.ImobEmail} e locatário: ${cartaFianca?.ImobEmail}.`,
                });
            })
            .catch(async () => {
                await onda_followup.postFollowup({
                    token: token,
                    cod: cartaFianca?.contrato,
                    event: `*Erro ao enviar e-mail de exoneração para imobiliária: ${cartaFianca?.ImobEmail} e locatário: ${cartaFianca?.ImobEmail}.`,
                });
                return setResponse.EMAIL({message: "Erro ao enviar e-mail para a imobiliária"});
            });
    }
};

export default servicesJuridicoEmail;
