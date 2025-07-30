import "dotenv/config";
import cors from "cors";
import http from "http";
import express from "express";
import conn from "./src/db/connMysql.js";
import webSocketClient from "./src/helpers/response/web-socket-client.js";
import connMongoose from "./src/db/connMongoose.js";
import apiSerpro from "./src/helpers/api/serpro/api-serpro.js";
import package_json from "./package.json" assert {type: "json"};
import verificacaoCartaFianca from "./src/helpers/cronn/cartafianca/index.js";
const app = express();
app.use(express.json());
app.use(express.static("public"));

const LISTA_URL_BLOQUEADAS_FRONT_END = JSON.parse(process.env.LISTA_URL_BLOQUEADAS_FRONT_END);

app.use(
    cors({
        credentials: true,
        origin: LISTA_URL_BLOQUEADAS_FRONT_END,
    })
);

//ws
const server = http.createServer(app);

new webSocketClient(server);

// Endpoint para a rota base '/'
app.get("/", (req, res) => {
    res.status(200).json({v: package_json.version});
});

//ANALISE
import routesAnalise from "./src/mvc/routes/analise/routeAnalise.js";
app.use("/analise", routesAnalise);

//LOCATARIO
import routesLocatario from "./src/mvc/routes/locatario/routeLocatario.js";
app.use("/locatario", routesLocatario);

//COMERCIAL
import routesComercial from "./src/mvc/routes/comercial/routeComercial.js";
app.use("/comercial", routesComercial);

//SINISTRO
import routesJuridico from "./src/mvc/routes/juridico/routeJuridico.js";
app.use("/sinistro", routesJuridico);

//SINISTRO COBRANÇA
import routesCobranca from "./src/mvc/routes/cobranca/routeCobranca.js";
app.use("/cobranca", routesCobranca);

//VISTORIA
import routesVistoria from "./src/mvc/routes/vistoria/routeVistoria.js";
app.use("/vistoria", routesVistoria);

//USER
import routesUser from "./src/mvc/routes/user/routeUser.js";
app.use("/user", routesUser);

//PUBLIC
import routesPublic from "./src/mvc/routes/public/routePublic.js";
app.use("/public", routesPublic);

//ADMINISTRATIVO
import routesAdministrativo from "./src/mvc/routes/administrativo/routeAdministrativo.js";
app.use("/administrativo", routesAdministrativo);

//FINANCEIRO
import routesFinanceiro from "./src/mvc/routes/financeiro/routeFinanceiro.js";
app.use("/financeiro", routesFinanceiro);

//SUPORTE
import routesSuporte from "./src/mvc/routes/suporte/routeSuporte.js";
app.use("/suporte", routesSuporte);

//DASHBOARD
import routesDashboard from "./src/mvc/routes/dashboard/routeDashboard.js";
app.use("/dashboard", routesDashboard);

//PAGARME
import routesPagarme from "./src/mvc/routes/pagarme/routePagarme.js";
app.use("/pagarme", routesPagarme);

//WEBHOOK
import routesWebhook from "./src/mvc/routes/webhook/routeWebhook.js";
app.use("/webhook", routesWebhook);

//IMOBILIARIA
import routesImobiliaria from "./src/mvc/routes/imobiliaria/routeImobiliaria.js";
app.use("/imobiliaria", routesImobiliaria);

//IMOBILIARIA
import routesMongoose from "./src/mvc/routes/mongoose/routeMongoose.js";
app.use("/mongoose", routesMongoose);

//Auth
import routesAuth from "./src/mvc/routes/auth/routeAuth.js";
app.use("/user/auth", routesAuth);

import routesTi from "./src/mvc/routes/ti/routesTi.js";
app.use("/ti", routesTi);
verificacaoCartaFianca.parar();
verificacaoCartaFianca.iniciar();

conn
    //.sync({force: f-als-se})
    //.sync({alter: true})
    .sync()
    .then(() => {
        console.log("Conectou ao sequelize!");
        app.listen(process.env.SERVER_CONN || 3306);
    })
    .catch((error) => {
        console.log("Erro ao conectar no sequelise:", error);
    });

app.listen(process.env.SERVER_PORT);

server.listen(process.env.WEBSOCKET_PORT, function listening() {
    console.log("Websocket on %d", server.address().port);
});

connMongoose.connect();

console.log("Conectou o wave na porta:", process.env.SERVER_PORT, "- versão:", package_json.version);

// Gera o token imediatamente ao iniciar o servidor
(async () => {
    await apiSerpro.geraToken();
})();

// Atualiza o token a cada 28 minutos
setInterval(async () => {
    await apiSerpro.geraToken();
}, 28 * 60 * 1000);
//}, 50 * 60 * 1000);

//teste cli postman
