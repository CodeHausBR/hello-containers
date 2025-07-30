import moment from "moment";
import("moment-timezone");
moment.tz.setDefault("America/Sao_Paulo");
export default function dataHoraAtual() {
    return moment().format("DD/MM/YYYY HH:mm:ss");
}
