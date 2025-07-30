
import connMysqlPuro from "../../../../db/connMysqlPuro.js";
import dotenv from "dotenv";
dotenv.config();

const executarQueryComRollback = class executarQueryComRollback {

   static async executarQueryRollback({querys = Array()}) {
        const conn = await connMysqlPuro.getConnection().catch((error) => { throw error});
    
        try {
            await conn.beginTransaction();
            for(const query of querys){
                await conn.query(query)
            }
            await conn.commit();
        } catch (error) {
            await conn.rollback()
            throw error
        } finally {
             conn.release();
        }
        
    }
};

export default executarQueryComRollback;
