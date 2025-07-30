import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(process.env.CONN_DB_SCHEMA, process.env.CONN_DB_USERNAME, process.env.CONN_DB_PASS, {
    host: process.env.CONN_DB_HOST,
    port: process.env.CONN_DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: {
        max: 100,
        min: 5,
        acquire: 30000,
        idle: 10000,
    },
});

try {
    await sequelize.authenticate();
    console.log("Conectamos ao banco com o sequelize com sucesso!!!");
} catch (error) {
    console.log(`Não foi fossivel conectar ao banco: ${error}`);
}

export default sequelize;

// import {Sequelize} from "sequelize";

// const sequelize = new Sequelize("u513552542_producaonovo", "u513552542_producaonovo", "Onda@123", {
//     host: "185.211.7.52",
//     port: 3306,
//     dialect: "mysql",
// });

// try {
//     sequelize.authenticate();
//     console.log("Conectamos ao banco com sucesso!");
// } catch (error) {
//     console.log(`Não foi fossivel conectar ao banco: ${error}`);
// }

// export default sequelize;
