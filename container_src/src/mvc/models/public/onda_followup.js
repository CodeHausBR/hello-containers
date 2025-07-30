//utils
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
const onda_followup = class onda_followup {
    static async validate() {}
    static async getOneFollowup() {}
    static async getAllFollowup() {}
    static async postFollowup({token = Object(), cod = String(), event = String()}) {
        const id = (token?.onda_imob_id != 0 && token?.onda_imob_id) || (token?.onda_user_id != 0 && token?.onda_user_id);
        const query = `
        INSERT INTO onda_followup (
            onda_followup_matrix,
            onda_followup_event,
            onda_followup_date,
            onda_followup_type_user,
            onda_followup_user
        )
          VALUES (
            '${cod}',
            '${event}',
            '${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}',
            '${token?.type_user || "-"}',
            '${id || token?.id || 60}'
        );
    `;
        await executarQuery(query).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar follow-up!"});
        });
        return;
    }
};

export default onda_followup;
