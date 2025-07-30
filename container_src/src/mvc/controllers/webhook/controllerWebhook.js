//BIBLIOTECAS
import {exec} from "child_process";
import util from "util";
const execAsync = util.promisify(exec);
//HELPERS
import webSocketClient from "../../../helpers/response/web-socket-client.js";
import setResponse from "../../../helpers/response/setResponse.js";

//BANCO DE DADOS
import onda_webhook_log from "../../models/webhook/onda_webhook_log.js";
import onda_webhook from "../../models/webhook/onda_webhook.js";
import onda_pagarme_cobranca from "../../models/pagarme/onda_pagarme_cobranca.js";
import onda_cartafianca from "../../models/analise/onda_cartafianca.js";
import onda_errors from "../../models/public/onda_errors.js";
import onda_ti_servidor from "../../models/ti/onda_ti_servidor.js";
import onda_pay from "../../models/analise/onda_pay.js";
//SERVICES
import servicesWebhookQuery from "../../services/webhook/query/servicesWebhookQuery.js";
//controllers
import controllerAnalise from "../../controllers/analise/controllerAnalise.js";
import onda_pagarme_cliente from "../../models/pagarme/onda_pagarme_cliente.js";
import onda_enderecos from "../../models/endereco/onda_enderecos.js";
import servicesWebhookRegras from "../../services/webhook/regras/servicesWebhookRegras.js";

