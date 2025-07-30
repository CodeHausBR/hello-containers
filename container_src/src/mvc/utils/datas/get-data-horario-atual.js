const getDataHorarioAtual = class getDataHorarioAtual {
    static YYYY_MM_DD_00_00_00(newData) {
        let dataAtual = new Date();
        if (newData) {
            dataAtual = new Date(newData);
        }

        const options = {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        const horarioFormatado = dataAtual.toLocaleString("pt-BR", options);
        const [data, hora] = horarioFormatado.split(" " && ",");
        const [dia, mes, ano] = data.split("/");
        return `${ano}-${mes}-${dia}${hora}`;
    }

    static YYYY_MM_DIA_10_FIXO_00_00_00(newData) {
        let dataAtual = new Date();
        if (newData) {
            dataAtual = new Date(newData);
        }

        const options = {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        const horarioFormatado = dataAtual.toLocaleString("pt-BR", options);
        const [data, hora] = horarioFormatado.split(" " && ",");
        const [dia, mes, ano] = data.split("/");
        return `${ano}-${mes}-${10}${hora}`;
    }

    static DD_MM_YYYY_00_00_00() {
        const dataAtual = new Date();
        const options = {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        return dataAtual.toLocaleString("pt-BR", options);
    }
    static DD_MM_YYYY_00_00_00_MONGOOSE() {
        const dataAtual = new Date();
        const options = {
            timeZone: "America/Sao_Paulo",
        };
        return dataAtual.toLocaleString("pt-BR", options);
    }

    static DD_MM_YYYY() {
        const dataAtual = new Date();
        const options = {
            timeZone: "America/Sao_Paulo",
            day: "numeric",
            month: "numeric",
            year: "numeric",
        };
        return dataAtual.toLocaleString("pt-BR", options);
    }

    static YYYY_MM_DD() {
        const dataAtual = new Date();
        const options = {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        const horarioFormatado = dataAtual.toLocaleString("pt-BR", options);
        const [data] = horarioFormatado.split(" " && ",");
        const [dia, mes, ano] = data.split("/");
        return `${ano}-${mes}-${dia}`;
    }

    static YYYYMMDD() {
        const dataAtual = new Date();
        const options = {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        const horarioFormatado = dataAtual.toLocaleString("pt-BR", options);
        const [data] = horarioFormatado.split(" " && ",");
        const [dia, mes, ano] = data.split("/");
        return `${ano}${mes}${dia}`;
    }

    static GET_10_DIAS_AFRENTE() {
        function formatarData(data) {
            var dia = data.getDate();
            var mes = data.getMonth() + 1;
            var ano = data.getFullYear();

            if (dia < 10) dia = "0" + dia;
            if (mes < 10) mes = "0" + mes;

            return dia + "/" + mes + "/" + ano;
        }

        var dataAtual = new Date();
        dataAtual.setDate(dataAtual.getDate() + 10);
        var dataFormatada = formatarData(dataAtual);

        return dataFormatada;
    }

    static ARRAY_DIA_MES_ANO(newData) {
        let dataAtual = new Date();
        if (newData) {
            dataAtual = new Date(newData);
        }

        const options = {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        const horarioFormatado = dataAtual.toLocaleString("pt-BR", options);
        const [data, hora] = horarioFormatado.split(" " && ",");
        const [dia, mes, ano] = data.split("/");

        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        const nomeDoMes = meses[mes - 1];

        return [dia, nomeDoMes, ano];
    }

    static GERAR_PROXIMO_VENCIMENTO(date) {
        // "2024-02-05 00:08:19 old";
        // "2024-03-05 00:08:19 new";
        let dataAtual = new Date(date);

        const options = {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        };
        const horarioFormatado = dataAtual.toLocaleString("pt-BR", options);
        const [data, hora] = horarioFormatado.split(" " && ",");
        const [dia, mes, ano] = data.split("/");

        dataAtual.setMonth(dataAtual.getMonth() + 1);
        dataAtual.setDate(dia);

        return this.YYYY_MM_DD_00_00_00(dataAtual);
    }

    static VERIFICAR_MAIOR_IDADE(dataNascimento = String()) {
        // Converte a data de nascimento para um objeto Date
        const dataNascimentoObj = new Date(dataNascimento);

        // Obtém a data atual
        const dataAtual = new Date();

        // Calcula a diferença em milissegundos entre as datas
        const diferencaMilissegundos = dataAtual - dataNascimentoObj;

        // Calcula a idade em anos
        const idade = Math.floor(diferencaMilissegundos / (365.25 * 24 * 60 * 60 * 1000));

        // Verifica se a pessoa é maior de 18 anos
        if (idade >= 18) {
            return true; // É maior de idade
        } else {
            return false; // É menor de idade
        }
    }
    static converterData(localDateTimeString) {
        // Separar a data e hora
        const [dateString, timeString] = localDateTimeString.split(" ");
        const [day, month, year] = dateString.split("/");
        const [hours, minutes] = timeString.split(":");

        // Criar um objeto Date com a data e hora local
        const localDate = new Date(year, month - 1, day, hours, minutes);

        // Ajustar o fuso horário local (simplificado, não considera DST)
        const localOffset = new Date().getTimezoneOffset() * 60000; // em milissegundos
        localDate.setTime(localDate.getTime() - localOffset);

        // Converter para UTC e formatar
        const utcDateTime = new Date(localDate.getTime());
        const utcString = utcDateTime.toISOString().slice(0, -1) + "Z"; // Remover 'Z' e adicionar novamente para garantir

        return utcString;
    }

    static getQuantidadeDeDiasNoMes(mes, ano) {
        return new Date(ano, mes, 0).getDate();
    }
};

export default getDataHorarioAtual;
