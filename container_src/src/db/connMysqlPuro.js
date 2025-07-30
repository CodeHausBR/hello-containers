import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DADOSBANCO = {
    host: process.env.CONN_DB_HOST,
    user: process.env.CONN_DB_USERNAME,
    password: process.env.CONN_DB_PASS,
    database: process.env.CONN_DB_SCHEMA,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
};

const connMysqlPuro = mysql.createPool(DADOSBANCO);

export default connMysqlPuro;

// import mysql from "mysql2/promise";

// const DADOSBANCO = {
//     host: "185.211.7.52",
//     user: "u513552542_producaonovo",
//     password: "Onda@123",
//     database: "u513552542_producaonovo",
//     port: 3306,
//     waitForConnections: true,
//     connectionLimit: 50,
//     queueLimit: 0,
// };

// const connMysqlPuro = mysql.createPool(DADOSBANCO);

// export default connMysqlPuro;
