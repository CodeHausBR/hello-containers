import setResponse from "../../../../helpers/response/setResponse.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";

//BANCO DE DADOS

const serviceLocatarioQuery = class ServiceLocatarioQuery {
    static async buscaContratosQuery(locatario) {
        if (!locatario) {
            return setResponse.DATABASE_ERROR({message: "Dados para busca não informado"});
        }
        const gerarFiltroLocatario = (data) => {
            return `WHERE VW.cpf = ${data}`;
        };

        const query = `
                    SELECT 
                        *
                    FROM VW_CARTAFIANCA_GERAL AS VW
                    ${gerarFiltroLocatario(locatario)}
                    
                `;

        const results = await executarQuery(query).catch((errr) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar contratos!"});
        });

        return results;
    }

    static async buscarDocumentosPorContrato(cod) {
        if (!cod) {
            return setResponse.DATABASE_ERROR({message: "Dados para busca não informado"});
        }
        const gerarFiltroDocumento = (data) => {
            return `WHERE VW.docsMatrix = "${data}"`;
        };

        const query = `SELECT * FROM VW_DOCS AS VW ${gerarFiltroDocumento(cod)}`;

        const results = await executarQuery(query).catch((errr) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar documentos!"});
        });

        return results;
    }

    static async buscarBoletosPorContrato(cod) {
        if (!cod) {
            return setResponse.DATABASE_ERROR({message: "Dados para busca não informado"});
        }
        // removido AND payTipoContaId IN(241, 243)
        const gerarFiltroBoletos = (data) => {
            return `WHERE VW.payContrato = "${data}"
            AND payTipoContaId IN(241)
            ORDER BY id ASC `;
        };

        const query = ` SELECT * FROM VW_PAY AS VW
           ${gerarFiltroBoletos(cod)}`;

        const results = await executarQuery(query).catch((errr) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar Boletos!"});
        });

        return results;
    }

    static async atualizarCostumerAsaas(cod, idCostumer) {
        const query = `
            UPDATE onda_locatario
            SET onda_locatario_customer_id_asaas = '${idCostumer}'
            WHERE onda_locatario_codigo = '${cod}'
        `;

        await executarQuery(query).catch(async (error) => {
            await onda_errors.postNotRes({classe: "serviceLocatarioQuery", statico: "atualizarCostumerAsaas", message: JSON.stringify(error)?.slice(0, 4900)});
        });
    }
};

export default serviceLocatarioQuery;
