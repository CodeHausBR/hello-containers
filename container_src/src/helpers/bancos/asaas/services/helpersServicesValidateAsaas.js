//BIBLIOTECAS
import yup from 'yup'
//HELPERS

//BANCO DE DADOS

//SERVICES

function schemaValidate(schema, data, options) {
    try {
        const response = schema.validateSync(data, {...options, stric: false, stripUnknown: true});
        return response;
    } catch (error) {
        const erros = error.inner.map((err) => ({
            campo: err.path,
            mensagem: err.message,
        }));
        return setResponse.SCHEMA_VALIDATION({message: `Erro ao validar schema`, results: erros});
    }
}

const helpersServicesValidateAsaas = class helpersServicesValidateAsaas {

    static async validateCreateCustomer(codLocatario){

        const schema = yup.object().shape({
            codLocatario: yup.string().matches(/^LOCA-/, 'O código do locatário deve ser ex:LOCA-00000000000-2023')
        })

        const result = schemaValidate(schema, codLocatario, {abortEarly: false});

        return result
        
    }
};

export default helpersServicesValidateAsaas;