//BIBLIOTECAS
//HELPERS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
import novoContratoAnexo1ParaAssinaturaModal from "../../../helpers/pdf/novo-contrato-anexo1-para-assinatura-modal.js";
import novoTermoComissaoParaAssinaturaModal from "../../../helpers/pdf/novo-termo-comissao-para-assinatura-modal.js";
//BANCO DE DADOS
import onda_imobiliaria_config from "../../models/imobiliaria/onda_imobiliaria_config.js";
import onda_imob from "../../models/users/onda_imob.js";
//SERVICES
import servicesImobiliaraValidate from "../../services/imobiliaria/servicesImobiliaraValidate.js";
import servicesImobiliariaRegras from "../../services/imobiliaria/servicesImobiliariaRegras.js";
import servicesImobiliariaQuery from "../../services/imobiliaria/servicesImobiliariaQuery.js";
import utilsPdf from "../../../helpers/pdf/utils-pdf.js";
import httpRequestProvider from "../../../helpers/response/http-request-provider.js";
import getToken from "../../../helpers/token/get-token.js";
import onda_followup from "../../models/public/onda_followup.js";

const controllerImobiliaria = class controllerImobiliaria {
    static async cadastrarTaxasImobiliaria(req, res) {
        try {
            const {imobiliaria_config, token} = req?.body;

            await onda_imobiliaria_config.findOneAndUpdate({data: imobiliaria_config, token: token});

            const results = await onda_imobiliaria_config.getOne({matrix: imobiliaria_config?.matrix});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar config imobiliária!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarTaxasImobiliaria(req, res) {
        try {
            const {cod} = req?.params;

            let codImob = await servicesImobiliariaQuery.buscarCodigoImobCasoColaborador({matrix: cod});

            const results = await onda_imobiliaria_config.getOne({matrix: codImob});

            return setResponse.SUCCESS({message: "Sucesso ao buscar config imobiliária!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async assinarContratoImobiliaria(req, res) {
        try {
            const {assinar, token} = req?.body;
            const {matrix, id} = req?.params;

            if (matrix.split("-")[0] !== "IMOB") {
                return setResponse.WARNING({message: "Por favor, entre em contato com a imobiliária para assinatura do contrato!", res: res});
            }

            const BearerToken = getToken(req, res);

            const newBody = new Object({
                matrix: matrix,
                id: id,
                assinar: assinar,
            });

            const dadosValidados = await servicesImobiliaraValidate.validatePath(newBody);

            const contratoParaAssinatura = await onda_imobiliaria_config.buscarAssinaturaContratoPeloId({id: dadosValidados?.id, matrix: dadosValidados?.matrix});

            const ContratoParaAssinatura = {
                url_pdf_contrato: contratoParaAssinatura?.url_pdf_contrato,
                assinado: contratoParaAssinatura?.assinado,
                data_assinatura: contratoParaAssinatura?.data_assinatura,
                data_envio_assinatura: contratoParaAssinatura?.data_envio_assinatura,
                _id: contratoParaAssinatura?._id,
            };

            if (ContratoParaAssinatura?.assinado) {
                return setResponse.WARNING({message: "Contrato já assinado!", res: res});
            }

            const result = await onda_imobiliaria_config.toSign({data: dadosValidados, token: token});

            const imobiliaria = await onda_imob.getOnoNotResView(dadosValidados?.matrix);

            const [formData] = await servicesImobiliariaRegras.gerarDocumentoComBaseNaKeyUrlPdfContrato({imobiliaria: imobiliaria, contratoParaAssinatura: ContratoParaAssinatura});

            await httpRequestProvider.salvarDocBucketDeImagem(BearerToken, formData, `${dadosValidados?.matrix}-${ContratoParaAssinatura?.url_pdf_contrato}`);

            return setResponse.SUCCESS({message: "Sucesso ao assinar o contrato!", results: result, res: res});
        } catch (error) {
            console.log(error, "error");

            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async migrarImob(req, res) {
        try {
            const reqBody = req?.body;
            const authtoken = await getToken(req, res);
            const {token} = req?.body;
            const dadosValidados = await servicesImobiliaraValidate.validarDadosMigracao(reqBody);

            await servicesImobiliariaRegras.validarPassword(dadosValidados?.password);

            const follows = await servicesImobiliariaQuery.migrarDadosImobiliaria({data: dadosValidados});

            const buildMessageFollowUp = (cod) => {
                const message = `Contrato ${cod} migrado da imob. ${dadosValidados?.from?.name} com ID  ${dadosValidados?.from?.id} para imob. ${dadosValidados?.to?.name} com ID  ${dadosValidados?.to?.id} , feito por ${token?.nome} com o ID ${token?.id} do departamento ${token?.departamento}`;
                return message;
            };

            await Promise.all(
                follows.map((item) => {
                    return onda_followup.postFollowup({
                        token: authtoken,
                        cod: item,
                        event: buildMessageFollowUp(item),
                    });
                })
            );

            const imobiliariaAtualizada = await servicesImobiliariaQuery.getAll();
            // FAZENDO AGORA AGORA

            return setResponse.SUCCESS({message: "Sucesso ao migrar dados", res: res, results: imobiliariaAtualizada});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async montarContratoParaVisualizarAntesDeAssinar(req, res) {
        try {
            const {id, matrixImob} = req?.params;

            let codImob = await servicesImobiliariaQuery.buscarCodigoImobCasoColaborador({matrix: matrixImob});

            const imobiliaria = await onda_imob.getOnoNotResView(codImob);

            const contratoParaAssinatura = await onda_imobiliaria_config.buscarAssinaturaContratoPeloId({id: id, matrix: codImob});

            const ContratoParaAssinatura = {
                url_pdf_contrato: contratoParaAssinatura?.url_pdf_contrato,
                assinado: contratoParaAssinatura?.assinado,
                data_assinatura: contratoParaAssinatura?.data_assinatura,
                data_envio_assinatura: contratoParaAssinatura?.data_envio_assinatura,
                _id: contratoParaAssinatura?._id,
            };

            if (ContratoParaAssinatura?.url_pdf_contrato == "novo-contrato-anexo1-para-assinatura-modal") {
                const html = await novoContratoAnexo1ParaAssinaturaModal.contratoServicosOndaSegura2025({
                    imobiliaria: imobiliaria,
                    contratoParaAssinatura: contratoParaAssinatura,
                });

                const [formData, pdfBuffer] = await novoContratoAnexo1ParaAssinaturaModal.gerarPdf(html);

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "inline");
                res.send(pdfBuffer);

                return;
            }

            if (ContratoParaAssinatura?.url_pdf_contrato == "novo-termo-comissao-para-assinatura-modal") {
                const html = await novoTermoComissaoParaAssinaturaModal.gerarTermoComissao({
                    imobiliaria: imobiliaria,
                    contratoParaAssinatura: contratoParaAssinatura,
                });

                const [formData, pdfBuffer] = await novoTermoComissaoParaAssinaturaModal.gerarPdf(html);

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "inline");
                res.send(pdfBuffer);

                return;
            }

            if (res.headersSent == false) {
                const html = utilsPdf.pdfNaoEncontrato();

                const [formData, pdfBuffer] = await novoContratoAnexo1ParaAssinaturaModal.gerarPdf(html);

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "inline");
                res.send(pdfBuffer);
            }
        } catch (error) {
            if (res.headersSent == false) {
                const html = utilsPdf.pdfNaoEncontrato();

                const [formData, pdfBuffer] = await novoContratoAnexo1ParaAssinaturaModal.gerarPdf(html);

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "inline");
                res.send(pdfBuffer);
            }
        }
    }

    static async alterarStatusImobiliaria(req, res) {
        try {
            const {token} = req?.body;
            const {matrix, status} = await servicesImobiliaraValidate.validateAtualizacaoStatusImob(req?.body);
            await servicesImobiliariaQuery.atualizarStatusImobiliaria({cod: matrix, status: status});
            const imobiliaria = await servicesImobiliariaQuery.buscarImobiliariaPelaMatrix({cod: matrix});
            const statusImob = {
                1300: "prospect",
                1301: "em negociação",
                1302: "convertido",
                1303: "em Blacklist",
                1304: "convertido App e Portal",
            };
            await onda_followup.postFollowup({
                cod: matrix,
                event: `*Status da imobiliária alterado para status "${statusImob[status]}", pelo usuário ${token?.nome} com ID ${token?.id} do departamento ${token?.departamento}`,
            });
            return setResponse.SUCCESS({message: "Sucesso ao atualizar status", res: res, results: imobiliaria});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerImobiliaria;
