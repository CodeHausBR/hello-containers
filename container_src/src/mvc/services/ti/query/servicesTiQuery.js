import "dotenv/config";
//helpers
import setResponse from "../../../../helpers/response/setResponse.js"
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js"

const schema = process.env.CONN_DB_SCHEMA
const servicesTiQuery = class servicesTiQuery {
    static async getLogsByQuery(tabela, opcional) {
        function verificarParametrosOpcionais(){
            if(opcional.length == 0 ) return

            let parametrosOpicionais = ""

            if(opcional?.data_inicial && opcional?.data_final) {
                parametrosOpicionais += ` AND onda_log_tabela_data_hora between '${opcional?.data_inicial}' AND '${opcional?.data_final}'`
            }
            if(opcional.tipo){
                parametrosOpicionais += ` AND onda_log_tabela_operacao = '${opcional.tipo}'`
            }

            return parametrosOpicionais
        }
  
        let sql = `
            SELECT * 
            FROM onda_log_tabela 
            WHERE onda_log_tabela_nome = '${tabela}'
            ${verificarParametrosOpcionais()}
            ORDER BY onda_log_tabela_id DESC
        `

        const results = await executarQuery(sql).catch((err) => {
            return setResponse.DATABASE_ERROR("Erro ao buscar logs na tabela onda_log_tabela")
        })

        const newResults = new Array()

        for(const log of results) {
            if(log?.onda_log_tabela_dados_antigos !== null ) {
                log.onda_log_tabela_dados_antigos = JSON.parse(log?.onda_log_tabela_dados_antigos)
            }
            if(log?.onda_log_tabela_dados_novos !== null ) {
                log.onda_log_tabela_dados_novos = JSON.parse(log?.onda_log_tabela_dados_novos)
            }

            newResults.push(log)
        }


        return newResults
    }

    static async getAllNameTables(){
        let sql = `
        SELECT DISTINCT
            TABLE_NAME AS 'nome'
        FROM 
            information_schema.COLUMNS
        WHERE 
            TABLE_SCHEMA = '${schema}'
            AND TABLE_NAME LIKE 'onda_%'
            AND TABLE_NAME <> 'onda_log_tabela' 
        ORDER BY 
            TABLE_NAME
    `
        const nomeDasTabelas = await executarQuery(sql).catch(() => {            
            return setResponse.DATABASE_ERROR("Erro ao busca tabelas no banco de dados!")
        }) 

        const results = new Array()

        nomeDasTabelas.map(item => results.push(item?.nome))

        return results
    
    }

}

export default servicesTiQuery