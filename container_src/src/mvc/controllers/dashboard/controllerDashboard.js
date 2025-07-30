//BIBLIOTECAS

//HELPERS
import executarQuery from "../../utils/mysql/funcoesQuery/executarQuery.js";
import setResponse from "../../../helpers/response/setResponse.js";
//BANCO DE DADOS

//SERVICES
import servicesDashboardFiltro from "../../services/dashboard/filtro/servicesDashboardFiltro.js";
import servicesDashboardQuery from "../../services/dashboard/query/servicesDashboardQuery.js";

const controllerDashboard = class controllerDashboard {
    static async resumoWave(req, res) {
        try {
            const {inicial, final} = req?.params;

            function isValidDate(dateString) {
                const regex = /^\d{4}-\d{2}-\d{2}$/;
                if (!regex.test(dateString)) {
                    return false;
                }
                const timestamp = Date.parse(dateString);
                return !isNaN(timestamp);
            }

            if (isValidDate(inicial) !== true || isValidDate(final) !== true) {
                return setResponse.WARNING({message: `O formato deve ser: ano/mes/dia ex: 2022-01-01`});
            }

            const last10Imob = await executarQuery(`
                SELECT *
                FROM VW_IMOB
                ORDER BY imobDataCriacao DESC
                LIMIT 10
            `).catch((er) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar resumo no dashboard!"});
            });

            const [results] = await executarQuery(`CALL dashboard_resumo_wave('${inicial}', '${final}') `).catch((er) => {
                return setResponse.DATABASE_ERROR({message: "Erro ao buscar resumo no dashboard!"});
            });

            results[0].last10Imobiliarias = last10Imob || [];

            const dashboardAnalise = {
                resumo: results[0],
            };

            return setResponse.SUCCESS({results: dashboardAnalise});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }

    static async dashboardAnalise(req, res) {
        try {
            const {token, filtroFront} = req?.body;

            const filtro = servicesDashboardFiltro.dashboardAnaliseFiltro();

            const queryDashboard = await servicesDashboardQuery.dashboardAnaliseQuery(token, filtro, filtroFront);

            return setResponse.SUCCESS({message: "Sucesso ao buscar dashboard análise!", results: queryDashboard});
        } catch (error) {
            return setResponse.SERVER_ERROR(res, error);
        }
    }
};

export default controllerDashboard;
