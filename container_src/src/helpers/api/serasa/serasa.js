//BIBLIOTECAS
//HELPERS
import onda_errors from "../../../mvc/models/public/onda_errors.js";
import utilsFormatar from "../../../mvc/utils/formatar/formatar.js";
//BANCO DE DADOS
import onda_serasa_consulta_pf from "../../../mvc/models/mongoose/onda_serasa_consulta_pf.js";
import onda_followup from "../../../mvc/models/public/onda_followup.js";
//SERVICES
const SERASA_AUTH_GET_TOKEN = process.env.SERASA_AUTH_GET_TOKEN;
const SERASA_URL_AUTH_GET_TOKEN = process.env.SERASA_URL_AUTH_GET_TOKEN;
const NODE_ENV = process.env.NODE_ENV;

const helpers_api_serasa = class helpers_api_serasa {
    static async controller({cartaFianca, token, bearerToken, valoresCartaFianca}) {
        const locatario = new Object({
            idCartafianca: cartaFianca?.id,
            cpf: utilsFormatar.removerCaracteresEspeciaisEEspacos(cartaFianca?.cpf),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.locatario,
            contrato: cartaFianca?.contrato,
            tipo: "Locatário",
            bearerToken: bearerToken,
            token: token,
        });

        const coparticipante1 = {
            idCartafianca: cartaFianca?.id,
            cpf: utilsFormatar.removerCaracteresEspeciaisEEspacos(cartaFianca?.cpfcoparticipante1),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.coparticipante1,
            contrato: cartaFianca?.contrato,
            tipo: "Coparticipante 1",
            bearerToken: bearerToken,
            token: token,
        };

        const coparticipante2 = {
            idCartafianca: cartaFianca?.id,
            cpf: utilsFormatar.removerCaracteresEspeciaisEEspacos(cartaFianca?.locatarioCopart2cpf),
            fonte: cartaFianca?.cfFonte,
            nome: cartaFianca?.locatarioCopart2,
            contrato: cartaFianca?.contrato,
            tipo: "Coparticipante 2",
            bearerToken: bearerToken,
            token: token,
        };
        //PASSA POR ESSA FUNÇÃO FAZ A ANÁLISE JURIDICA E REPROVA OU MANDA PARA A PROXIMA CONSULTA
        if (locatario?.cpf) {
            return await helpers_api_serasa.start({pesquisado: locatario, valoresCartaFianca: valoresCartaFianca});
        }
    }

    static async start({pesquisado}) {
        const consulta = async () => {
            if (String(NODE_ENV)?.toLowerCase() === "producao") {
                return await helpers_api_serasa.consultar_cpf_cnpj_relatorio_avancado_pf({pesquisado: pesquisado});
            } else {
                return consulta_serasa_mock_sandbox;
            }
        };
        const set_consulta = await consulta();
        return {consulta: set_consulta, target: pesquisado};
    }

    static async buscar_token() {
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", `Basic ${SERASA_AUTH_GET_TOKEN}`);

            const raw = "";

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };
            const response = await fetch(`${SERASA_URL_AUTH_GET_TOKEN}/security/iam/v1/client-identities/login`, requestOptions);

            const data = await response.json();

            return data?.accessToken;
        } catch (error) {
            await onda_errors.postNotRes({classe: "helpers_api_serasa", statico: "buscar_token", message: error});
        }
    }

    static async consultar_cpf_cnpj_relatorio_avancado_pf({pesquisado}) {
        try {
            const verificar_se_ja_foi_consultado_retornar_historico_do_banco = await onda_serasa_consulta_pf.getOne({documento: pesquisado?.cpf});

            if (verificar_se_ja_foi_consultado_retornar_historico_do_banco) {
                await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖Dados do Serasa buscados na base interna do WAVE`});
                return verificar_se_ja_foi_consultado_retornar_historico_do_banco;
            }

            const response = await this.api_relatorio_avancado_pf(pesquisado?.cpf);

            const data = await response.json();

            if (!response?.ok) {
                await onda_errors.postNotRes({
                    classe: "helpers_api_serasa",
                    funcao: "!response?.ok na linha 111",
                    statico: "consultar_cpf_cnpj_relatorio_avancado_pf",
                    message: response,
                });
                // ATT STATUS COMERCIAL
                return;
            }

            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Consulta financeira pefin feita na API Serasa`});
            await onda_serasa_consulta_pf.post({data: data?.reports?.[0], documento: pesquisado?.cpf});

            return data?.reports?.[0];
        } catch (error) {
            await onda_followup.postFollowup({cod: pesquisado?.contrato, event: `🤖 *Erro na consulta financeira pefin feita na API Serasa`});
            await onda_errors.postNotRes({classe: "helpers_api_serasa", statico: "consultar_cpf_cnpj_relatorio_avancado_pf", message: error});
        }
    }

    static async api_relatorio_avancado_pf(cpf = String()) {
        const BEARER_TOKEN = await helpers_api_serasa.buscar_token();
        const myHeaders = new Headers();
        myHeaders.append("X-Document-id", cpf);
        myHeaders.append("Authorization", `Bearer ${BEARER_TOKEN}`);
        myHeaders.append(
            "Cookie",
            "incap_ses_1695_1333081=FIZVQ5o9HguFIYcMqNmFF1lWLmgAAAAAXqYzHEcRDCsr0mCJSN4L3w==; nlbi_1333081=VOXcTkMzdRr9D0jOaVQYvAAAAADtJWWMZ+VYm+LxvW1P84zD; visid_incap_1333081=zwNyxDH4Q9SClYQhB3aqkmOhJ2gAAAAAQUIPAAAAAAAfNPPHIQMtPMj8Hbfp2Rd7"
        );

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        const response = await fetch(
            `${SERASA_URL_AUTH_GET_TOKEN}/credit-services/person-information-report/v1/creditreport?reportName=RELATORIO_AVANCADO_TOP_SCORE_PF_PME`,
            requestOptions
        );

        return response;
    }

    static async api_relatorio_avancado_pj(cnpj = String()) {
        const BEARER_TOKEN = await helpers_api_serasa.buscar_token();

        const myHeaders = new Headers();
        myHeaders.append("X-Document-id", cnpj);
        myHeaders.append("Authorization", `Bearer ${BEARER_TOKEN}`);
        myHeaders.append(
            "Cookie",
            "incap_ses_1695_1333081=FIZVQ5o9HguFIYcMqNmFF1lWLmgAAAAAXqYzHEcRDCsr0mCJSN4L3w==; nlbi_1333081=VOXcTkMzdRr9D0jOaVQYvAAAAADtJWWMZ+VYm+LxvW1P84zD; visid_incap_1333081=zwNyxDH4Q9SClYQhB3aqkmOhJ2gAAAAAQUIPAAAAAAAfNPPHIQMtPMj8Hbfp2Rd7"
        );

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
        };

        const response = await fetch(
            `${SERASA_URL_AUTH_GET_TOKEN}/credit-services/business-information-report/v1/reports?reportName=RELATORIO_AVANCADO_TOP_SCORE_PJ`,
            requestOptions
        );

        return response;
    }
};

