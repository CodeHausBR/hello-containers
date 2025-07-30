
const getDiasEntre = class getDiasEntre {

    static dias_entre(antiga = String, recente = String()) {
        const dataAntiga = new Date(antiga)
        const dataRecente = new Date(recente)

        const dif = Math.abs(dataRecente.getTime() - dataAntiga.getTime() )

        const difDias = Math.ceil(dif / (1000 * 60 * 60 * 24))
    
        return difDias
    }

    static acrescentar_dias(data = String, dias = Number()) {
        let dataValue = new Date(data)
         dataValue.setDate(dataValue.getDate() + dias)

        // Formatando a data para yyyy-mm-dd
        const year = dataValue.getUTCFullYear();
        const month = String(dataValue.getUTCMonth() + 1).padStart(2, '0'); // Mês começa em 0, então +1
        const day = String(dataValue.getUTCDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}

export default getDiasEntre