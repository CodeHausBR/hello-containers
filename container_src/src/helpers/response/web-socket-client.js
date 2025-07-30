import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { WebSocketServer, WebSocket } from "ws";
import setResponse from "./setResponse.js";
import executarQuery from "../../mvc/utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";

import dotenv from "dotenv";
dotenv.config();

let instance = null;
let servidor = null;

const webSocketClient = class webSocketClient {
    constructor(server) {
        if (instance) {
            return instance;
        }
        if (!servidor) {
            servidor = server;
        }

        this.wss = new WebSocketServer({ server: servidor });
        this.clients = new Map();

        this.wss.on("connection", (ws, req) => {
            this.verifyToken(ws, req);

            ws.on("message", (message) => {
                this.enviarParaEspecificos();
            });

            ws.on("close", () => {
                this.clients.delete(ws);
            });
        });

        instance = this;
    }

    verifyToken(ws, req) {
        try {
            const token = req.url.split("/?token=")[1];

            if (!token) {
                ws.send(
                    JSON.stringify({
                        status: 422,
                        code: "AUTHORIZATION_ERROR",
                        type: "warning",
                        message: "Acesso negado no serviço ws!",
                        count: 0,
                        results: [],
                    })
                );
                ws.close();
                return;
            }
            try {
                const verified = jwt.verify(token, process.env.JSON_WEB_TOKEN_IMOBILIARIA);

                this.clients.set(ws, verified);

                return verified;
            } catch (error) {
                ws.send(
                    JSON.stringify({
                        status: 422,
                        code: "AUTHORIZATION_ERROR",
                        type: "warning",
                        message: "Acesso negado no serviço ws!",
                        count: 0,
                        results: [],
                    })
                );
                ws.close();
                return;
            }
        } catch (error) { }
    }

    enviarParaTodos() {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ comercial: { contrato: "CON-12321312-2024" } }));
                return;
            }
            return;
        });
    }
    /**
     * Função para enviar dados para clientes específicos.
     *
     * @param {Object} objeto - O objeto a ser enviado para os clientes.
     *
     * @example
     * // Exemplo de uso da função
     * ws.enviarParaEspecificos({
     *   ws: {
     *     setor: 'comercial', ou "suporte"
     *     follow: {on: false, message: {}},
     *     event: 'update',
     *     item: cfAtualizada
     *   }
     * });
     */
    enviarParaEspecificos(objeto = Object()) {
        //if (objeto?.ws?.setor === "comercial") {
        for (let [client, clientToken] of this.clients.entries()) {
            if (client.readyState === WebSocket.OPEN) {
                const adicionarID = { ...objeto, id: uuidv4(), horario: getDataHorarioAtual.DD_MM_YYYY_00_00_00(), visualizado: false };

                const newValue = JSON.stringify(adicionarID);

                if (clientToken?.type_user == "ONDA_USER") {
                    client.send(newValue);
                }

                if (clientToken?.onda_imob_id == objeto?.ws?.item?.imobiliariaCod && clientToken?.type_user == "imobiliaria") {
                    client.send(newValue);
                }
            }
        }
        // }
    }

    async clientsInfo() {
        const clientsOnda = [];
        const clientsImob = [];
        for (let [client, clientToken] of this.clients.entries()) {
            if (client.readyState === WebSocket.OPEN) {
                if (clientToken?.type_user === "ONDA_USER") {
                    clientsOnda.push(clientToken?.onda_user_id);
                } else {
                    clientsImob.push(clientToken?.onda_imob_id);
                }
            }
        }

        const colaboradores = async () => {
            if (clientsOnda?.length > 0) {
                return await executarQuery(`
                SELECT  
                userUsername,
                userDepartamento,
                userCpf
                FROM VW_USER WHERE userId IN (${clientsOnda})
            `).catch((err) => {
                    console.log(err, "err 1");
                    return setResponse.DATABASE_ERROR({ message: "Erro ao recuperar users onda no ws!" });
                });
            } else {
                return [];
            }
        };
        const imobiliarias = async () => {
            if (clientsImob?.length > 0) {
                return await executarQuery(`
                SELECT 
                imobCidade,
                imobBairro,
                imobUf,
                imobCpfCnpj,
                imobNome
                FROM VW_IMOB WHERE id IN (${clientsImob})
            `).catch((err) => {
                    return setResponse.DATABASE_ERROR({ message: "Erro ao recuperar users onda no ws!" });
                });
            } else {
                return [];
            }
        };

        const [onda, imob] = await Promise.all([colaboradores(), imobiliarias()]).catch((err) => {
            return setResponse.DATABASE_ERROR({ message: "Erro ao buscar users ws!" });
        });

        return {
            onda: onda,
            imobiliaria: imob,
        };
    }
};

export default webSocketClient;