export default helpers_api_serasa;

const consulta_serasa_mock_sandbox = {
    facts: {
        inquiry: {
            inquiryResponse: [
                {
                    occurrenceDate: "2025-02-13",
                    segmentDescription: "VAREJO DE AUTO",
                    daysQuantity: 1,
                    _id: {
                        $oid: "682e662785436028cb489a01",
                    },
                },
                {
                    occurrenceDate: "2025-02-13",
                    segmentDescription: "VAREJO DE AUTO",
                    daysQuantity: 1,
                    _id: {
                        $oid: "682e662785436028cb489a02",
                    },
                },
                {
                    occurrenceDate: "2024-08-02",
                    segmentDescription: "SEGURADORAS",
                    daysQuantity: 1,
                    _id: {
                        $oid: "682e662785436028cb489a03",
                    },
                },
                {
                    occurrenceDate: "2024-08-02",
                    segmentDescription: "SEGURADORAS",
                    daysQuantity: 1,
                    _id: {
                        $oid: "682e662785436028cb489a04",
                    },
                },
                {
                    occurrenceDate: "2024-08-02",
                    segmentDescription: "SEGURADORAS",
                    daysQuantity: 1,
                    _id: {
                        $oid: "682e662785436028cb489a05",
                    },
                },
            ],
            summary: {
                count: 5,
            },
            _id: {
                $oid: "682e662785436028cb489a00",
            },
        },
        inquirySummary: {
            inquiryQuantity: {
                actual: 0,
                checkActual: 0,
                creditInquiriesQuantity: [
                    {
                        inquiryDate: "2025-04",
                        occurrences: 0,
                        bankOccurrences: 0,
                        companyOccurrences: 0,
                        _id: {
                            $oid: "682e662785436028cb489a08",
                        },
                    },
                    {
                        inquiryDate: "2025-03",
                        occurrences: 0,
                        bankOccurrences: 0,
                        companyOccurrences: 0,
                        _id: {
                            $oid: "682e662785436028cb489a09",
                        },
                    },
                    {
                        inquiryDate: "2025-02",
                        occurrences: 2,
                        bankOccurrences: 0,
                        companyOccurrences: 2,
                        _id: {
                            $oid: "682e662785436028cb489a0a",
                        },
                    },
                    {
                        inquiryDate: "2025-01",
                        occurrences: 0,
                        bankOccurrences: 0,
                        companyOccurrences: 0,
                        _id: {
                            $oid: "682e662785436028cb489a0b",
                        },
                    },
                ],
                checkInquiriesQuantity: [
                    {
                        inquiryDate: "2025-04",
                        occurrences: 0,
                        _id: {
                            $oid: "682e662785436028cb489a0c",
                        },
                    },
                    {
                        inquiryDate: "2025-03",
                        occurrences: 0,
                        _id: {
                            $oid: "682e662785436028cb489a0d",
                        },
                    },
                    {
                        inquiryDate: "2025-02",
                        occurrences: 0,
                        _id: {
                            $oid: "682e662785436028cb489a0e",
                        },
                    },
                    {
                        inquiryDate: "2025-01",
                        occurrences: 0,
                        _id: {
                            $oid: "682e662785436028cb489a0f",
                        },
                    },
                ],
                _id: {
                    $oid: "682e662785436028cb489a07",
                },
            },
            summary: {
                count: 4,
                checkCount: 0,
                creditCount: 2,
            },
            _id: {
                $oid: "682e662785436028cb489a06",
            },
        },
        stolenDocuments: {
            stolenDocumentsResponse: [],
            summary: {
                count: 0,
                balance: 0,
                _id: {
                    $oid: "682e662785436028cb489a11",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a10",
            },
        },
        judgementFilings: {
            judgementFilingsResponse: [],
            summary: {
                count: 0,
                balance: 0,
                _id: {
                    $oid: "682e662785436028cb489a13",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a12",
            },
        },
        bankrupts: {
            bankruptsResponse: [],
            summary: {
                count: 0,
                balance: 0,
                _id: {
                    $oid: "682e662785436028cb489a15",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a14",
            },
        },
        _id: {
            $oid: "682e662785436028cb4899ff",
        },
    },
    negativeData: {
        pefin: {
            pefinResponse: [
                {
                    _id: {
                        $oid: "682e662785436028cb489a18",
                    },
                    occurrenceDate: "2024-01-22",
                    legalNatureId: "CT",
                    legalNature: "CRED CARTAO",
                    contractId: "A30DAC278CCD87AA",
                    creditorName: "NU FINANCEIRA S.A",
                    amount: 81.47,
                    principal: true,
                    legalSquare: "",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "C033918875",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a19",
                    },
                    occurrenceDate: "2024-01-09",
                    legalNatureId: "AL",
                    legalNature: "ALUGUEL",
                    contractId: "P885734BV1746202",
                    creditorName: "CREDPAGO SERVICOS DE COBRANCA",
                    amount: 1974.75,
                    principal: true,
                    legalSquare: "",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "C032629267",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a1a",
                    },
                    occurrenceDate: "2023-06-30",
                    legalNatureId: "AD",
                    legalNature: "ADIANT CONTA",
                    contractId: "14762080/CL",
                    creditorName: "CREDIFOZ",
                    amount: 5521.06,
                    principal: true,
                    legalSquare: "",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "C071145583",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a1b",
                    },
                    occurrenceDate: "2023-04-23",
                    legalNatureId: "OO",
                    legalNature: "OUTRAS OPER",
                    contractId: "02251756484",
                    creditorName: "MIDWAY",
                    amount: 66.07,
                    principal: true,
                    legalSquare: "",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "B699528888",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a1c",
                    },
                    occurrenceDate: "2023-04-07",
                    legalNatureId: "CT",
                    legalNature: "CRED CARTAO",
                    contractId: "14762080-86859",
                    creditorName: "CREDIFOZ",
                    amount: 398.94,
                    principal: true,
                    legalSquare: "",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "B683254710",
                },
            ],
            summary: {
                count: 7,
                balance: 8417.01,
                _id: {
                    $oid: "682e662785436028cb489a1d",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a17",
            },
        },
        refin: {
            refinResponse: [
                {
                    _id: {
                        $oid: "682e662785436028cb489a1f",
                    },
                    occurrenceDate: "2023-10-06",
                    legalNatureId: "FI",
                    legalNature: "FINANCIAMENT",
                    contractId: "EMP6135631.0",
                    creditorName: "SICOOB MAXICREDITO",
                    amount: 21268.42,
                    principal: true,
                    legalSquare: "",
                    bank: {
                        bankId: 4750,
                        bankName: "SICOOB MAXICREDITO",
                        bankAgencyId: 0,
                    },
                    cadus: "B884405976",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a20",
                    },
                    occurrenceDate: "2023-08-20",
                    legalNatureId: "TD",
                    legalNature: "TIT DESCONTA",
                    contractId: "TIT465.0",
                    creditorName: "SICOOB MAXICREDITO",
                    amount: 4165.07,
                    principal: true,
                    legalSquare: "",
                    bank: {
                        bankId: 4750,
                        bankName: "SICOOB MAXICREDITO",
                        bankAgencyId: 0,
                    },
                    cadus: "B838487398",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a21",
                    },
                    occurrenceDate: "2023-07-24",
                    legalNatureId: "TD",
                    legalNature: "TIT DESCONTA",
                    contractId: "TIT38.0",
                    creditorName: "SICOOB MAXICREDITO",
                    amount: 682.14,
                    principal: false,
                    legalSquare: "",
                    bank: {
                        bankId: 4750,
                        bankName: "SICOOB MAXICREDITO",
                        bankAgencyId: 0,
                    },
                    cadus: "B813598172",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a22",
                    },
                    occurrenceDate: "2023-07-12",
                    legalNatureId: "TD",
                    legalNature: "TIT DESCONTA",
                    contractId: "TIT462.0",
                    creditorName: "SICOOB MAXICREDITO",
                    amount: 4500,
                    principal: true,
                    legalSquare: "",
                    bank: {
                        bankId: 4750,
                        bankName: "SICOOB MAXICREDITO",
                        bankAgencyId: 0,
                    },
                    cadus: "B798878308",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a23",
                    },
                    occurrenceDate: "2023-07-10",
                    legalNatureId: "TD",
                    legalNature: "TIT DESCONTA",
                    contractId: "TIT39.0",
                    creditorName: "SICOOB MAXICREDITO",
                    amount: 4800,
                    principal: false,
                    legalSquare: "",
                    bank: {
                        bankId: 4750,
                        bankName: "SICOOB MAXICREDITO",
                        bankAgencyId: 0,
                    },
                    cadus: "B796322464",
                },
            ],
            summary: {
                count: 16,
                balance: 96744.27,
                _id: {
                    $oid: "682e662785436028cb489a24",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a1e",
            },
        },
        notary: {
            notaryResponse: [
                {
                    _id: {
                        $oid: "682e662785436028cb489a26",
                    },
                    occurrenceDate: "2024-12-02",
                    amount: 333.2,
                    officeNumber: "UN",
                    city: "BARRA VELHA",
                    federalUnit: "SC",
                    legalSquare: "BVH",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "A413686246",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a27",
                    },
                    occurrenceDate: "2023-10-10",
                    amount: 2296.66,
                    officeNumber: "01",
                    city: "NAVEGANTES",
                    federalUnit: "SC",
                    legalSquare: "NVG",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "A378660862",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a28",
                    },
                    occurrenceDate: "2023-08-22",
                    amount: 847.24,
                    officeNumber: "01",
                    city: "NAVEGANTES",
                    federalUnit: "SC",
                    legalSquare: "NVG",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "A373702484",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a29",
                    },
                    occurrenceDate: "2023-06-15",
                    amount: 658.8,
                    officeNumber: "UN",
                    city: "BARRA VELHA",
                    federalUnit: "SC",
                    legalSquare: "BVH",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "A373340048",
                },
                {
                    _id: {
                        $oid: "682e662785436028cb489a2a",
                    },
                    occurrenceDate: "2023-05-15",
                    amount: 658.8,
                    officeNumber: "UN",
                    city: "BARRA VELHA",
                    federalUnit: "SC",
                    legalSquare: "BVH",
                    dispute: {
                        disputeIndicativeFlag: false,
                    },
                    cadus: "A373016032",
                },
            ],
            summary: {
                count: 12,
                balance: 10089.62,
                _id: {
                    $oid: "682e662785436028cb489a2b",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a25",
            },
        },
        check: {
            checkResponse: [
                {
                    _id: {
                        $oid: "682e662785436028cb489a2d",
                    },
                    occurrenceDate: "2024-01-04",
                    legalSquare: "CCO",
                    bankId: 756,
                    bankName: "BANCO SICOOB",
                    bankAgencyId: 3069,
                    checkCount: 4,
                    city: "CHAPECO",
                    federalUnit: "SC",
                    checkNumber: "CCF-BB",
                    alinea: 0,
                    cadus: "A135224653",
                },
            ],
            summary: {
                count: 4,
                balance: 0,
                _id: {
                    $oid: "682e662785436028cb489a2e",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a2c",
            },
        },
        collectionRecords: {
            collectionRecordsResponse: [],
            summary: {
                count: 0,
                balance: 0,
                _id: {
                    $oid: "682e662785436028cb489a30",
                },
            },
            _id: {
                $oid: "682e662785436028cb489a2f",
            },
        },
        _id: {
            $oid: "682e662785436028cb489a16",
        },
    },
    negativeSummary: {},
    partner: {
        partnershipResponse: [
            {
                businessDocument: "46936757000192",
                companyName: "AMANDA CAROLINA CUSTODIO 06908503950",
                participationPercentage: 100,
                companyStatus: "INAPTA",
                companyStatusCode: "0",
                companyState: "SC",
                companyStatusDate: "2025-02-08",
                updateDate: "2025-02-19",
                participationInitialDate: "2022-06-28",
                hasNegative: true,
                _id: {
                    $oid: "682e662785436028cb4899fd",
                },
            },
        ],
        summary: {
            count: 1,
            balance: 0,
            _id: {
                $oid: "682e662785436028cb4899fe",
            },
        },
        _id: {
            $oid: "682e662785436028cb4899fc",
        },
    },
    registration: {
        documentNumber: "06908503950",
        consumerName: "AMANDA CAROLINA CUSTODIO",
        motherName: "SUZANA TAMANINI",
        consumerGender: "F",
        birthDate: "1995-12-03",
        statusRegistration: "REGULAR",
        statusDate: "2024-11-29",
        consumerGenderDescription: "Feminino",
        address: {
            addressLine: "ARNALDO TAVARES 1920 PROXIMO AO CRISTAIS CISNES",
            district: "ITAJUBA",
            zipCode: "88390000",
            country: "BRA",
            city: "BARRA VELHA",
            state: "SC",
        },
        addresses: [
            {
                addressLine: "ARNALDO TAVARES 1920 PROXIMO AO CRISTAIS CISNES",
                addressTypeCode: 1,
                addressTypeDescription: "Residencial",
                addressNumber: "1920",
                district: "ITAJUBA",
                zipCode: "88390000",
                country: "BRA",
                city: "BARRA VELHA",
                state: "SC",
                addressComplement: "PROXIMO AO CRISTAIS CISNES",
                updateDate: "2023-07-31",
                _id: {
                    $oid: "682e662785436028cb489a32",
                },
            },
            {
                addressLine: "R  OSCAR CORDEIRO 38 N NULL S",
                addressTypeCode: 1,
                addressTypeDescription: "Residencial",
                addressNumber: "38",
                district: "GRAVATA",
                zipCode: "88372628",
                country: "BRA",
                city: "NAVEGANTES",
                state: "SC",
                addressComplement: "N NULL S",
                updateDate: "2024-07-01",
                _id: {
                    $oid: "682e662785436028cb489a33",
                },
            },
            {
                addressLine: "R ARNALDO TAVARES 1920 CS 1",
                addressTypeCode: 1,
                addressTypeDescription: "Residencial",
                addressNumber: "1920",
                district: "ITAJUBA",
                zipCode: "88390000",
                country: "BRA",
                city: "BARRA VELHA",
                state: "SC",
                addressComplement: "CS 1",
                updateDate: "2023-07-31",
                _id: {
                    $oid: "682e662785436028cb489a34",
                },
            },
            {
                addressLine: "R ARNALDO TAVARES 1920",
                addressTypeCode: 1,
                addressTypeDescription: "Residencial",
                addressNumber: "1920",
                district: "ITAJUBA",
                zipCode: "88390000",
                country: "BRA",
                city: "BARRA VELHA",
                state: "SC",
                addressComplement: "",
                updateDate: "2024-01-29",
                _id: {
                    $oid: "682e662785436028cb489a35",
                },
            },
            {
                addressLine: "R  JOSE LUIZ MARCELINO 170 SL 15",
                addressTypeCode: 1,
                addressTypeDescription: "Residencial",
                addressNumber: "170",
                district: "MURTA",
                zipCode: "88311300",
                country: "BRA",
                city: "ITAJAI",
                state: "SC",
                addressComplement: "SL 15",
                updateDate: "2023-07-31",
                _id: {
                    $oid: "682e662785436028cb489a36",
                },
            },
            {
                addressLine: "R OSCAR CORDEIRO 38 COND COSTAO DA ILHA 805",
                addressTypeCode: 1,
                addressTypeDescription: "Residencial",
                addressNumber: "38",
                district: "GRAVATA NAVEGANTES",
                zipCode: "88390000",
                country: "BRA",
                city: "BARRA VELHA",
                state: "SC",
                addressComplement: "COND COSTAO DA ILHA 805",
                updateDate: "2025-03-21",
                _id: {
                    $oid: "682e662785436028cb489a37",
                },
            },
            {
                addressLine: "R  OSCAR CORDEIRO 38 COND COSTAO DA ILHA AP",
                addressTypeCode: 1,
                addressTypeDescription: "Residencial",
                addressNumber: "38",
                district: "GRAVATA",
                zipCode: "88372628",
                country: "BRA",
                city: "NAVEGANTES",
                state: "SC",
                addressComplement: "COND COSTAO DA ILHA AP",
                updateDate: "2024-06-24",
                _id: {
                    $oid: "682e662785436028cb489a38",
                },
            },
        ],
        phones: [
            {
                regionCode: 55,
                areaCode: 47,
                phoneNumber: 997440547,
                phoneType: "Commercial Phone",
                phoneTypeCode: 2,
                updateDate: "2023-03-15",
                _id: {
                    $oid: "682e662785436028cb489a39",
                },
            },
            {
                regionCode: 55,
                areaCode: 47,
                phoneNumber: 999502691,
                phoneType: "Commercial Phone",
                phoneTypeCode: 2,
                updateDate: "2024-06-04",
                _id: {
                    $oid: "682e662785436028cb489a3a",
                },
            },
            {
                regionCode: 55,
                areaCode: 47,
                phoneNumber: 997895567,
                phoneType: "Commercial Phone",
                phoneTypeCode: 2,
                updateDate: "2017-03-30",
                _id: {
                    $oid: "682e662785436028cb489a3b",
                },
            },
            {
                regionCode: 55,
                areaCode: 47,
                phoneNumber: 33508880,
                phoneType: "Resident Phone",
                phoneTypeCode: 1,
                updateDate: "2016-03-08",
                _id: {
                    $oid: "682e662785436028cb489a3c",
                },
            },
        ],
        _id: {
            $oid: "682e662785436028cb489a31",
        },
    },
    reportName: "RELATORIO_AVANCADO_TOP_SCORE_PF_PME" || "RELATORIO_AVANCADO_TOP_SCORE_PJ",
};
