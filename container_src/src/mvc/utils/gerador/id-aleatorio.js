import { v4 as uuidv4 } from 'uuid'

const utilsGeradorIdAleatorio = class utilsGeradorIdAleatorio{
    static gerarIdComNumeroDeCaracteresEspecifico(quantidadeDeCaracteres = Number()){
            const uuid = uuidv4();
            return uuid.replace(/-/g, '').substring(0, quantidadeDeCaracteres);
    }
}
export default utilsGeradorIdAleatorio