//helpers
import setResponse from "../response/setResponse.js";

const getToken = (req, res) => {
    //Select secund element of array
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return setResponse.INVALID_TOKEN({res: res, message: "Token não enviado!!!"});
    }

    const token = authHeader.split(" ")[1];

    return token;
};

export default getToken;
