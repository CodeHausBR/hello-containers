import moment from "moment";
export default function formatarDataHora(data) {
    return moment.utc(data).format("DD/MM/YYYY [às] HH:mm");
}
