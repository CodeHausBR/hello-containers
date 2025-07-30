//HELPERS
import setResponse from "../response/setResponse.js";

export default async function yupSchemaValidate(schema, dadosBody, filds) {
    return await schema
        .validate(dadosBody, { ...filds, stric: false, stripUnknown: true })
        .then((response) => {
            return response;
        })
        .catch((error) => {
            return setResponse.SCHEMA_VALIDATION(error.errors);
        });
}
