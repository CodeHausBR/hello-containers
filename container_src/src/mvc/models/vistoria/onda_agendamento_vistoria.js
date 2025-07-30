import mongoose from "mongoose";
import yup from "yup";
const Schema = mongoose.Schema;
// HELPERS
import setResponse from "../../../helpers/response/setResponse.js";
//DATABASE
import onda_errors from "../public/onda_errors.js";
import {type} from "os";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

class onda_agendamento_vistoria {
    validarAgendamentoVistoria(data) {
        try {
            const schema = yup.object().shape({
                contrato: yup.string().required("O contrato é obrigatório."),
                imovel_id: yup.number().required("O imóvel é obrigatório.").integer("O ID do imóvel deve ser um número inteiro."),
                tipo_vistoria: yup.string().required("O tipo de vistoria é obrigatório.").oneOf(["entrada", "saída"], "Tipo de vistoria inválido. Deve ser 'entrada' ou 'saída'."),
                vistoria_acompanhante: yup.string().required("Informe se a vistoria será acompanhada.").oneOf(["sim", "não"], "Valor inválido. Deve ser 'sim' ou 'não'."),
                metragem: yup.string().required("A metragem é obrigatória."),
                mobilia: yup.string().required("Informe se o imóvel é mobiliado.").oneOf(["sim", "não", "semi"], "Valor inválido. Deve ser 'sim', 'não' ou 'semi'."),
                local_chaves: yup
                    .string()
                    .required("O local para retirada das chaves é obrigatório")
                    .oneOf(["Imobiliária", "Direto no imóvel"], "Local de chaves inválido. Deve ser 'Imobiliária' ou 'Direto no imóvel'."),
                observacao: yup.string(),
            });

            return schema.validateSync(data, {abortEarly: false});
        } catch (error) {
            return setResponse.WARNING({
                message: `${error?.errors?.[0]}`,
                results: error?.errors,
            });
        }
    }

    async post({data}) {
        const validateData = this.validarAgendamentoVistoria(data);

        try {
            const query = `
                INSERT INTO onda_agendamento_vistoria (
                    onda_agendamento_vistoria_contrato,
                    onda_agendamento_vistoria_imovel_id,
                    onda_agendamento_vistoria_tipo_vistoria,
                    onda_agendamento_vistoria_vistoria_acompanhante,
                    onda_agendamento_vistoria_metragem,
                    onda_agendamento_vistoria_mobilia,
                    onda_agendamento_vistoria_local_chaves,
                    onda_agendamento_vistoria_observacao
                ) VALUES (
                    '${validateData?.contrato?.replace(/'/g, "''")}',
                    ${validateData?.imovel_id},
                    '${validateData?.tipo_vistoria}',
                    '${validateData?.vistoria_acompanhante}',
                    '${validateData?.metragem?.replace(/'/g, "''")}',
                    '${validateData?.mobilia}',
                    '${validateData?.local_chaves}',
                    ${validateData?.observacao ? `'${validateData.observacao.replace(/'/g, "''")}'` : "NULL"}
                )
            `;

            const result = await executarQuery(query);

            return result.insertId || {success: true};
        } catch (err) {
            await onda_errors.postNotRes({
                classe: "onda_agendamento_vistoria",
                statico: "post",
                message: JSON.stringify(err)?.slice(0, 4900),
            });
            return setResponse.DATABASE_ERROR({
                message: "Erro ao cadastrar agendamento de vistoria.",
            });
        }
    }
    async getOne({documento}) {
        try {
            const result = await this.model.findOne({documento: documento});
            return result;
        } catch (err) {
            await onda_errors.postNotRes({classe: "onda_agendamento_vistoria", statico: "getOne", message: JSON.stringify(err)?.slice(0, 4900)});

            return setResponse.DATABASE_ERROR({message: "Erro ao buscar o registro."});
        }
    }

    async getAll() {
        try {
            const query = `SELECT * FROM onda_agendamento_vistoria `;
            await executarQuery(query);
            return results;
        } catch (err) {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar os registros."});
        }
    }
}

export default new onda_agendamento_vistoria();
