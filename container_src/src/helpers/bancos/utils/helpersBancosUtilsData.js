const helpersBancosUtilsData = class helpersBancosUtilsData {
    static proximo_dia_yyyy_mm_dd = (data = String) => {
                
        let newData = new Date(String(data));
        newData.setDate(newData.getDate() + 1);

        const dia = String(newData.getDate()).padStart(2,'0')
        const mes = String(newData.getMonth() + 1).padStart(2, '0');
        const ano = newData.getFullYear();

        return `${ano}-${mes}-${dia}`;
    };

    static proximo_dia_dd_mm_yyyy = (data = String) => {
                
        let newData = new Date(String(data));
        newData.setDate(newData.getDate() + 1);

        const dia = String(newData.getDate()).padStart(2,'0')
        const mes = String(newData.getMonth() + 1).padStart(2, '0');
        const ano = newData.getFullYear();

        return `${dia}/${mes}/${ano}`;
    };

}

export default helpersBancosUtilsData