import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DADOSBANCO = {
    host: process.env.CONN_DB_HOST_PROD,
    user: process.env.CONN_DB_USERNAME_PROD,
    password: process.env.CONN_DB_PASS_PROD,
    database: process.env.CONN_DB_SCHEMA_PROD,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
};

const connMysqlPuro = mysql.createPool(DADOSBANCO);

export default async function connPRODDESKTOP(query) {
    try {
        const conn = await connMysqlPuro.getConnection();
        const [rows, fields] = await conn.execute(query);
        conn.release();
        return rows;
    } catch (error) {
        throw error;
    }
}
