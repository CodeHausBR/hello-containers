//BIBLIOTECAS
import yup from "yup";
//HELPERS
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

//SERVICES

const onda_contabancaria = class onda_contabancaria {
    static async validate(contaBancaria = Object(), token = Object(), cod = String()) {
        this.validateCod(cod);

        if (Object.entries(token).length === 0) {
            return setResponse.WARNING({message: "Token não enviado!"});
        }

        const schema = yup.object().shape({
            contaBancariaMatrix: yup.string().max(100).required("O campo matrix é obrigatório.").default(cod),
            contaBancariaFavorecido: yup.string().max(200),
            contaBancariaBanco: yup.string().max(100),
            contaBancariaAgencia: yup.number(),
            contaBancariaDigito: yup.string().max(100),
            contaBancariaNumeroConta: yup.string().max(20),
            contaBancariaTipoConta: yup.string().max(20),
            contaBancariaPix: yup.string(),
        });

        return await yupSchemaValidate(schema, contaBancaria, {abortEarly: false});
    }

    static validateCod(cod = String()) {
        if (!cod) {
            return setResponse.WARNING({message: "O código da conta é obrigatório!"});
        }
    }

    static async postContaBancaria(contaBancaria = Object(), token = Object(), cod = String()) {
        const results = await this.validate(contaBancaria, token, cod);

        // retirado porque agora vai precisar cadastrar varias contas no mesmo fornecedor
        // await this.verificarSeJaFoiCadastrada(cod);

        const dadosContaBancaria = new Object({
            onda_contabancaria_matrix: cod,
            onda_contabancaria_banco: results?.contaBancariaBanco,
            onda_contabancaria_favorecido: results?.contaBancariaFavorecido,
            onda_contabancaria_agencia: results?.contaBancariaAgencia,
            onda_contabancaria_digito: results?.contaBancariaDigito,
            onda_contabancaria_numero_conta: results?.contaBancariaNumeroConta,
            onda_contabancaria_tipo_conta: results?.contaBancariaTipoConta,
            onda_contabancaria_pix: results?.contaBancariaPix,
            onda_contabancaria_user_criacao: token?.onda_user_id,
            onda_contabancaria_data_criacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
        });

        const columns = [];
        const values = [];

        for (const key in dadosContaBancaria) {
            if (dadosContaBancaria.hasOwnProperty(key) && dadosContaBancaria[key] !== undefined) {
                columns.push(key);
                values.push(typeof dadosContaBancaria[key] === "string" ? `'${dadosContaBancaria[key]}'` : dadosContaBancaria[key]);
            }
        }

        const sql = `INSERT INTO onda_contabancaria (${columns.join(", ")}) VALUES (${values.join(", ")});`;

        const newContaBancaria = await executarQuery(sql).catch((err) => {
            console.log(err, "err");
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar conta bancária!"});
        });

        const [getNewFornecedor] = await executarQuery(`SELECT * FROM VW_CONTABANCARIA WHERE id = '${newContaBancaria?.insertId}'`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar nova conta bancária!"});
        });

        return getNewFornecedor;
    }

    static async putContaBancaria(contaBancaria = Object(), id = String(), token = Object()) {
        const oldContaBancaria = await this.getContaBancariaById(id);

        const results = await this.validate(contaBancaria, token, oldContaBancaria?.contaBancariaMatrix);

        const dadosContaBancaria = new Object({
            onda_contabancaria_banco: results?.contaBancariaBanco,
            onda_contabancaria_favorecido: results?.contaBancariaFavorecido,
            onda_contabancaria_agencia: results?.contaBancariaAgencia,
            onda_contabancaria_digito: results?.contaBancariaDigito,
            onda_contabancaria_numero_conta: results?.contaBancariaNumeroConta,
            onda_contabancaria_tipo_conta: results?.contaBancariaTipoConta,
            onda_contabancaria_pix: results?.contaBancariaPix,
        });

        const updates = [];

        for (const key in dadosContaBancaria) {
            if (dadosContaBancaria.hasOwnProperty(key) && dadosContaBancaria[key] !== undefined) {
                const value = typeof dadosContaBancaria[key] === "string" ? `'${dadosContaBancaria[key]}'` : dadosContaBancaria[key];
                updates.push(`${key} = ${value}`);
            }
        }

        const sql = `
            UPDATE onda_contabancaria
                SET ${updates.join(", ")}
            WHERE onda_contabancaria_id = ${id}
            LIMIT 1
        `;

        const updateFornecedor = await executarQuery(sql).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar conta bancária!"});
        });

        if (updateFornecedor?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar conta bancária!"});
        }

        if (updateFornecedor?.changedRows === 0) {
            return setResponse.WARNING({message: "Sem atualizações para salvar!", results: oldContaBancaria});
        }

        return this.getContaBancaria(oldContaBancaria?.contaBancariaMatrix);
    }

    static async getContasBancarias() {
        const contaBancaria = await executarQuery(`
            SELECT * FROM VW_CONTABANCARIA
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar conta bancária!"});
        });

        return contaBancaria;
    }

    static async getContaBancaria(cod = String()) {
        this.validateCod(cod);

        const contaBancaria = await executarQuery(`
            SELECT * 
                FROM VW_CONTABANCARIA 
            WHERE contaBancariaMatrix = '${cod}';
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar conta bancária!"});
        });

        return contaBancaria;
    }

    static async getContaBancariaById(id = String()) {
        const [contaBancaria] = await executarQuery(`
            SELECT * 
                FROM VW_CONTABANCARIA 
            WHERE id = ${id};
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar conta bancária!"});
        });

        return contaBancaria;
    }

    static async verificarSeJaFoiCadastrada(cod = String()) {
        this.validateCod(cod);

        const contaBancaria = await this.getContaBancaria(cod);

        if (contaBancaria) {
            return setResponse.WARNING({message: "A conta bancária já foi cadastrada!", results: contaBancaria});
        }

        return contaBancaria;
    }

    static async verificarSeExiste(cod = String()) {
        this.validateCod(cod);

        const contaBancaria = await this.getContaBancaria(cod);

        if (!contaBancaria) {
            return setResponse.WARNING({message: "A conta bancária não existe!"});
        }

        return contaBancaria;
    }

    static async getContaBancariaPagamentoSinistro({codImobiliaria = String()}) {
        this.validateCod(codImobiliaria);

        const [contaBancaria] = await executarQuery(`
            SELECT * 
                FROM VW_CONTABANCARIA 
            WHERE contaBancariaMatrix = '${codImobiliaria}'
            AND contaBancariaTipoConta = 'Imobiliária Sinistro'
            AND contaBancariaActive = 1
            LIMIT 1;
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar conta bancária!"});
        });

        return contaBancaria;
    }
};

export default onda_contabancaria;
