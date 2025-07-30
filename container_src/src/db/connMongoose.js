// connMongoose.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

class connMongoose {
    constructor() {
        (this.uri = process.env.URI_MONGOOSE), (this.connection = null);
    }

    async connect() {
        if (!this.connection) {
            // Verifica se já existe uma conexão ativa
            try {
                this.connection = await mongoose.connect(this.uri);
                console.log("Conexão com o MongoDB estabelecida");
            } catch (err) {
                console.error("Erro ao conectar ao MongoDB:", err);
                // process.exit(1); // Encerra o processo se não conseguir conectar
            }
        } else {
            console.log("Conexão com o MongoDB já está ativa");
        }
    }

    async close() {
        if (this.connection) {
            try {
                await mongoose.connection.close();
                console.log("Conexão com o MongoDB fechada");
                this.connection = null; // Reseta a conexão
            } catch (err) {
                console.error("Erro ao fechar a conexão com o MongoDB:", err);
            }
        } else {
            console.log("Nenhuma conexão ativa encontrada para fechar");
        }
    }
}

export default new connMongoose();
