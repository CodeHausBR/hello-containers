import connMysqlPuro from "../../../../db/connMysqlPuro.js";

export default async function executarQuery(query, params = []) {
    const conn = await connMysqlPuro.getConnection().catch((error) => {
        throw error;
    });
    try {
        const [rows] = await conn.execute(query, params);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        conn.release();
    }
}
