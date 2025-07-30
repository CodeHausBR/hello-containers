import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendEmailComEscopoDinamico = async (escopoEmail, req, res) => {
    try {
        const user = process.env.EMAIL_ONDA_USER;
        const pass = process.env.PASSWORD_EMAIL;
        //Atualizado
        if (process.env.CONN_DB_USERNAME == "u513552542_sandbox") {
            escopoEmail.email = ["seflanguilhermesouza@gmail.com"];
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            auth: {user, pass},
        });

        return transporter.sendMail({
            from: {
                name: "Onda App | Onda Segura",
                address: user,
            },
            to: `${escopoEmail?.email}`,
            subject: escopoEmail?.subject,
            html: escopoEmail?.html,
            attachments: escopoEmail?.attachments,
        });
    } catch (error) {
        return res.status(400).json({message: error});
    }
};

export default sendEmailComEscopoDinamico;
