import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

const onda_imovel = class onda_imovel {
    //pendente
    static async getAllNotRes(callback) {
        this.connection.query("SELECT * FROM onda_imovel", callback);
    }

    //pendente
    static async getOneNotRes(id, callback) {
        this.connection.query("SELECT * FROM onda_imovel WHERE onda_imovel_id = ?", [id], callback);
    }

    static async putNotRes(imovel = Object(), cod = String()) {
        const newImovel = {
            onda_imovel_cep: imovel.cep,
            onda_imovel_rua: imovel.rua,
            onda_imovel_numero: imovel.numero,
            onda_imovel_bairro: imovel.bairro,
            onda_imovel_cidade: imovel.cidade,
            onda_imovel_uf: imovel.uf,
            onda_imovel_complemento: imovel.complemento,
            onda_imovel_m2: imovel.m2,
            onda_imovel_nomeproprietario: imovel.nomeProprietario,
            onda_imovel_cpfproprietario: imovel.cpfProprietario,
            onda_imovel_rgproprietario: imovel.rgProprietario,
            onda_imovel_telefoneproprietario: imovel.telefoneProprietario,
            onda_imovel_imobiliaria: imovel.imobiliaria,
            //onda_imovel_datacadastro: new Date(),
            onda_imovel_usuariocadastro: imovel.usuarioCadastro,
            onda_imovel_mobiliado: imovel.mobiliado,
            onda_imovel_agua: imovel.agua,
            onda_imovel_energia: imovel.energia,
            //onda_imovel_dataalteracao: new Date(),
            onda_imovel_alteradopor: imovel.alteradoPor,
            onda_imovel_contrato: imovel.contrato,
            //onda_imovel_contratoassinatura: new Date(),
            onda_imovel_aluguelvencimento: imovel.aluguelVencimento,
            onda_imovel_locatario: imovel.locatario,
            onda_imovel_tipogarantia: imovel.tipoGarantia,
            onda_imovel_status: imovel.status,
            onda_imovel_tiporesidencial: imovel.tipoResidencial,
            onda_imovel_condominio: imovel.condominio,
        };

        let query = ``;
        for (const key in newImovel) {
            if (newImovel.hasOwnProperty(key) && newImovel[key] !== undefined) {
                query = query + `${key} = '${newImovel[key]}',`;
            }
        }

        if (!query) {
            return setResponse.WARNING({message: "Os dados do imóvel não foram enviados!"});
        }

        let sql = `
        UPDATE onda_imovel SET
        ${query.slice(0, -1)}
        WHERE onda_imovel_codigo = '${cod}'
        `;

        await executarQuery(sql).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar status do imovel!"});
        });
    }
};

export default onda_imovel;
