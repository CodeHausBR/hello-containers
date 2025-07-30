//BIBLIOTECAS

//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";
import executarQuery from "../../../utils/mysql/funcoesQuery/executarQuery.js";
import json from "../../../utils/formatar/json.js";
import onda_sinistro_cobranca from "../../../models/juridico/onda_sinistro_cobranca.js";
import onda_sinistro from "../../../models/juridico/onda_sinistro.js";
import onda_followup from "../../../models/public/onda_followup.js";
import servicesJuridicoValidate from "../../juridico/validate/servicesJuridicoValidate.js";
import onda_status from "../../../models/public/onda_status.js";
//BANCO DE DADOS

//SERVICES

const servicesCobrancaQuery = class servicesCobrancaQuery {
    static async seteDiasSinistroMudaStatusParaDisponivel({cobranca, contratoCod, sinistroCod, token}) {
        try {
            // busca sinistro
            const results = await onda_sinistro.buscarSinistroPeloContrato({
                codContrato: contratoCod,
            });

            const sinistro = results.filter((item) => item.sinistroCodigo === sinistroCod);

            // verifica se o sinistro foi aprovado
            if (sinistro[0].sinistroStatusSinistro == 603) {
                // aprovado muda status de cobrança para "disponível"

                const sinistroCobranca = await onda_sinistro_cobranca.putSinistroCobranca({
                    dadosBody: cobranca,
                });

                const {sinistroCobrancaCod} = sinistroCobranca;
                // SICRONISMO
                await onda_followup.postFollowup({
                    cod: sinistroCobrancaCod,
                    token: token,
                    event: "Cobrança atualizada com sucesso",
                });
                // atualiza status da cobranca na tabela de cobranca

                const sendData = {
                    status: sinistroCobranca.sinistroCobrancaStatusId,
                    cod: sinistroCod,
                };

                // atualiza status da cobranca na tabela do sinistro
                const arrayStatusCobranca = await onda_status.getArrayStatusCobranca();
                const dadosValidados = await servicesJuridicoValidate.atualizarStatusSinistro_validate(sendData, arrayStatusCobranca);
                const newSinistroStatus = await onda_sinistro.atualizarStatusCobranca(dadosValidados);

                return {sinistroCobranca, newSinistroStatus};
            } else {
                return setResponse.WARNING({message: "Sinistro ainda não foi aprovado, tente novamente mais tarde!"});
            }
        } catch (error) {
            return setResponse.WARNING({message: "Transição de status não permitida."});
        }
    }
    static async seteDiasSinistroMudaStatusParaCancelado({cobranca, contratoCod, sinistroCod, token}) {
        try {
            // busca sinistro
            const results = await onda_sinistro.buscarSinistroPeloContrato({
                codContrato: contratoCod,
            });

            const sinistro = results.filter((item) => item.sinistroCodigo === sinistroCod);

            // verifica se sinistro foi reprovado
            if (sinistro[0].sinistroStatusSinistro == 613) {
                // reprovado muda status de cobrança para "cancelada"
                const sinistroCobranca = await onda_sinistro_cobranca.putSinistroCobranca({
                    dadosBody: cobranca,
                });

                const {sinistroCobrancaCod} = sinistroCobranca;
                // SICRONISMO

                await onda_followup.postFollowup({
                    cod: sinistroCobrancaCod,
                    token,
                    event: "Cobrança atualizada com sucesso",
                });
                // atualiza status da cobranca na tabela de cobranca

                const sendData = {
                    status: sinistroCobranca.sinistroCobrancaStatusId,
                    cod: sinistroCod,
                };

                const arrayStatusCobranca = await onda_status.getArrayStatusCobranca();
                const dadosValidados = await servicesJuridicoValidate.atualizarStatusSinistro_validate(sendData, arrayStatusCobranca);
                const newSinistroStatus = await onda_sinistro.atualizarStatusCobranca(dadosValidados);
                // atualiza status da cobranca na tabela do sinistro

                return {sinistroCobranca, newSinistroStatus};
            } else {
                return setResponse.WARNING({message: "Sinistro ainda não foi reprovado, tente novamente mais tarde!"});
            }
        } catch (error) {
            return setResponse.WARNING({message: "Transição de status não permitida."});
        }
    }

    static async buscarArrayStatusCobranca_query() {
        const query = `
            SELECT *  FROM onda_status
            WHERE onda_status_setor = 'cobranca'
        `;

        const statusSetorAnalise = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar status!"});
        });
        if (statusSetorAnalise.length === 0) {
            return setResponse.WARNING({message: "Erro ao buscar status pelo setor!"});
        }

        const arrayStatus = await json.keyToArrayString(statusSetorAnalise, "onda_status_id");
        return arrayStatus;
    }
    // função disfuncional
    static async atualizarStatusCobranca_query(dadosValidados) {
        //tabela inesxistente
        const query = `                    
            UPDATE onda_cobranca AS CB
                SET CB.onda_cobranca_status = '${dadosValidados?.status}'
            WHERE CB.onda_cobranca_codigo = '${dadosValidados?.cod}'
        `;

        const results = await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status análise!"});
        });

        if (results?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar o status!"});
        }

        if (results?.changedRows === 0) {
            return setResponse.WARNING({message: "O Status já foi atualizado!"});
        }
        return;
    }

    static async buscarCobrancaPelaMatrix({cod}) {
        const query = `
            SELECT *  FROM onda_sinistro_cobranca
            WHERE onda_sinistro_cobranca_cod = ? ;
        `;
        const result = await executarQuery(query, [cod]).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar cobranca!"});
        });

        return result;
    }

    static async buscarListadeCobrancas(list) {
        const cobrancas = [];
        for (const i in list) {
            const cod = list[i];
            const cobranca = await this.buscarCobrancaPelaMatrix({cod: cod});
            cobrancas.push(cobranca[0]);
        }
        return cobrancas;
    }
};

export default servicesCobrancaQuery;
