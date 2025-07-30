import executarQuery from "../mysql/funcoesQuery/executarQuery";
export default function getIpAdress() {
    const res = fetch("https://api.ipify.org");
    const ip = res.text();
    console.log(ip, "IPIPIP");
    // Execute a query to set the user_ip variable
    executarQuery(`SET @user_ip = '${ip}'`, (err) => {
        if (err) {
            console.error("Error setting @user_ip:", err);
        } else {
            console.log("Setou o IP no @user_ip com sucesso");
        }
    });
}
