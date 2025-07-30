import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DADOSBANCO = {
    host: process.env.CONN_DB_HOST_SANDBOX,
    user: process.env.CONN_DB_USERNAME_SANDBOX,
    password: process.env.CONN_DB_PASS_SANDBOX,
    database: process.env.CONN_DB_SCHEMA_SANDBOX,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
    // waitForConnections: true, // Aguardar se todas as conexões estiverem ocupadas.
    // queueLimit: 0, // Sem limite na fila (0 é o valor padrão).
    // connectTimeout: 10000, // Tempo limite de conexão em milissegundos (opcional).
    // acquireTimeout: 10000, // Tempo limite para aquisição de conexão em milissegundos (opcional).
    // timeout: 60000, // Tempo limite global em milissegundos (opcional).
    // dateStrings: true, // Permite que os campos de data/hora sejam retornados como strings (opcional).
    // bigNumberStrings: false, // Evita a conversão de números grandes em strings (opcional).
};

const connMysqlPuro = mysql.createPool(DADOSBANCO);

export default async function connSANDBOX(query) {
    try {
        const conn = await connMysqlPuro.getConnection();
        const [rows, fields] = await conn.execute(query);
        conn.release();
        return rows;
    } catch (error) {
        throw error;
    }
}
