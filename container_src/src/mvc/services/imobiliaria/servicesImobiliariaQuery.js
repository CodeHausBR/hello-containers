//BIBLIOTECAS
//HELPERS

//BANCO DE DADOS
//UTILS
import {query} from "express";
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import executarQueryComRollback from "../../utils/mysql/funcoesQuery/executarQueryComRollback.js";
//SERVICES

const servicesImobiliariaQuery = class servicesImobiliariaQuery {
    static async migrarDadosImobiliaria({data}) {
        const buildArrayQuery = (key) => {
            const filtred = data.contracts.filter((item) => item[key] != null);
            const list = [];
            const query = filtred
                ?.map((contract) => {
                    list.push(contract[key]);
                    return `'${contract[key]}'`;
                })
                .join(",");

            return {list, query};
        };
        const listId = buildArrayQuery("id");
        const listFollow = buildArrayQuery("contrato");
        const listCPF = buildArrayQuery("cpf");
        const listImovel = buildArrayQuery("imovelCod");

        const querys = [
            `
            UPDATE onda_cartafianca
            SET onda_cartafianca_imobiliaria = ${data?.to?.id},
                onda_cartafianca_colaborador_id = 0
            WHERE onda_cartafianca_imobiliaria = ${data?.from?.id}
            AND onda_cartafianca_id IN (${listId.query});
        `,
            `
            UPDATE onda_followup
            SET onda_followup_matrix = '${data?.to?.matrix}'
            WHERE onda_followup_matrix = '${data?.from?.matrix}'
            AND onda_followup_matrix IN (${listFollow.query});
        `,
            `
            UPDATE onda_locatario
            SET onda_locatario_imob = ${data?.to?.id}
            WHERE onda_locatario_imob = ${data?.from?.id}
            AND onda_locatario_cnpjcpf IN (${listCPF.query});
        `,
        ];

        if (listImovel.query.length !== 0) {
            querys.push(`
            UPDATE onda_imovel
            SET onda_imovel_imobiliaria = ${data?.to?.id}
            WHERE onda_imovel_imobiliaria = ${data?.from?.id}
            AND onda_imovel_codigo IN (${listImovel.query});
        `);
        }

        // if (data?.config?.migrar_colaboradores) {
        //     querys.push(`
        //         UPDATE onda_colaborador
        //         SET onda_colaborador_imob_id = ${data?.to?.id}
        //         WHERE onda_colaborador_imob_id = ${data?.from?.id}
        //     `);
        // }

        await executarQueryComRollback.executarQueryRollback({querys: querys}).catch((err) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao migrar dados da imobiliária."});
        });

        return listFollow.list;
    }

    static async getAll() {
        const query = `
                SELECT 
                    IG.*,
                    COUNT(CF.onda_cartafianca_imobiliaria) AS num_analises

                FROM VW_IMOB AS IG 
                LEFT JOIN onda_cartafianca AS CF ON IG.id = CF.onda_cartafianca_imobiliaria
                WHERE imobCpfCnpj IS NOT NULL
                GROUP BY IG.imobNome
                ORDER BY num_analises DESC
            `;

        const result = executarQuery(query).catch((err) => {
            setResponse.DATABASE_ERROR("Erro ao buscar imobiliarias");
        });

        return result;
    }

    /**
     * Busca o código da imobiliária associado a um colaborador ou retorna o próprio código imobiliário.
     *
     * @param {Object} params - Parâmetros da função.
     * @param {string} params.matrix - Código identificador no formato "COLA-XXXXXXXXXX-XXXX" ou "IMOB-XXXXXXXXXX-XXXX".
     * @returns {Promise<string|Object>} Retorna o código da imobiliária ou um objeto de resposta em caso de erro/aviso.
     */
    static async buscarCodigoImobCasoColaborador({matrix = String()}) {
        if (matrix?.split("-")[0] == "COLA") {
            const query = `
                SELECT IM.onda_imob_codigo
                FROM onda_colaborador AS CO
                INNER JOIN onda_imob AS IM ON CO.onda_colaborador_imob_id = IM.onda_imob_id
                WHERE CO.onda_colaborador_matrix = "${matrix}";
            `;

            const [results] = await executarQuery(query).catch((errr) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar contrato!"});
            });

            if (!results) {
                return setResponse.WARNING({message: "Sem vínculo com alguma imobiliária!"});
            }

            return results.onda_imob_codigo;
        } else if (matrix.split("-")[0] == "IMOB") {
            return matrix;
        } else {
            return setResponse.WARNING({message: "Código inválido!"});
        }
    }

    static async atualizarStatusImobiliaria({status, cod}) {
        if (!status || !cod) {
            return setResponse.WARNING({message: "Dados para atualização não informado."});
        }

        const query = `UPDATE onda_imob SET onda_imob_status = ? WHERE onda_imob_codigo = ?;`;

        await executarQuery(query, [status, cod]).catch((errr) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar imobiliaria!"});
        });

        return;
    }

    static async buscarImobiliariaPelaMatrix({cod}) {
        const query = `
                SELECT 
                   *
                FROM VW_IMOB 
                WHERE imobCodigo = ?;
            `;

        const result = await executarQuery(query, [cod]).catch((errr) => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar imobiliaria!"});
        });

        return result[0];
    }
};

export default servicesImobiliariaQuery;
