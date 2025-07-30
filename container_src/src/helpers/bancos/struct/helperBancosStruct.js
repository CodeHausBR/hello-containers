//BIBLIOTECAS
//HELPERS

//BANCO DE DADOS

//SERVICES

const helperBancosStruct = class helperBancosStruct {
    static async clienteSicob(data) {
        return new clienteSicob(data);
    }
};

export default helperBancosStruct;

const clienteSicob = class clienteSicob {
    constructor(data) {
        this.nome = data?.nome;
        this.cpf = data?.cpf;
        this.endereco = data?.endereco;
    }
};


