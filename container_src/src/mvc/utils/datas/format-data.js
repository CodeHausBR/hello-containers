const formatarData = class formatarData {
    static DD_MM_YYY(text = String()) {
        const date = new Date(text);
        let dia = date.getUTCDate();
        let mes = date.getUTCMonth() + 1;
        let ano = date.getUTCFullYear();

        return `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}/${ano}`

    }
    /**
     * 
     * @param {String} data -- Data no formato braseileiro DD/MM/AAAA
     * @returns 
     */
    static YYYY_MM_DD(data = String()) {
        const [dia, mes, ano] = data.split("/")
        return `${ano}-${mes.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`

    }
};

export default formatarData;
