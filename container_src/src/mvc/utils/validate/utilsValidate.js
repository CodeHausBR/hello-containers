import mongoose from "mongoose";
//HELPERS
import setResponse from "../../../helpers/response/setResponse.js";

const utilsValidate = class utilsValidate{
    static objectIdMongoose(id){
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id)
        if(isValidObjectId == false) return setResponse.WARNING({message: "Id inválido!"})
    }
}

export default utilsValidate