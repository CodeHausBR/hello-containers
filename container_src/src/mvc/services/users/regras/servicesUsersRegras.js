//HELPERS
import setResponse from "../../../../helpers/response/setResponse.js";

//MODELS
import onda_imob from "../../../models/users/onda_imob.js";

const servicesUsersRegras = class servicesUsersRegras {
    static async cadastroImobiliaria(imobiliaria) {
        const verifyEmailExists = await onda_imob
            .metodo()
            .findOne({ where: { imobEmail: imobiliaria?.imobEmail } })
            .catch(() => {
                setResponse.DATABASE_ERROR({ message: "Erro ao verificar e-mail da imobiliária!" });
            });

        if (verifyEmailExists) {
            return setResponse.WARNING({ message: "Este e-mail já está sendo utilizado!" });
        }

        const verifyCpfCnpjExists = await onda_imob
            .metodo()
            .findOne({ where: { imobCpfCnpj: imobiliaria?.imobCpfCnpj } })
            .catch(() => {
                setResponse.DATABASE_ERROR({ message: "Erro ao verificar CPF/CNPJ da imobiliária!" });
            });

        if (verifyCpfCnpjExists) {
            return setResponse.WARNING({ message: "Este CPF/CNPJ já está sendo utilizado!" });
        }
    }

    static async verificarMudancas(oldView, newView) {
        const differences = [];

        newView.forEach((newObject) => {
            const oldObject = oldView.find((obj) => obj.permissaoId === newObject.permissaoId);

            if (oldObject) {
                const updatedFields = {};

                for (const key of ["permissaoPermitir", "permissaoMatrix"]) {
                    if (oldObject[key] !== newObject[key]) {
                        updatedFields[key] = {
                            oldValue: oldObject[key],
                            newValue: newObject[key],
                        };
                    }
                }

                if (Object.keys(updatedFields).length) {
                    differences.push({
                        permissaoId: newObject.permissaoId,
                        ...updatedFields,
                    });
                }
            }
        });
        return differences;
    }
};

export default servicesUsersRegras;
