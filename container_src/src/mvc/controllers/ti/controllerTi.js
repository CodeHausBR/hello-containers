import setResponse from "../../../helpers/response/setResponse.js";
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import puppeteer from "puppeteer";
import connPRODDESKTOP from "../../../db/connPRODDESKTOP.js";
import connSANDBOX from "../../../db/connSANDBOX.js";
//services
import servicesTiQuery from "../../services/ti/query/servicesTiQuery.js";
import servicesTiValidate from "../../services/ti/validate/servicesTiValidate.js";
//model
import onda_ti_servidor from "../../models/ti/onda_ti_servidor.js";

const controllerTi = class controllerTi {
    static async getTableLog(req, res) {
        try {
            const { tabela } = req?.params;
            const paramsQuery = req?.query;

            const results = await servicesTiQuery.getLogsByQuery(tabela, paramsQuery);

            return setResponse.SUCCESS({ message: "Sucesso ao buscar logs de tabela", results: results, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async getAllTables(req, res) {
        try {
            const allTablesName = await servicesTiQuery.getAllNameTables();

            return setResponse.SUCCESS({ results: allTablesName, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarRelatoriodeTriggersProducaoXSandbox(req, res) {
        try {
            const query_trigger_producao = `SELECT * FROM INFORMATION_SCHEMA.TRIGGERS`;

            const query_trigger_sandbox = `SELECT * FROM INFORMATION_SCHEMA.TRIGGERS`;

            const [trigger_producao, trigger_sandbox] = await Promise.all([connPRODDESKTOP(query_trigger_producao), connSANDBOX(query_trigger_sandbox)]).catch(() => {
                return setResponse.DATABASE_ERROR({ message: "Erro ao buscar relatório de trigger no banco de dados!", res: res });
            });

            const results = {
                trigger_producao: trigger_producao,
                trigger_sandbox: trigger_sandbox,
            };

            return setResponse.SUCCESS({ results: results, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    //ESTEIRA DE SCRITP
    static async cadastrarServidor(req, res) {
        try {
            const data = req?.body;

            const validate = new servicesTiValidate();

            const dadosValidados = await validate.validateCreateServer({ data: data });

            const result = await onda_ti_servidor.create(dadosValidados);

            return setResponse.SUCCESS({ message: "Sucesso ao cadastrar script!", res: res, results: result });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarScripts(req, res) {
        try {
            const result = await onda_ti_servidor.getAll();
            return setResponse.SUCCESS({ message: "Sucesso ao buscar scripts!", res: res, results: result });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarScript(req, res) {
        try {
            const { idapp, idscript, side } = req?.params;

            const result = await onda_ti_servidor.getOne({ docId: idapp, itemId: idscript, side: side });
            return setResponse.SUCCESS({ message: "Sucesso ao buscar script", results: result, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarServidor(req, res) {
        try {
            const dataBody = req?.body;
            const { id } = req?.params;

            const validate = new servicesTiValidate();

            const dadosValidados = await validate.validatePathServer({ data: dataBody });

            const result = onda_ti_servidor.updateOne(id, dadosValidados);

            return setResponse.SUCCESS({ message: "Sucesso ao atualizar servidor", results: result, res: res });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async cadastrarScript(req, res) {
        try {
            const { id } = req?.params;
            const data = req?.body;

            const validate = new servicesTiValidate();

            const dadosValidados = await validate.validateCreateScript({ data: { ...data, id_application: id } });

            const result = await onda_ti_servidor.createScript(dadosValidados);

            return setResponse.SUCCESS({ message: "Sucesso ao criar script", res: res, results: result });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async atualizarScript(req, res) {
        try {
            const data = req?.body;
            const { server, script } = req?.params;

            const validate = new servicesTiValidate();

            const dadosValidados = await validate.validatePathScript({ data: { ...data, id_application: server, id_script: script } });

            const result = await onda_ti_servidor.updateScript(dadosValidados);

            return setResponse.SUCCESS({ message: "Sucesso ao atualizar script!", res: res, results: result });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async screeperApi(req, res) {
        try {
            const dadosbody = req?.body;

            if (!dadosbody?.atuacaoEmpresarial || !dadosbody?.cidade || !dadosbody?.uf) {
                return setResponse.WARNING({ message: "Atenção: Todos os campos obrigatórios devem ser preenchidos.", res: res, results: null });
            }

            const results = await executarQuery(`
            SELECT * 
            from onda_scraping as ocr
            WHERE ocr.atuacao_empresarial =  '${dadosbody?.atuacaoEmpresarial}'
            AND ocr.cidade = '${dadosbody?.cidade}'
            AND ocr.uf = '${dadosbody?.uf}'
            AND finalizado = '1'
        `);

            if (results?.length > 5) {
                return setResponse.SUCCESS({ message: "Sucesso ao buscar dados!", res: res, results: [] });
            }

            async function extractBusinessData(page) {
                return await page.evaluate(() => {
                    const results = [];
                    const seenNames = new Set();

                    const linkSelectors = ['a[aria-label][href*="place"]', "a.hfpxzc", "a[data-cid]", 'div[role="article"] a[aria-label]'];

                    let businessLinks = [];

                    for (const selector of linkSelectors) {
                        const links = Array.from(document.querySelectorAll(selector));
                        if (links.length > 0) {
                            businessLinks = links;
                            break;
                        }
                    }

                    businessLinks.forEach((link, index) => {
                        try {
                            const nome = link.getAttribute("aria-label") || "Nome não encontrado";

                            if (seenNames.has(nome)) {
                                return;
                            }
                            seenNames.add(nome);

                            const dados = {
                                id: results.length + 1,
                                nome: nome,
                                linkGoogleMaps: link.href,
                                avaliacao: null,
                                numeroAvaliacoes: null,
                                endereco: "Endereço não encontrado",
                                telefone: null,
                                horario: null,
                                website: null,
                                categoria: "Imobiliária",
                            };

                            const parentContainer = link.closest("div[jsaction]") || link.closest('div[role="article"]') || link.closest(".Nv2PK");

                            if (parentContainer) {
                                const ratingElement = parentContainer.querySelector('span[role="img"][aria-label*="estrela"]');
                                if (ratingElement) {
                                    const ratingText = ratingElement.getAttribute("aria-label");
                                    const ratingMatch = ratingText.match(/([\d,]+)\s*estrela/);
                                    dados.avaliacao = ratingMatch ? ratingMatch[1] : null;
                                }

                                const reviewElements = parentContainer.querySelectorAll("span");
                                for (const span of reviewElements) {
                                    const text = span.textContent;
                                    if (text.match(/^\(\d+\)$/)) {
                                        dados.numeroAvaliacoes = text.replace(/[()]/g, "");
                                        break;
                                    }
                                }

                                const allSpans = parentContainer.querySelectorAll("span");
                                for (const span of allSpans) {
                                    const text = span.textContent.trim();

                                    if (text.match(/\(\d{2}\)\s*\d{4,5}-?\d{4}/) || text.match(/\+55\s*\d{2}\s*\d{4,5}-?\d{4}/)) {
                                        dados.telefone = text;
                                    }

                                    const isAddress =
                                        (text.includes("Rua") ||
                                            text.includes("Av") ||
                                            text.includes("Avenida") ||
                                            text.includes("Centro") ||
                                            text.includes("Bairro") ||
                                            text.includes(",")) &&
                                        !text.includes("recomendo") &&
                                        !text.includes("atendimento") &&
                                        !text.includes("excelente") &&
                                        !text.includes("super") &&
                                        !text.includes("colaborador") &&
                                        !text.includes("funcionário") &&
                                        text.length < 200;

                                    if (isAddress) {
                                        dados.endereco = text;
                                    }

                                    if (text.includes("Aberto") || text.includes("Fecha") || text.includes("24 horas") || text.match(/\d{1,2}:\d{2}/)) {
                                        dados.horario = text;
                                    }
                                }
                            }

                            results.push(dados);
                        } catch (error) {}
                    });

                    return results;
                });
            }

            async function enrichData(page, businesses) {
                const enrichedData = [];
                const maxToEnrich = 20;
                const businessesToProcess = businesses.slice(0, Math.min(maxToEnrich, businesses.length));

                for (let i = 0; i < businessesToProcess.length; i++) {
                    const business = businessesToProcess[i];

                    try {
                        const linkSelector = `a[aria-label="${business.nome.replace(/"/g, '\\"')}"]`;
                        await page.click(linkSelector);
                        await page.waitForTimeout(3000);

                        const additionalInfo = await page.evaluate(() => {
                            const info = {};

                            const addressSelectors = [
                                'button[aria-label*="Endereço:"]',
                                'button[data-item-id="address"]',
                                ".CsEnBe .Io6YTe.fontBodyMedium.kR99db.fdkmkc",
                                ".RcCsl .Io6YTe",
                            ];

                            let addressFound = false;
                            for (const selector of addressSelectors) {
                                const addressElement = document.querySelector(selector);
                                if (addressElement && !addressFound) {
                                    const addressText = addressElement.textContent.trim();
                                    const isValidAddress =
                                        addressText &&
                                        addressText !== "Endereço não encontrado" &&
                                        (addressText.includes("Rua") || addressText.includes("Av") || addressText.includes("Avenida") || addressText.includes(",")) &&
                                        !addressText.includes("recomendo") &&
                                        !addressText.includes("atendimento") &&
                                        !addressText.includes("excelente") &&
                                        addressText.length < 200;

                                    if (isValidAddress) {
                                        info.endereco = addressText;
                                        addressFound = true;
                                    }
                                }
                            }

                            const phoneSelectors = ['button[aria-label*="Telefone:"]', 'button[data-item-id*="phone"]', 'a[href^="tel:"]'];

                            for (const selector of phoneSelectors) {
                                const phoneElement = document.querySelector(selector);
                                if (phoneElement) {
                                    const phoneText = phoneElement.textContent.trim();
                                    if (phoneText.match(/\d/) && !info.telefone) {
                                        info.telefone = phoneText;
                                        break;
                                    }
                                }
                            }

                            const websiteElement = document.querySelector('a[data-item-id="authority"]');
                            if (websiteElement) {
                                const websiteUrl = websiteElement.href;
                                if (websiteUrl && !websiteUrl.includes("google.com")) {
                                    info.website = websiteUrl;
                                }
                            } else {
                                const websiteButtonElement = document.querySelector('button[aria-label*="Website:"]');
                                if (websiteButtonElement) {
                                    const websiteText = websiteButtonElement.textContent.trim();
                                    if (websiteText && websiteText !== "Website" && !websiteText.includes("google.com")) {
                                        info.website = websiteText;
                                    }
                                }
                            }

                            const hoursSelectors = ['[aria-label*="Horário de funcionamento"]', ".ZDu9vd span", '[data-value*="OpenHours"]'];

                            for (const selector of hoursSelectors) {
                                const hoursElement = document.querySelector(selector);
                                if (hoursElement) {
                                    const hoursText = hoursElement.textContent.trim();
                                    if (hoursText && (hoursText.includes("Aberto") || hoursText.includes("Fecha") || hoursText.includes("24 horas")) && !info.horario) {
                                        info.horario = hoursText;
                                        break;
                                    }
                                }
                            }

                            const ratingElement = document.querySelector('.F7nice span[aria-hidden="true"]') || document.querySelector('[role="img"][aria-label*="estrelas"]');
                            if (ratingElement) {
                                const ratingText = ratingElement.textContent || ratingElement.getAttribute("aria-label");
                                const ratingMatch = ratingText.match(/([\d,]+)/);
                                if (ratingMatch) {
                                    info.avaliacao = ratingMatch[1];
                                }
                            }

                            const reviewElement = document.querySelector('.F7nice span[aria-label*="avaliações"]') || document.querySelector('span[aria-label*="comentários"]');
                            if (reviewElement) {
                                const reviewText = reviewElement.getAttribute("aria-label");
                                const reviewMatch = reviewText.match(/(\d+)\s*(avaliações|comentários)/);
                                if (reviewMatch) {
                                    info.numeroAvaliacoes = reviewMatch[1];
                                }
                            }

                            return info;
                        });

                        const enrichedBusiness = {
                            ...business,
                            ...additionalInfo,
                        };

                        enrichedData.push(enrichedBusiness);
                        await page.goBack();
                        await page.waitForTimeout(2000);
                    } catch (error) {
                        enrichedData.push(business);
                    }
                }

                if (businesses.length > maxToEnrich) {
                    enrichedData.push(...businesses.slice(maxToEnrich));
                }

                return enrichedData;
            }

            async function scrapeGoogleMapsV3() {
                const browser = await puppeteer.launch({
                    headless: "new",
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-features=VizDisplayCompositor",
                        "--disable-web-security",
                    ],
                });

                const page = await browser.newPage();

                await page.setViewport({ width: 1366, height: 768 });
                await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");

                await page.evaluateOnNewDocument(() => {
                    Object.defineProperty(navigator, "webdriver", {
                        get: () => undefined,
                    });
                });

                try {
                    //console.log("Acessando Google Maps...");
                    await page.goto(`https://www.google.com/maps/search/${dadosbody.atuacaoEmpresarial}+na+cidade+de+${dadosbody.cidade}+no+estado+de+${dadosbody.uf}`, {
                        waitUntil: "networkidle0",
                        timeout: 120000,
                    });

                    try {
                        await page.waitForSelector('button[aria-label*="Aceitar"], form[accept-charset] button', { timeout: 60000 });
                        await page.click('button[aria-label*="Aceitar"], form[accept-charset] button');
                        await page.waitForTimeout(3500);
                    } catch (e) {
                        //console.log("Nenhum popup de cookies encontrado");
                    }

                    await page.waitForSelector('a[aria-label][href*="place"]', { timeout: 60000 });
                    await page.waitForTimeout(5000);

                    await scrollUntilEnd(page);

                    const imobiliarias = await extractBusinessData(page);

                    const dadosEnriquecidos = await enrichData(page, imobiliarias);

                    return dadosEnriquecidos;
                } catch (error) {
                    throw error;
                } finally {
                    await browser.close();
                }
            }

            async function scrollUntilEnd(page) {
                let previousResultCount = 0;
                let currentResultCount = 0;
                let noNewResultsCount = 0;
                let scrollAttempts = 0;
                const maxScrollAttempts = 50;
                const maxNoNewResults = 5;

                while (scrollAttempts < maxScrollAttempts) {
                    scrollAttempts++;

                    currentResultCount = await page.evaluate(() => {
                        const linkSelectors = ['a[aria-label][href*="place"]', "a.hfpxzc", "a[data-cid]", 'div[role="article"] a[aria-label]'];

                        let count = 0;
                        for (const selector of linkSelectors) {
                            const links = document.querySelectorAll(selector);
                            if (links.length > 0) {
                                count = links.length;
                                break;
                            }
                        }
                        return count;
                    });

                    await page.evaluate(async () => {
                        const scrollContainers = [
                            document.querySelector('[role="feed"]'),
                            document.querySelector('div[style*="overflow"]'),
                            document.querySelector(".m6QErb"),
                            document.querySelector(".DxyBCb"),
                            document.querySelector(".sJKr7qpXOXd__result-container"),
                        ].filter(Boolean);

                        const scrollContainer = scrollContainers[0] || document.documentElement;

                        if (scrollContainer) {
                            scrollContainer.scrollTop = scrollContainer.scrollHeight;
                        }

                        window.scrollTo(0, document.body.scrollHeight);
                    });

                    await page.waitForTimeout(3000);

                    const isLoading = await page.evaluate(() => {
                        const loadingSelectors = ['[role="progressbar"]', ".loading", ".qjESne", 'span[aria-label*="Carregando"]'];

                        for (const selector of loadingSelectors) {
                            if (document.querySelector(selector)) {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (isLoading) {
                        await page.waitForTimeout(5000);
                    }

                    if (currentResultCount === previousResultCount) {
                        noNewResultsCount++;

                        const hasEndMessage = await page.evaluate(() => {
                            const endMessages = ["Você chegou ao fim da lista", "You've reached the end of the list", "Fim dos resultados", "End of results"];

                            const pageText = document.body.innerText.toLowerCase();
                            return endMessages.some((msg) => pageText.includes(msg.toLowerCase()));
                        });

                        if (hasEndMessage) {
                            break;
                        }

                        if (noNewResultsCount >= maxNoNewResults) {
                            await page.waitForTimeout(10000);

                            const finalCount = await page.evaluate(() => {
                                const links = document.querySelectorAll('a[aria-label][href*="place"]');
                                return links.length;
                            });

                            if (finalCount === currentResultCount) {
                                break;
                            } else {
                                currentResultCount = finalCount;
                                noNewResultsCount = 0;
                            }
                        }
                    } else {
                        noNewResultsCount = 0;
                        previousResultCount = currentResultCount;
                    }

                    await page.waitForTimeout(1000);
                }
            }

            setResponse.SUCCESS({ message: "Sucesso ao buscar dados!", res: res, results: [] });

            async function main() {
                try {
                    const dados = await scrapeGoogleMapsV3();
                    return dados;
                } catch (error) {
                    return setResponse.WARNING({ message: "Erro ao buscar dados!", res: res, results: [] });
                }
            }

            const exemploResultado = await main();

            // Loop para inserção dos dados
            for (const data of exemploResultado) {
                const sql = `
                INSERT INTO onda_scraping (
                  atuacao_empresarial,
                  cidade,
                  uf,
                  nome,
                  link_google_maps,
                  avaliacao,
                  numero_avaliacoes,
                  endereco,
                  telefone,
                  horario,
                  website,
                  categoria
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const valores = [
                    dadosbody.atuacaoEmpresarial,
                    dadosbody.cidade,
                    dadosbody.uf,
                    data.nome,
                    data.linkGoogleMaps,
                    data.avaliacao,
                    data.numeroAvaliacoes,
                    data.endereco,
                    data.telefone,
                    data.horario,
                    data.website,
                    data.categoria,
                ];

                await executarQuery(sql, valores);
            }

            await executarQuery(`
                UPDATE onda_scraping
                SET finalizado = 1
                WHERE atuacao_empresarial = '${dadosbody?.atuacaoEmpresarial}'
                AND cidade = '${dadosbody?.cidade}'
                AND uf = '${dadosbody?.uf}';
            `);

            return;
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async buscarConsultasFeitas(req, res) {
        try {
            const data = req?.query;

            if (!data?.atuacaoEmpresarial || !data?.cidade || !data?.uf) {
                return setResponse.WARNING({ message: "Atenção: Todos os campos obrigatórios devem ser preenchidos.", res: res, results: null });
            }

            const results = await executarQuery(`
            SELECT * 
            from onda_scraping as ocr
            WHERE ocr.atuacao_empresarial = '${data?.atuacaoEmpresarial}'
            AND ocr.cidade = '${data?.cidade}'
            AND ocr.uf = '${data?.uf}'
            AND ocr.finalizado = '1'
        `);

            return setResponse.SUCCESS({ message: "Sucesso ao buscar pesquisa!", res: res, results: results });
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerTi;
