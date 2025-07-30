//BIBLIOTECAS
import {CronJob} from "cron";

//HELPERS
import executarQuery from "../../mvc/utils/mysql/funcoesQuery/executarQuery.js";
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";
//BANCO DE DADOS

//SERVICES
const helpersCronn = class helpersCronn {
    constructor() {
        this.agendamentos.configurarAgendamentos();
        this.agendamentos.configurarAgendamentosTestes();

        process.stdout.write(`[${getDataHorarioAtual.DD_MM_YYYY_00_00_00()}] INFO: Sistema de agendamento inicializado\n`);
    }

    agendamentos = class agendamentos {
        static configurarAgendamentos() {
            // Agendamento para o dia 01 de cada mês às 02:00 da manhã
            // Formato cron: segundo minuto hora dia mês dia_da_semana
            // '0 0 2 1 * *' - Formato para o node-cron
            // '0 2 1 * *' - Formato para a lib cron (sem segundos)
            const job = new CronJob(
                "0 2 1 * *", // cronTime - executa às 2h da manhã todo dia 1 do mês
                async function () {
                    // onTick - função a ser executada

                    process.stdout.write(`[${getDataHorarioAtual.DD_MM_YYYY_00_00_00()}] INFO: Iniciando agendamento: cadastrarContasAPagarExecutivos\n`);
                    await helpersCronn.tarefas.cadastrarContasAPagarExecutivos();
                },
                null, // onComplete - função executada quando o job termina (opcional)
                true, // start - inicia o job automaticamente
                "America/Sao_Paulo"
            );
            return job;
        }

        static configurarAgendamentosTestes() {
            // Agendamento para o dia 27 de cada mês às 11:51
            const jobDia271151 = new CronJob(
                "52 11 27 * *", // Executa às 11:51 no dia 27 de cada mês
                function () {
                    process.stdout.write(`[${getDataHorarioAtual.DD_MM_YYYY_00_00_00()}] INFO: Executando tarefa do dia 27 às 11:51\n`);

                    // Coloque aqui a função que deseja executar
                    helpersCronn.tarefas.cadastrarContasAPagarExecutivos();
                },
                null,
                true,
                "America/Sao_Paulo"
            );

            return jobDia271151;
        }
    };

    static tarefas = class tarefas {
        static async cadastrarContasAPagarExecutivos() {
            // '600', 'Executivo de contas I'
            // '601', 'Gerente de contas I'
            // '602', 'Gerente de contas CLT I'
            // '603', 'Executivo On Line I'
            // '604', 'Gerente de carteira onda I'
            // '605', 'Parceiro'

            const buscarListaDeExecutivos = `
                SELECT 
                	ORC.onda_regras_comissao_salario_ajuda_custo,
                    ORC.onda_regras_comissao_salario_fixo,
                    ORC.onda_regras_comissao_salario_vr,
                    OE.onda_executivo_id,
                	OE.onda_executivo_receber_comissao,
                    OE.onda_executivo_tipo_executivo,
                    ORC.onda_regras_comissao_cod,
                    (SELECT contrato 
                    FROM u513552542_sandbox.VW_CARTAFIANCA_GERAL 
                    WHERE onda_executivo_id = OE.onda_executivo_id 
                    LIMIT 1) AS contrato
                FROM u513552542_sandbox.onda_executivo AS OE
                JOIN onda_regras_comissao AS ORC ON OE.onda_executivo_tipo_executivo = ORC.onda_regras_comissao_cod
                WHERE OE.onda_executivo_id IS NOT NULL
                GROUP BY OE.onda_executivo_id
            `;

            const listaExecutivos = await executarQuery(buscarListaDeExecutivos).catch(() => {
                // registrar o erro no banco de dados em onda_errros
            });

            for (const executivo of listaExecutivos) {
            }

            try {
                process.stdout.write(`[${getDataHorarioAtual.DD_MM_YYYY_00_00_00()}] INFO: Contas a pagar dos executivos foram cadastradas com sucesso\n`);
            } catch (error) {
                process.stdout.write(`[${getDataHorarioAtual.DD_MM_YYYY_00_00_00()}] ERROR: Erro ao cadastrar contas a pagar dos executivos - ${error.message}\n`);
                process.stdout.write(`[${getDataHorarioAtual.DD_MM_YYYY_00_00_00()}] ERROR: ${error.stack}\n`);
            }
        }
    };
};

export default helpersCronn;
