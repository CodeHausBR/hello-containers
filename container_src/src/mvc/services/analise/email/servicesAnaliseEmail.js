// @ts-nocheck
import sendEmailComEscopoDinamico from "../../../../helpers/email/send-email-com-escopo-dinamico.js";
import utilsEmailFooterHeader from "../../../utils/email/utilsEmailFooterHeader.js";
import VW_CARTAFIANCA_GERAL from "../../../models/mongoose/VW_CARTAFIANCA_GERAL.js";

//helpers
import { emailAnalise } from "../../../../helpers/email/emails-setores.js";
import setResponse from "../../../../helpers/response/setResponse.js";

const servicesAnaliseEmail = class servicesAnaliseEmail {
    constructor({ cartaFianca, funcao }) {
        this.cartaFianca = cartaFianca;
        this.funcao = funcao || ""; // Funções privadas que estão dentro da classe
    }

    async controller() {
        if (this.funcao == "#enviarEmailAnalise") return await this.#enviarEmailAnalise();
    }

    async #enviarEmailAnalise() {
        const escopoEmailAprovado = {
            email: [this.cartaFianca?.locatarioEmail],
            subject: `Garantia Locatícia - ${this.cartaFianca?.locatario}`,
            text: "",
            html: `
                    <html>
                        ${utilsEmailFooterHeader.styles}
                        <body>
                            ${utilsEmailFooterHeader.header}                        
                            <p>Olá, <strong>${this.cartaFianca?.locatario}.</strong></p>
                            <p>Parabéns, sua análise foi <b>APROVADA!</b></p>
                            <p>É com grande satisfação que informamos que sua solicitação de Garantia Locatícia para locação do imóvel junto a imobiliária <b>${this.cartaFianca?.imobiliaria}</b> foi <b>APROVADA!</b> pela <b>ONDA SEGURA</b>.</p>

                            <p>Em breve, nosso setor comercial entrará em contato para negociar a forma de pagamento.</p>

                            <p>Uma <b>ONDA</b> muda tudo! 🌊</p>                            
                            ${utilsEmailFooterHeader.footerVistoria}
                        </body>
                    </html>
                `,
        };

        const escopoEmailReprovado = {
            email: [this.cartaFianca?.locatarioEmail],
            subject: `Garantia Locatícia - ${this.cartaFianca?.locatario}`,
            text: "",
            html: `
                    <html>
                        ${utilsEmailFooterHeader.styles}
                        <body>
                            ${utilsEmailFooterHeader.header}                        
                            <p>Olá, <strong>${this.cartaFianca?.locatario}.</strong></p>
                            <p>Parabéns, sua análise foi <b>APROVADA!</b></p>
                            <p>É com grande satisfação que informamos que sua solicitação de Garantia Locatícia para locação do imóvel junto a imobiliária <b>${this.cartaFianca?.imobiliaria}</b> foi <b>APROVADA!</b> pela <b>ONDA SEGURA</b>.</p>

                            <p>Em breve, nosso setor comercial entrará em contato para negociar a forma de pagamento.</p>

                            <p>Uma <b>ONDA</b> muda tudo! 🌊</p>                            
                            ${utilsEmailFooterHeader.footerVistoria}
                        </body>
                    </html>
                `,
        };

        if (Number(this.cartaFianca?.statusAnaliseCod) === 111 || Number(this.cartaFianca?.statusAnaliseCod) === 114) return await sendEmailComEscopoDinamico(escopoEmailAprovado);
        if (Number(this.cartaFianca?.statusAnaliseCod) === 109 || Number(this.cartaFianca?.statusAnaliseCod) === 110) return await sendEmailComEscopoDinamico(escopoEmailAprovado);
    }

    static async enviarAnexo1Email(cartaFianca = {}, pdfBuffer = Buffer(), email = false) {
        if (email == "false") {
            return;
        }

        const escopoEmail = {
            email: [cartaFianca?.ImobEmail, emailAnalise],
            subject: `ANEXO 1 - ${cartaFianca?.locatario}`,
            attachments: [],
            html: `
                    <html>
                        ${utilsEmailFooterHeader.styles}
                        <cartaFianca>
                            ${utilsEmailFooterHeader.header}                        
                            <p>Olá, <strong>${cartaFianca?.imobiliaria}.</strong></p>
                            <p>Informamos que o Anexo 1 (Contrato: <b>${cartaFianca?.contrato}</b>), que é parte integrante do Contrato de Locação está anexado a este e-mail.</p>
                            <h2><b>Informações relevantes:</b></h2>
                            <li><p>Imobiliária: <b>${cartaFianca?.imobiliaria}</b></p></li>
                            <li><p>Locatário: <b>${cartaFianca?.locatario}</b></p></li>
                            <li><p>CPF/CNPJ: <b>${cartaFianca?.cpf}</b></p></li>
                            <li><p>Plano: <b>${cartaFianca?.plano}</b></p></li>
                            <h3>Pacotes adiconais:</h3>
                            <li><b>Vistoria grátis inclusa*</b></li>
                            <li><p>Pintura externa*: <b>${cartaFianca?.pintura}</b></p></li>
                            <li><p>Limpeza externa*: <b>${cartaFianca?.limpeza}</b></p></li>
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
            filename: `Anexo1_${cartaFianca?.contrato}.pdf`,
            content: pdfBuffer,
            contentType: "aplication/pdf",
        });

        return await sendEmailComEscopoDinamico(escopoEmail).catch(() => {
            return setResponse.EMAIL({ message: "Erro ao enviar e-mail para a imobiliária" });
        });
    }

    static async enviarAprovacaoLocatario(cfAtualizada = Object(), cfDesatualizada = Object(), status = Number()) {
        const escopoEmail = {
            email: [cfAtualizada?.locatarioEmail],
            subject: `Garantia Locatícia - ${cfAtualizada?.locatario}`,
            text: "",
            html: `
                    <html>
                        ${utilsEmailFooterHeader.styles}
                        <body>
                            ${utilsEmailFooterHeader.header}                        
                            <p>Olá, <strong>${cfAtualizada?.locatario}.</strong></p>
                            <p>Parabéns, sua análise foi <b>APROVADA!</b></p>
                            <p>É com grande satisfação que informamos que sua solicitação de Garantia Locatícia para locação do imóvel junto a imobiliária <b>${cfAtualizada?.imobiliaria}</b> foi <b>APROVADA!</b> pela <b>ONDA SEGURA</b>.</p>

                            <p>Em breve, nosso setor comercial entrará em contato para negociar a forma de pagamento.</p>

                            <p>Uma <b>ONDA</b> muda tudo! 🌊</p>                            
                            ${utilsEmailFooterHeader.footerVistoria}
                        </body>
                    </html>
                `,
        };

        if (Number(cfAtualizada?.statusAnaliseCod) === 111 && Number(status) === 111 && Number(cfDesatualizada?.statusAnaliseCod) !== 111) {
            return await sendEmailComEscopoDinamico(escopoEmail);
        }
    }

    static async notificarImobiliráriaExoneracaodeContrato({ contrato = {} }) {
        if (!contrato) {
            return setResponse.EMAIL({ message: "Contrato não informado para notificação da imobiliária." });
        }

        const escopoEmail = {
            email: [contrato?.ImobEmail, emailAnalise],
            subject: `EXONERAÇÃO DA CARTA FIANÇA - ${contrato?.contrato}`,
            attachments: [],
            html: `
                   <html>
                    ${utilsEmailFooterHeader.styles}
                    <exoneracaoContrato>
                        ${utilsEmailFooterHeader.header}
                        <p>Olá, <strong>${contrato?.imobiliaria}.</strong></p>
                        <p>Prezado(a),</p>
                        <p>Após revisão, constatamos a existência de <b>inadimplência</b> no presente contrato de locação. Em razão dessa pendência, o contrato encontra-se sujeito à <b>exoneração</b>, conforme as disposições contratuais vigentes.</p>
                        <p>Nesse sentido, caso não haja pagamento do débito, pelo(a) Locatário(a), nos próximos dias, a empresa procederá com a exoneração, sendo necessária a apresentação de nova garantia locatícia.</p>
                        <h2><b>Informações do contrato:</b></h2>
                        <li>
                            <p>Imobiliária: <b>${contrato?.imobiliaria}</b></p>
                        </li>
                        <li>
                            <p>Locatário: <b>${contrato?.locatario}</b></p>
                        </li>
                        <li>
                            <p>CPF/CNPJ: <b>${contrato?.cpf}</b></p>
                        </li>
                        <li>
                            <p>Plano contratado: <b>${contrato?.plano}</b></p>
                        </li>
                        <p>Estamos à disposição para qualquer esclarecimento.</p>
                        <p>Uma <b>Onda</b> muda tudo 🌊</p>
                        ${utilsEmailFooterHeader.footerVistoria}
                    </exoneracaoContrato>
                    </html>
                `,
        };

        return await sendEmailComEscopoDinamico(escopoEmail).catch(() => {
            return setResponse.EMAIL({ message: "Erro ao enviar e-mail de para a imobiliária" });
        });
    }
    static async notificarLocatarioExoneracaodeContrato({ contrato = {} }) {
        if (!contrato || !contrato?.locatarioEmail) {
            return;
        }

        const escopoEmail = {
            email: [contrato?.locatarioEmail, emailAnalise],
            subject: `EXONERAÇÃO DA CARTA FIANÇA - ${contrato?.contrato}`,
            attachments: [],
            html: `
                   <html>
                    ${utilsEmailFooterHeader.styles}
                    <exoneracaoContrato>
                        ${utilsEmailFooterHeader.header}

                        <p>Olá, <strong>${contrato?.locatario}.</strong></p>

                        <p>Identificamos <b>pendência</b> referente ao contrato de locação abaixo identificado.</p>

                        <p>Solicitamos que o pagamento seja realizado no prazo de <b>2 (dois) dias</b>, contados a partir do recebimento desta notificação.</p>

                        <p>Caso não haja o pagamento no prazo acima, a <b>empresa garantidora</b> se reserva o direito de <b>exonerar-se</b> do presente contrato, conforme previsão contratual, sem prejuízo de serem adotadas as medidas legais cabíveis para a cobrança da dívida.</p>

                        <h2><b>Informações do contrato:</b></h2>
                        <li><p>Imobiliária: <b>${contrato?.imobiliaria}</b></p></li>
                        <li><p>Locatário: <b>${contrato?.locatario}</b></p></li>
                        <li><p>CPF/CNPJ: <b>${contrato?.cpf}</b></p></li>
                        <li><p>Plano contratado: <b>${contrato?.plano}</b></p></li>

                        <p><strong>Agradecemos a atenção e aguardamos seu retorno.</strong></p>
                        <p>Uma <b>Onda</b> muda tudo 🌊</p>

                        ${utilsEmailFooterHeader.footerVistoria}
                    </exoneracaoContrato>
                    </html>
                `,
        };

        return await sendEmailComEscopoDinamico(escopoEmail).catch(() => {
            return setResponse.EMAIL({ message: "Erro ao enviar e-mail de para o locatário" });
        });
    }
};

export default servicesAnaliseEmail;
