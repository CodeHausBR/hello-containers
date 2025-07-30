//BIBLIOTECAS
import yup from "yup";
//HELPERS
import cpfCnpj from "../../utils/formatar/cpf-cnpj.js";
import yupSchemaValidate from "../../../helpers/geral/yup-schema-validate.js";
import gerarCondigoSetores from "../../../helpers/geral/gerar-condigo-setores.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";

//SERVICES

const onda_fornecedor = class onda_fornecedor {
    static async validatePost(fornecedor = Object(), token = Object()) {
        if (Object.entries(token).length === 0) {
            return setResponse.WARNING({message: "Token não enviado!"});
        }

        const schema = yup.object().shape({
            cnpjcpf: yup.string().max(18, "Cnpj Cpf max 20 caracteres").required("cnpj cpf é obrigatório"),
            razao: yup.string().max(250, "Razao não pode ter mais de 250 caracteres").required("razao é obrigatório"),
            ramoAtuacao: yup.string().max(250, "Ramo de atuação não pode ter mais de 250 caracteres").required("Ramo de atuação é obrigatório"),
            fantasia: yup.string().max(250, "Fantasia não pode ter mais de 250 caracteres").required("fantasia é obrigatório"),
            contato: yup.string().max(250, "Contato não pode ter mais de 250 caracteres").required("contato é obrigatório"),
            email: yup.string().email("Email está inválido").max(250, "Email max 250 caracteres").required("email é obrigatório"),
            celular: yup.string(),
            telefone: yup.string(),
            observacao: yup.string(),
            cep: yup.string().max(9, "Cep deve ter 9 caracteres"),
            endereco: yup.string().max(250, "Endereco não pode ter mais de 250 caracteres"),
            numero: yup.string(),
            complemento: yup.string().max(250, "Complemento max 250 caracteres"),
            bairro: yup.string().max(250, "Bairro não pode ter mais de 250 caracteres"),
            cidade: yup.string().max(250, "Cidade não pode ter mais de 250 caracteres"),
            uf: yup.string().max(2, "Uf deve ter 2 caracteres"),
        });

        return await yupSchemaValidate(schema, fornecedor, {abortEarly: false});
    }

    static async validatePut(fornecedor = Object(), cod = String()) {
        this.validateCod(cod);

        const schema = yup.object().shape({
            cnpjcpf: yup.string().max(18, "Cnpj Cpf max 20 caracteres").notOneOf([""], "Cnpj Cpf é obrigatório vazio"),
            razao: yup.string().max(250, "Razao não pode ter mais de 250 caracteres").notOneOf([""], "Razao é obrigatório"),
            ramoAtuacao: yup.string().max(250, "Ramo atuação não pode ter mais de 250 caracteres").notOneOf([""], "Ramo atuação é obrigatório"),
            fantasia: yup.string().max(250, "Fantasia não pode ter mais de 250 caracteres").notOneOf([""], "Fantasia é obrigatório"),
            contato: yup.string().max(250, "Contato não pode ter mais de 250 caracteres").notOneOf([""], "Contato é obrigatório"),
            email: yup.string().email("Email está inválido").max(250, "Email max 250 caracteres").notOneOf([""], "Email é obrigatório"),
            celular: yup.string(),
            telefone: yup.string(),
            observacao: yup.string(),
            cep: yup.string().max(9, "Cep deve ter 9 caracteres"),
            endereco: yup.string().max(250, "Endereco não pode ter mais de 250 caracteres"),
            bairro: yup.string().max(250, "Bairro não pode ter mais de 250 caracteres"),
            cidade: yup.string().max(250, "Cidade não pode ter mais de 250 caracteres"),
            numero: yup.string(),
            complemento: yup.string().max(250, "Complemento max 250 caracteres"),
            uf: yup.string().max(2, "Uf deve ter 2 caracteres"),
        });

        return await yupSchemaValidate(schema, fornecedor, {abortEarly: false});
    }

    static validateCod(cod = String()) {
        if (!cod) {
            return setResponse.WARNING({message: "O código do fornecedor é obrigatório!"});
        }

        if (!cod.includes("FORN")) {
            return setResponse.WARNING({message: "O código do fornecedor está inválido!"});
        }
    }

    static async postFornecedor(fornecedor = Object(), token = Object()) {
        const results = await this.validatePost(fornecedor, token);

        const dadosFornecedor = new Object({
            onda_fornecedor_codigo: gerarCondigoSetores("FORN"),
            onda_fornecedor_criacao: getDataHorarioAtual.YYYY_MM_DD_00_00_00(),
            onda_fornecedor_cnpjcpf: await this.virificarValidarSeCnpjCpfExiste(results?.cnpjcpf),
            onda_fornecedor_useronda: token?.onda_user_id,
            onda_fornecedor_razao: results?.razao,
            onda_fornecedor_ramoatuacao: results?.ramoAtuacao,
            onda_fornecedor_fantasia: results?.fantasia,
            onda_fornecedor_contato: results?.contato,
            onda_fornecedor_email: await this.virificarSeEmailExiste(results?.email),
            onda_fornecedor_telefone: results?.telefone?.replace(/\D/g, "")?.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3"),
            onda_fornecedor_celular: results?.celular?.replace(/\D/g, "")?.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4"),
            onda_fornecedor_observacao: results?.observacao,
            onda_fornecedor_endereco: results?.endereco,
            onda_fornecedor_cep: results?.cep?.replace(/\D/g, "")?.replace(/(\d{5})(\d{3})/, "$1-$2"),
            onda_fornecedor_numero: String(results?.numero),
            onda_fornecedor_complemento: results?.complemento,
            onda_fornecedor_bairro: results?.bairro,
            onda_fornecedor_cidade: results?.cidade,
            onda_fornecedor_uf: String(results?.uf)?.toUpperCase(),
        });

        const columns = [];
        const values = [];

        for (const key in dadosFornecedor) {
            if (dadosFornecedor.hasOwnProperty(key) && dadosFornecedor[key] !== undefined) {
                columns.push(key);
                values.push(typeof dadosFornecedor[key] === "string" ? `'${dadosFornecedor[key]}'` : dadosFornecedor[key]);
            }
        }

        const sql = `INSERT INTO onda_fornecedor (${columns.join(", ")}) VALUES (${values.join(", ")});`;

        const newFornecedor = await executarQuery(sql).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao cadastrar fornecedor!"});
        });

        const [getNewFornecedor] = await executarQuery(`SELECT * FROM VW_FORNECEDOR WHERE id = '${newFornecedor?.insertId}'`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar novo fornecedor!"});
        });

        return getNewFornecedor;
    }

    static async putFornecedor(fornecedor = Object(), oldFornecedor = Object(), cod = String()) {
        const results = await this.validatePut(fornecedor, cod);

        if (Object.keys(oldFornecedor).length == 0) {
            return setResponse.WARNING({message: "oldFornecedor não foi enviado!"});
        }

        const dadosFornecedor = new Object({
            onda_fornecedor_cnpjcpf: results?.cnpjcpf !== oldFornecedor?.onda_fornecedor_cnpjcpf ? await this.virificarValidarSeCnpjCpfExiste(results?.cnpjcpf) : results?.cnpjcpf,
            onda_fornecedor_razao: results?.razao,
            onda_fornecedor_ramoatuacao: results?.ramoAtuacao,
            onda_fornecedor_fantasia: results?.fantasia,
            onda_fornecedor_contato: results?.contato,
            onda_fornecedor_email: results?.email !== oldFornecedor?.onda_fornecedor_email ? await this.virificarSeEmailExiste(results?.email) : results?.email,
            onda_fornecedor_telefone: results?.telefone?.replace(/\D/g, "")?.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3"),
            onda_fornecedor_celular: results?.celular?.replace(/\D/g, "")?.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4"),
            onda_fornecedor_observacao: results?.observacao,
            onda_fornecedor_endereco: results?.endereco,
            onda_fornecedor_cep: results?.cep?.replace(/\D/g, "")?.replace(/(\d{5})(\d{3})/, "$1-$2"),
            onda_fornecedor_numero: String(results?.numero),
            onda_fornecedor_complemento: results?.complemento,
            onda_fornecedor_bairro: results?.bairro,
            onda_fornecedor_cidade: results?.cidade,
            onda_fornecedor_uf: String(results?.uf)?.toUpperCase(),
        });

        const updates = [];

        for (const key in dadosFornecedor) {
            if (dadosFornecedor.hasOwnProperty(key) && dadosFornecedor[key] !== undefined) {
                const value = typeof dadosFornecedor[key] === "string" ? `'${dadosFornecedor[key]}'` : dadosFornecedor[key];
                updates.push(`${key} = ${value}`);
            }
        }

        const sql = `
            UPDATE onda_fornecedor
                SET ${updates.join(", ")}
            WHERE onda_fornecedor_codigo = '${cod}'
            LIMIT 1
        `;

        const updateFornecedor = await executarQuery(sql).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao atualizar fornecedor!"});
        });

        if (updateFornecedor?.affectedRows === 0) {
            return setResponse.WARNING({message: "Não foi possivel atualizar fornecedor!"});
        }

        if (updateFornecedor?.changedRows === 0) {
            return setResponse.WARNING({message: "Sem atualizações para salvar!", results: oldFornecedor});
        }

        return this.getFornecedor(cod);
    }

    static async getFornecedores() {
        const fornecedores = await executarQuery(`SELECT * FROM VW_FORNECEDOR`).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar fornecedores!"});
        });

        return fornecedores;
    }

    static async getFornecedor(cod = String()) {
        this.validateCod(cod);

        const [fornecedor] = await executarQuery(`
            SELECT * 
                FROM VW_FORNECEDOR 
            WHERE fornecedorCodigo = '${cod}';
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar fornecedor!"});
        });
        if (!fornecedor) {
            return setResponse.WARNING({message: "O fornecedor não foi encontrado!"});
        }
        return fornecedor;
    }

    static async verificarSeForcedorExiste(cod = String()) {
        this.validateCod(cod);
        //Neste SELECT precisa ter os mesmos dados do objeto dadosFornecedor no metodo putFornecedor
        const [fornecedor] = await executarQuery(`
            SELECT 
                onda_fornecedor_codigo,
                onda_fornecedor_cnpjcpf,
                onda_fornecedor_razao,
                onda_fornecedor_fantasia,
                onda_fornecedor_contato,
                onda_fornecedor_email,
                onda_fornecedor_celular,
                onda_fornecedor_telefone,
                onda_fornecedor_observacao,
                onda_fornecedor_cep,
                onda_fornecedor_endereco,
                onda_fornecedor_numero,
                onda_fornecedor_complemento,
                onda_fornecedor_bairro,
                onda_fornecedor_cidade,
                onda_fornecedor_uf
            FROM onda_fornecedor
            WHERE onda_fornecedor_codigo = '${cod}'
        `).catch(() => {
            return setResponse.DATABASE_ERROR({message: "Erro ao buscar fornecedor!"});
        });

        if (!fornecedor) {
            return setResponse.WARNING({message: "Fornecedor não encontrado!"});
        } else {
            return fornecedor;
        }
    }

    static async virificarSeEmailExiste(email = String()) {
        const [fornecedor] = await executarQuery(`
            SELECT 
                onda_fornecedor_email 
            FROM onda_fornecedor 
            WHERE onda_fornecedor_email = '${email}';
        `);

        if (fornecedor?.onda_fornecedor_email) {
            return setResponse.WARNING({message: "O e-mail já está sendo utilizado!"});
        }

        return email;
    }

    static async virificarValidarSeCnpjCpfExiste(cnpjcpf = String()) {
        let formatar = new String(cnpjcpf.replace(/\D/g, ""));

        const [fornecedor] = await executarQuery(`
            SELECT 
                onda_fornecedor_cnpjcpf 
            FROM onda_fornecedor
            WHERE onda_fornecedor_cnpjcpf = '${cnpjcpf}'
        `);

        if (fornecedor) {
            return setResponse.WARNING({message: `O Cpf ou Cnpj ${cnpjcpf} já está sendo utilizado!`});
        }

        if (cnpjcpf.length <= 14) {
            if (cnpjcpf.length !== 14) {
                return setResponse.WARNING({message: `O CPF: ${cnpjcpf} deve conter 14 digitos!`});
            }

            formatar = formatar.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            return formatar;
        }

        if (cnpjcpf.length > 14) {
            if (cnpjcpf.length !== 18) {
                return setResponse.WARNING({message: `O CNPJ: ${cnpjcpf} deve conter 18 digitos!`});
            }

            formatar = formatar.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
            return formatar;
        }
    }
};

export default onda_fornecedor;
