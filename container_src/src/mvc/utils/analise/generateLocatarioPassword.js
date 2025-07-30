// utilsGeneratePassword.js

const utilsGeneratePassword = {
    gerarSenhaAleatoria: function (length) {
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let senha = "";
        for (let i = 0; i < length; i++) {
            senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return senha;
    },
};

export default utilsGeneratePassword;
