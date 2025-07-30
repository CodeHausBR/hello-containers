//BIBLIOTECAS
//HELPERS
import getDataHorarioAtual from "../../mvc/utils/datas/get-data-horario-atual.js";
import executarQuery from "../../mvc/utils/mysql/funcoesQuery/executarQuery.js";
//BANCO DE DADOS
import setResponse from "../response/setResponse.js";
//SERVICES

const utilsPdf = class utilsPdf {
    static async gerarLogVisualizacao({ matrixLogVisualizacao: matrixImob, evento }) {
        const query = `
            SELECT 
                *,
                COUNT(*) AS quantidadeVezesClicado,
                DATE_FORMAT(MAX(onda_log_visualizacao_data),'%d/%m/%Y %H:%i') AS ultimaDataVisualizadaFormat
            FROM onda_log_visualizacao 
            WHERE onda_log_visualizacao_matrix = '${matrixImob}'
            AND onda_log_visualizacao_evento = '${evento}'  
            AND onda_log_visualizacao_data = (
                SELECT MAX(onda_log_visualizacao_data)
                FROM onda_log_visualizacao
                WHERE onda_log_visualizacao_matrix = '${matrixImob}'
                AND onda_log_visualizacao_evento = '${evento}'
            )
            ORDER BY onda_log_visualizacao_id DESC;
    `;

        const [logClick] = await executarQuery(query).catch((e) => {
            return setResponse.WARNING({ message: "Erro ao bucar log lick!" });
        });

        const newLogClick = {
            id: logClick?.onda_log_visualizacao_id,
            matrix: logClick?.onda_log_visualizacao_matrix,
            nomeUsuario: logClick?.onda_log_visualizacao_user_nome,
            ip: logClick?.onda_log_visualizacao_ip,
            navegador: logClick?.onda_log_visualizacao_navegador,
            latitude: logClick?.onda_log_visualizacao_localizacao_latitude,
            longitude: logClick?.onda_log_visualizacao_localizacao_longitude,
        };

        //         const html = `
        //             <div style="padding: 20px; border: 1px solid #ddd; border-radius: 4px; font-family: Arial, sans-serif;">
        //    <h3 style="margin: 0 0 20px 0;">Detalhes do Log</h3>
        //    <div style="display: grid; gap: 12px;">
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">ID:</span>
        //            <span>${newLogClick.id || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Matriz:</span>
        //            <span>${newLogClick.matrix || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Última Visualização:</span>
        //            <span>${newLogClick.ultimaDataVisualizadaFormat || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Quantidade de Cliques:</span>
        //            <span>${newLogClick.quantidadeVezesClicado || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Tipo de Usuário:</span>
        //            <span>${newLogClick.tipoUsuario || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Nome do Usuário:</span>
        //            <span>${newLogClick.nomeUsuario || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">IP:</span>
        //            <span>${newLogClick.ip || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Navegador:</span>
        //            <span>${newLogClick.navegador || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Latitude:</span>
        //            <span>${newLogClick.latitude || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
        //            <span style="font-weight: 600; min-width: 200px;">Longitude:</span>
        //            <span>${newLogClick.longitude || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px;">
        //            <span style="font-weight: 600; min-width: 200px;">Evento:</span>
        //            <span>${newLogClick.evento || "Evento de captura não aceito pelo usuário!"}</span>
        //        </div>
        //        <div style="display: flex; gap: 12px; align-items: center; padding: 8px;">
        //            <span style="font-weight: 600; min-width: 200px;">Data aceite do contrato:</span>
        //            <span>${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]}</span>
        //        </div>
        //    </div>
        // </div>

        //         `;

        const html = `
    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; border: 1px solid #ddd; margin: 20px; border-radius: 4px;">
    <thead>
        <tr>
            <th colspan="2" style="padding: 20px; font-size: 1.25em; text-align: left; border-bottom: 1px solid #ddd;">Assinatura </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee; min-width: 200px;">ID:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${newLogClick.id || "Sem Registro!"}</td>
        </tr>
        <tr>
            <td style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee;">Matriz:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${newLogClick.matrix || "Sem Registro!"}</td>
        </tr>     
        <tr>
            <td style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee;">Nome do Usuário:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${newLogClick.nomeUsuario || "Sem Registro!"}</td>
        </tr>
        <tr>
            <td style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee;">IP:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${newLogClick.ip || "Sem Registro!"}</td>
        </tr>
        <tr>
            <td style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee;">Navegador:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${newLogClick.navegador || "Sem Registro!"}</td>
        </tr>
        <tr>
            <td style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee;">Latitude:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${newLogClick.latitude || "Sem Registro!"}</td>
        </tr>
        <tr>
            <td style="font-weight: 600; padding: 12px; border-bottom: 1px solid #eee;">Longitude:</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${newLogClick.longitude || "Sem Registro!"}</td>
        </tr>
        <tr>
            <td style="font-weight: 600; padding: 12px;">Data aceite do contrato:</td>
            <td style="padding: 12px;">${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[0]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[1]} de ${getDataHorarioAtual.ARRAY_DIA_MES_ANO()[2]
            }</td>
        </tr>
    </tbody>
</table>

        `;
        return html;
    }

    static pdfNaoEncontrato() {
        return `
<!DOCTYPE html>
<html>
<head>
   <title>PDF Não Encontrado</title>
   <style>
       body {
           margin: 0;
           padding: 0;
           min-height: 100vh;
           display: flex;
           align-items: center;
           justify-content: center;
           font-family: Arial, sans-serif;
           background-color: #f5f5f5;
       }

       .container {
           background: white;
           padding: 2rem;
           border-radius: 8px;
           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
           text-align: center;
           max-width: 400px;
           width: 90%;
       }

       .warning-icon {
           font-size: 48px;
           color: #f59e0b;
           margin-bottom: 1rem;
       }

       h1 {
           color: #1f2937;
           font-size: 24px;
           margin-bottom: 1rem;
       }

       .message {
           color: #4b5563;
           margin-bottom: 1.5rem;
       }

       .divider {
           border-top: 1px solid #e5e7eb;
           margin: 1.5rem 0;
       }

       .support-text {
           color: #6b7280;
           font-size: 14px;
       }

       .email {
           color: #3b82f6;
           text-decoration: none;
       }

       .footer {
           color: #9ca3af;
           font-size: 12px;
           margin-top: 1rem;
       }
   </style>
</head>
<body>
   <div class="container">
       <div class="warning-icon">⚠️</div>
       
       <h1>PDF Não Encontrado</h1>
       
       <p class="message">
           O documento PDF solicitado não foi encontrado ou não está mais disponível no sistema.
       </p>

       <div class="divider"></div>

       <p class="support-text">
           Por favor, verifique o link ou entre em contato com o suporte através do email:<br>
           <a href="mailto:sac@ondaseg.com.br" class="email">sac@ondasegura.com.br</a>
       </p>

       <p class="footer">
           Onda Segura © <script>document.write(new Date().getFullYear())</script>
       </p>
   </div>
</body>
</html>
    `;
    }

    static pdfAssinatura() {
        return `
         <img class="imgAss" src="https://lh3.googleusercontent.com/pw/AP1GczNcfSiFRyG6YiaIT1ybnSL0PQsvLkdhw--FWiNbPJDAysm6AwBBG6K_WDeLelK_DWUWWrcXRxGb6A0ieTCx5T-zDIzVFZgCd5Qd_fFyu5ARIeJV-p2b_V43fgCme2JtohuExnCZISOkvaLRoEOmn1he=w732-h341-s-no-gm">

        `;
    }
};

export default utilsPdf;
