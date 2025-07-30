//BIBLIOTECAS

//HELPERS
import getDataHorarioAtual from "../../../utils/datas/get-data-horario-atual.js";
import utilsEmailFooterHeader from "../../../utils/email/utilsEmailFooterHeader.js";
import sendEmailComEscopoDinamico from "../../../../helpers/email/send-email-com-escopo-dinamico.js";
//BANCO DE DADOS
import dotenv from "dotenv";
dotenv.config();
//SERVICES

const servicesPublicEmail = class servicesPublicEmail {
    static async func() {
        // Seu código aqui
    }

    static async followup_email(cod, event, contrato) {
        if (process.env.CONN_DB_USERNAME == "u513552542_sandbox") {
            return;
        }

        const escopoEmail = {
            email: [contrato?.consultorEmail],
            subject: `Contrato: ${cod}`,
            text: "",
            html: `
            <html>
                ${utilsEmailFooterHeader.styles}
                <body>
                ${utilsEmailFooterHeader.header}                        
                <p>Olá, voçê tem uma atualização!</p>
                <p>CONTRATO: <b>${cod}</b></p>
             <p>EVENTO: <b>${event}</b></p>

                <p>Horário: ${getDataHorarioAtual.YYYY_MM_DD_00_00_00(contrato?.criacao)}</p>
                ${
                    contrato &&
                    `
                    <ul>
                        <li><strong>locatário:</strong> ${contrato.locatario}</li>
                        <li><strong>imobiliaria:</strong> ${contrato.imobiliaria}</li>  
                        <li><strong>consultor:</strong> ${contrato.consultor}</li>
                        <li><strong>status analise:</strong> ${contrato.statusanalise}</li>
                        <li><strong>status financeiro:</strong> ${contrato.statusfinanceiro}</li>
                    </ul>

                    `
                }
            </body>

            </html>
        `,
        };
        return await sendEmailComEscopoDinamico(escopoEmail);
    }
};

export default servicesPublicEmail;
