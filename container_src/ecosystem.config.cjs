module.exports = {
    apps: [
        {
            name: "sandbox-backend-wave", // Nome do processo
            script: "npm", // Script a ser executado
            args: "run sandbox", // Argumentos para o script
            autorestart: true, // Reinicia automaticamente em caso de falha
            watch: true, // Desabilita o modo watch (recomendado para produção)
            max_memory_restart: "1G", // Reinicia se o uso de memória exceder 1GB
            autostart: true, // false: Não inicia automaticamente ao rodar o ecosystem
            // env: {
            //     NODE_ENV: "sandbox", // Mantém o nome do ambiente consistente
            // },
            // env_file: ".env.sandbox", // Carrega automaticamente o arquivo de ambiente correto
        },
        {
            name: "producao-backend-wave", // Nome do processo
            script: "npm", // Script a ser executado
            args: "run producao", // Argumentos para o script
            autorestart: true, // Reinicia automaticamente em caso de falha
            watch: false, // Desabilita o modo watch (recomendado para produção)
            max_memory_restart: "1G", // Reinicia se o uso de memória exceder 1GB
            autostart: true, // false: Não inicia automaticamente ao rodar o ecosystem
            // env: {
            //     NODE_ENV: "producao", // Mantém o nome do ambiente consistente
            // },
            // env_file: ".env.producao", // Carrega automaticamente o arquivo de ambiente correto
        },
    ],
};
//COMANDO PARA STARTAR O PROJETO:
//pm2 start ecosystem.config.cjs
