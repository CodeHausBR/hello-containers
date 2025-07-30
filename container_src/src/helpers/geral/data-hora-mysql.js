import moment from "moment";
import("moment-timezone");
moment.tz.setDefault("America/Sao_Paulo");
export default function dataHoraMysql() {
    return moment().format("YYYY-MM-DD HH:mm:ss");
}
