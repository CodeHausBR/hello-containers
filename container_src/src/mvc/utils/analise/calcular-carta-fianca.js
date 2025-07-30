//BIBLIOTECAS
//HELPERS

//BANCO DE DADOS

//SERVICES

const calcularCartaFianca = class calcularCartaFianca {
    static onda_config_valores_adicionais(values) {
        if (!Array.isArray(values)) return 0;
        if (values?.length === 0) return 0;

        let somar = 0;
        for (let i = 0; values?.length > i; i++) {
            this.label = String(values[i]?.label);
            this.valor = Number(values[i]?.valor);
            this.ativo = Boolean(values[i]?.ativo);

            somar = somar + this.valor;
        }

        return somar;
    }
};

export default calcularCartaFianca;