const controllerWebhook = class controllerWebhook {
    static async cobrancaPagarme(req, res) {
        try {
            const dadosBody = req?.body;
            const {token} = req?.body;

            if (dadosBody?.data) await onda_pagarme_cobranca.create(dadosBody?.data);

            //RETIRAR A VERIFICAÇÃO DA ADESÃO PARA PODE CADASTRAR A ADESÃO NO BANCO DE DADOS
            if (dadosBody?.type == "charge.paid" || dadosBody?.type == "order.paid") {
                const cfProcessada = await onda_cartafianca.getOneNotResView(dadosBody?.data?.code);

                const {total} = await onda_pay.buscaValorPagoDaCartaFianca(cfProcessada?.id);

                const gerarContaAReceber = await servicesWebhookRegras.verificarSeACartaFiancaJaFoiPaga({cf: cfProcessada, total: total, token: token, dataBody: dadosBody});

                if (!gerarContaAReceber) {
                    const boletoAsaas = await servicesWebhookRegras.verificarSeTipoDePagamentoPrecisaGerarBoletoNoAsaas({
                        cartaFianca: cfProcessada,
                        dadosPagamento: dadosBody?.data?.customer,
                        dadosBodyPagarme: dadosBody?.data,
                    });

                    const ws = new webSocketClient();
                    await servicesWebhookQuery.cadasTrarPagamentoFinanceiro({dadosBodyPagarme: dadosBody?.data, token: dadosBody?.token}); // paid
                    // await servicesWebhookQuery.cadasTrarParcelasDoBoletoFinanceiro({dadosBodyPagarme: dadosBody?.data, token: dadosBody?.token});
                    await servicesWebhookQuery.cadasTrarParcelasDoBoletoAsaasNoFinanceiro({dadosBodyPagarme: dadosBody?.data, token: dadosBody?.token, boletoAsaas: boletoAsaas});
                    // Verificar se pode gerar anexo 1 ou não pelo campo onda_pay_metadata pegando todos os pagamentos cadastrados
                    await controllerAnalise.gerarAnexoAutomacaoPagarmeUtilizadaNoWebsocket(cfProcessada?.contrato);
                    if (cfProcessada) {
                        ws.enviarParaEspecificos({
                            ws: {
                                setor: "comercial",
                                follow: {on: true, message: `Pagamento do locatário: ${cfProcessada?.locatario} recebido com sucesso!`},
                                event: "update",
                                item: cfProcessada,
                            },
                        });
                    }
                }
            }

            return setResponse.SUCCESS({message: "Sucesso ao receber webhook!", results: [], res: res});
        } catch (error) {
            await onda_errors.postNotRes({classe: "controllerWebhook", statico: "cobrancaPagarme", message: JSON.stringify(error)?.slice(0, 4900)});
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarEventoWebhookOnda(req, res) {
        try {
            const {webhook, token} = req?.body;

            const results = await onda_webhook.cadastrar({dadosBody: {webhook}, token: token});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar webhook!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarEventoWebhookOnda(req, res) {
        try {
            const results = await onda_webhook.getAll();

            return setResponse.SUCCESS({message: "Sucesso ao buscar webhook!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarEventoWebhookOnda(req, res) {
        try {
            const dadosBody = req?.body;
            const {cod} = req?.params;

            const results = await onda_webhook.atualizar({dadosBody: dadosBody, codWebhook: cod});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar webhook!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async sincronizarEnderecosEntrePagarmeEWave(req, res) {
        try {
            const clientes = await onda_pagarme_cliente.buscarTodosEnderecos();
            // console.log(clientes, "clientes");
            const results = await onda_enderecos.postEndereco(clientes);

            return setResponse.SUCCESS({message: "", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarEventoWebhookPeloCodOnda(req, res) {
        try {
            const {cod} = req?.params;

            const results = await onda_webhook.getOneByCod({codWebhook: cod});

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar webhook!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarLogsWebhook(req, res) {
        try {
            const results = await onda_webhook_log.getAll();

            return setResponse.SUCCESS({message: "Sucesso ao buscar log webhook!", results: results, res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async enviarEventoTeste(req, res) {
        try {
            await onda_webhook.enviarEventos({data: {value: "teste"}}).catch((error) => {
                return setResponse.SERVER_ERROR(res, error);
            });

            return setResponse.SUCCESS({message: "Sucesso ao cadastrar log webhook!", res: res});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async rodarScritpsVindosFrontEndWaveEGitHub(req, res) {
        try {
            async function execCommand(command) {
                try {
                    const {stdout, stderr} = await execAsync(command, {
                        shell: true,
                        encoding: "utf8",
                    });

                    console.log(stdout, "stdout");
                    if (stderr) console.error(stderr, "stderr");

                    return true;
                } catch (error) {
                    console.error(error, "error");
                    return false;
                }
            }

            const deploy = async () => {
                const command = `
                    cd /
                    cd home/apps/sandbox/backend-wave
                    git checkout sandbox
                    git reset --hard
                    git pull origin sandbox
                    npm i

                    postman collection run 39985810-1687acf9-cfad-485d-a0a3-54b788610a7c -e 39985810-e40e5db0-e9b7-4038-b346-c6a9fd188d09

                `;

                try {
                    const success = await execCommand(command);
                    if (!success) {
                        await execCommand("git reset --hard HEAD@{1}");
                        await execCommand("git push origin sandbox --force");
                        return {success: false, message: "Testes falharam!"};
                    }
                    return {success: true, message: "Testes passaram com sucesso!"};
                } catch (error) {
                    return {success: false, message: error.message};
                }
            };

            const resultado = await deploy();

            if (resultado.success) {
                setResponse.SUCCESS({message: resultado.message, details: resultado.message, res: res});
            } else {
                setResponse.WARNING({message: resultado.message, details: resultado.message, res: res});
            }

            // Reiniciando o serviço no PM2
            await execCommand("pm2 restart sandbox-backend-wave");
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async rodarScriptParams(req, res) {
        try {
            const params = req?.query;

            const listaScritp = await onda_ti_servidor.getOne({docId: params?.docId, itemId: params?.itemId, side: params?.side});

            const command = listaScritp?.[`${params?.side}`]?.[0];

            await servicesWebhookRegras.verificarSeOScriptFoiEncontrado({command: command});

            function execCommand(command) {
                try {
                    const options = {
                        stdio: "inherit",
                        shell: true,
                        windowsHide: true,
                        encoding: "utf8",
                    };
                    execSync(command, options);
                    return true;
                } catch (error) {
                    return false;
                }
            }

            const deploy = async (script) => {
                // const comando = `
                //     cd /
                //     cd home/apps/sandbox/backend-wave
                //     git checkout sandbox
                //     git reset --hard
                //     git pull origin sandbox
                //     npm i

                //     postman collection run 39985810-1687acf9-cfad-485d-a0a3-54b788610a7c -e 39985810-e40e5db0-e9b7-4038-b346-c6a9fd188d09

                //     if [ $? -eq 0 ]; then
                //         echo "Testes passaram, deploy feito com sucesso!"
                //         pm2 restart sandbox-backend-wave
                //     else

                //     git reset --hard HEAD@{1}
                //     git push origin sandbox --force
                //     echo "Testes falharam, pull request ignorada!"
                //     pm2 restart sandbox-backend-wave

                //     fi
                // `;

                const deployCommands = script
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);

                try {
                    const testSuccess = execCommand(deployCommands?.[0]);

                    if (testSuccess) return {success: true, message: "Testes passaram com sucesso!"};

                    return {success: false, message: "Testes falharam!"};
                } catch (error) {
                    return {success: false, message: error.message};
                }
            };

            const resultado = await deploy(command?.script);

            if (resultado.success) {
                return setResponse.SUCCESS({message: "Sucesso ao executar scripts!", details: resultado.message, res: res});
            } else {
                return setResponse.WARNING({message: "Falha ao executar scripts", details: resultado.message, res: res});
            }
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async testeAsaas(req, res) {}

    static async receberEventosCobrancaAssas(req, res) {
        try {
            const dadosBody = req?.body;
            const token = req.headers.authorization?.split("Bearer")[1].trim();

            await onda_pay.atualizar_conta_via_web_hook_assas({cobranca: dadosBody, token: token});
            //FALTA FAZER A FUNÇÃO PARA A TUALIZAR A TABELA QUE CADASTRA OS BOLETOS

            return setResponse.SUCCESS({message: "Sucesso ao receber webhook!", results: [], res: res});
        } catch (error) {
            await onda_errors.postNotRes({classe: "controllerWebhook", statico: "receberEventosCobrancaAssas", message: JSON.stringify(error)?.slice(0, 4900)});
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerWebhook;
