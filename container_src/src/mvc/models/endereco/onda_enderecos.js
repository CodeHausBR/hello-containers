//UTILS
import setResponse from "../../../helpers/response/setResponse.js";
import getDataHorarioAtual from "../../utils/datas/get-data-horario-atual.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import formatarBoleto from "../../utils/formatar/formatar-boleto.js";
const onda_enderecos = class onda_enderecos {
    static async updateEndereco(enderecos = Array()) {
        let setUpdateSqlArrayDeEnderecos = "";

        if (enderecos?.length == 0) return setUpdateSqlArrayDeEnderecos;

        enderecos?.map((endereco) => {
            let setSqlUpdateDeAcordoComOCampoQueVemDoPagarme = "";
            Object.keys(endereco).forEach((nomeDaColunaNoBancoDeDados) => {
                if (nomeDaColunaNoBancoDeDados == "onda_pay_id") return;
                setSqlUpdateDeAcordoComOCampoQueVemDoPagarme += `OP.${nomeDaColunaNoBancoDeDados} = '${endereco[nomeDaColunaNoBancoDeDados]}', `;
            });

            setSqlUpdateDeAcordoComOCampoQueVemDoPagarme = setSqlUpdateDeAcordoComOCampoQueVemDoPagarme.slice(0, -2);

            setUpdateSqlArrayDeEnderecos += `
                UPDATE onda_enderecos OE
                SET ${setSqlUpdateDeAcordoComOCampoQueVemDoPagarme}
                WHERE OE.onda_enderecos_id = '${endereco?.onda_pay_id}';
            `;
            setUpdateSqlArrayDeEnderecos = setUpdateSqlArrayDeEnderecos + "\r\n";
        });
    }

    static async postEndereco(enderecos = Array()) {
        let setPostSqlArrayDeEnderecos = "";
        if (enderecos?.length == 0) return setPostSqlArrayDeEnderecos;
        // console.log(enderecos.length, "endereco");

        // const teste = [enderecos[0], enderecos[1]];

        setPostSqlArrayDeEnderecos += `
            INSERT INTO onda_enderecos (
            onda_enderecos_datacriacao,
            onda_enderecos_cpfcnpj,
            onda_enderecos_endereco,
            onda_enderecos_numero,
            onda_enderecos_cep,
            onda_enderecos_bairro,
            onda_enderecos_cidade,
            onda_enderecos_uf,
            onda_enderecos_pais
            )
            VALUES`;

        for (let endereco = 0; endereco < enderecos?.length; endereco++) {
            const [numero, rua, bairro] = String(enderecos?.[endereco].address).split(",");

            setPostSqlArrayDeEnderecos += `
            (
            "${getDataHorarioAtual.YYYY_MM_DD_00_00_00()}",
            "${enderecos?.[endereco]?._id}",
            "${formatarBoleto.removerAcentuacaoDeTexto(String(rua || "")).toLocaleLowerCase().replace(/"/g," ")}",
            "${String(numero || "").trim()}",
            "${enderecos?.[endereco]?.cep || ""}",
            "${String(bairro || "").trim().toLocaleLowerCase()}",
            "${String(enderecos?.[endereco]?.cidade || "").toLocaleLowerCase()}",
            "${String(enderecos?.[endereco]?.uf || "").toLocaleUpperCase()}",
            "${String(enderecos?.[endereco]?.pais || "").toLocaleUpperCase()}"
            ),`;
        }

        setPostSqlArrayDeEnderecos = setPostSqlArrayDeEnderecos.slice(0, -1) + ";";
        // console.log(setPostSqlArrayDeEnderecos, "setPostSqlArrayDeEnderecos");

        const results = executarQuery(setPostSqlArrayDeEnderecos).catch((err) => {
            return setResponse.DATABASE_ERROR(err)
        })

        return results;
    }
};

export default onda_enderecos;
