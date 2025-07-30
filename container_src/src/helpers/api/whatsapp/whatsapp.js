//BIBLIOTECAS
import "dotenv/config";
import WhatsApp from "whatsapp";

//HELPERS
import setResponse from "../../response/setResponse.js";
import httpRequestProvider from "../../response/http-request-provider.js";
import mensagens from "./mensagens.js";
//BANCO DE DADOS

//SERVICES

// Your test sender phone number
const senderNumber = process.env.WA_PHONE_NUMBER_ID;
const wa = new WhatsApp(senderNumber);
wa.updateTimeout(15000);

// Enter the recipient phone number

const apiWhatsapp = class apiWhatsapp {
    static async message(text) {
        const sent_text_message = await wa.messages.text({body: text}, "5547997831974").catch(() => {
            return setResponse.INTERNAL_REQUEST_API_FAILED({message: "Erro ao enviar mensagem api whatsapp!"});
        });

        return sent_text_message.statusCode();
    }

    static async pdf(props) {
        const {token, url} = props;

        const link = await httpRequestProvider.buscarLinkBombaPdfSimulacaoOuAnexo1Bucket(props);

        const self_hosted_document = {
            link: new URL(link).href,
            caption: "*Baixar simulação* 📁",
            filename: "Simulação.pdf",
        };

        const sent_text_message = await wa.messages.document(self_hosted_document, "5547997831974");

        await this.message(mensagens.simulacao());

        return sent_text_message.statusCode();
    }

    static simulacao() {
        const text = `
    🎉 Olá! 🎉
    
    Espero que todos estejam bem e com um sorriso no rosto! 😄✨
    
    Tenho uma novidade incrível para compartilhar com vocês! 📢 Hoje, estou enviando um arquivo de simulação 📁 que preparei com muito carinho e dedicação. 💪✨
    
    Este arquivo vai ajudar a entender melhor nossas próximas etapas e a visualizarmos os resultados que podemos alcançar juntos! 📈🚀
    
    🔍 O que você vai encontrar no arquivo:
    
    📊 Dados detalhados: Todas as informações necessárias para uma análise completa.
    📑 Gráficos e Tabelas: Visualizações que facilitam a compreensão.
    🚀 Projeções e Metas: Nossas expectativas e objetivos para o futuro.`;

        return text;
    }
};

export default apiWhatsapp;

// const data = {
//     token: getToken(req, res),
//     url: "documentos-31336156102125-2024.pdf",
// };

// const mensagem = await whatsapp.pdf(data);
