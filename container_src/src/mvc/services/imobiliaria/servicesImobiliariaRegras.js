//BIBLIOTECAS
import crypto from "crypto";
import "dotenv/config";
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//UTILS
import utilsPdf from "../../../helpers/pdf/utils-pdf.js";
//BANCO DE DADOS

//SERVICES
import novoContratoAnexo1ParaAssinaturaModal from "../../../helpers/pdf/novo-contrato-anexo1-para-assinatura-modal.js";
import novoTermoComissaoParaAssinaturaModal from "../../../helpers/pdf/novo-termo-comissao-para-assinatura-modal.js";
const PASSWORD_IMOBILIARIA_MIGRACAO = process.env.PASSWORD_IMOBILIARIA_MIGRACAO;

const servicesImobiliariaRegras = class servicesImobiliariaRegras {
    static async validarPassword(password) {
        const cryptoPass = crypto.createHash("md5").update(password).digest("hex");
        if (cryptoPass !== "e207bf68b188419b7b6a8108ec8f6e35") {
            return setResponse.WARNING({message: "Senha incorreta!"});
        }
        return;
    }

    static async gerarDocumentoComBaseNaKeyUrlPdfContrato({imobiliaria, contratoParaAssinatura}) {
        if (contratoParaAssinatura?.url_pdf_contrato == "novo-contrato-anexo1-para-assinatura-modal") {
            const html = await novoContratoAnexo1ParaAssinaturaModal.contratoServicosOndaSegura2025({
                imobiliaria: imobiliaria,
                contratoParaAssinatura: contratoParaAssinatura,
            });

            const [formData, pdfBuffer] = await novoContratoAnexo1ParaAssinaturaModal.gerarPdf(html, "contrato-2025",27);
            return [formData, pdfBuffer]
        }

        if (contratoParaAssinatura?.url_pdf_contrato == "novo-termo-comissao-para-assinatura-modal") {
            const html2 = await novoTermoComissaoParaAssinaturaModal.gerarTermoComissao({
                imobiliaria: imobiliaria,
                contratoParaAssinatura: contratoParaAssinatura,
            });

            const [formData, pdfBuffer] = await novoTermoComissaoParaAssinaturaModal.gerarPdf(html2, "comissao-2025",27);
            return [formData, pdfBuffer]
        }

        return setResponse.WARNING({message: "Contrato não localizado, verifique!"});
    }
};

export default servicesImobiliariaRegras;
