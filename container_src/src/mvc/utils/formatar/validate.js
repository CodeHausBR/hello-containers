import onda_status from "../../models/public/onda_status.js";

import json from "../../utils/formatar/json.js";

const validate = class validate {
    constructor() {
        this.validate = {};
    }

    name(valor = "") {
        this.names = valor;
        return this;
    }

    isEmail(valor = true) {
        this.validate.isEmail = {args: valor, msg: `${this.names} deve ser um email válido`};
        return this;
    }

    isUrl(valor = true) {
        this.validate.isUrl = {args: valor, msg: `${this.names} deve ser uma URL válida`};
        return this;
    }

    isIP(valor = true) {
        this.validate.isIP = {args: valor, msg: `${this.names} deve ser um IP válido`};
        return this;
    }

    isIPv4(valor = true) {
        this.validate.isIPv4 = {args: valor, msg: `${this.names} deve ser um IPv4 válido`};
        return this;
    }

    isIPv6(valor = true) {
        this.validate.isIPv6 = {args: valor, msg: `${this.names} deve ser um IPv6 válido`};
        return this;
    }

    isAlpha(valor = true) {
        this.validate.isAlpha = {args: valor, msg: `${this.names} deve conter apenas letras`};
        return this;
    }

    isAlphanumeric(valor = true) {
        this.validate.isAlphanumeric = {args: valor, msg: `${this.names} deve conter apenas caracteres alfanuméricos`};
        return this;
    }

    isNumeric(valor = true) {
        this.validate.isNumeric = {args: valor, msg: `${this.names} deve conter apenas números`};
        return this;
    }

    isInt(valor = true) {
        this.validate.isInt = {args: valor, msg: `${this.names} deve ser um número inteiro válido`};
        return this;
    }

    isFloat(valor = true) {
        this.validate.isFloat = {args: valor, msg: `${this.names} deve ser um número de ponto flutuante válido`};
        return this;
    }

    isDecimal(valor = true) {
        this.validate.isDecimal = {args: valor, msg: `${this.names} deve ser um número decimal válido`};
        return this;
    }

    isLowercase(valor = true) {
        this.validate.isLowercase = {args: valor, msg: `${this.names} deve conter apenas letras minúsculas`};
        return this;
    }

    isUppercase(valor = true) {
        this.validate.isUppercase = {args: valor, msg: `${this.names} deve conter apenas letras maiúsculas`};
        return this;
    }

    notNull(valor = true) {
        this.validate.notNull = {args: valor, msg: `${this.names} não deve ser nulo`};
        return this;
    }

    isNull(valor = true) {
        this.validate.isNull = {args: valor, msg: `${this.names} deve ser nulo`};
        return this;
    }

    notEmpty(valor = true) {
        this.validate.notEmpty = {args: valor, msg: `${this.names} não deve ser vazio`};
        return this;
    }

    equals(valor) {
        this.validate.equals = {args: valor, msg: `${this.names} deve ser igual a ${valor}`};
        return this;
    }

    contains(valor) {
        this.validate.contains = {args: valor, msg: `${this.names} deve conter ${valor}`};
        return this;
    }

    notIn(valor) {
        this.validate.notIn = {args: valor, msg: `${this.names} não deve estar em ${valor}`};
        return this;
    }

    isIn(valor) {
        this.validate.isIn = {args: valor, msg: `${this.names} deve estar em ${valor}`};
        return this;
    }

    notContains(valor) {
        this.validate.notContains = {args: valor, msg: `${this.names} não deve conter ${valor}`};
        return this;
    }

    len(valor) {
        this.validate.len = {args: valor, msg: `${this.names} deve ter um comprimento entre ${valor[0]} e ${valor[1]}`};
        return this;
    }

    isUUID(valor) {
        this.validate.isUUID = {args: valor, msg: `${this.names} deve ser um UUID válido`};
        return this;
    }

    isDate(valor = true) {
        this.validate.isDate = {args: valor, msg: `${this.names} deve ser uma data válida`};
        return this;
    }

    isAfter(valor) {
        this.validate.isAfter = {args: valor, msg: `${this.names} deve ser uma data após ${valor}`};
        return this;
    }

    isBefore(valor) {
        this.validate.isBefore = {args: valor, msg: `${this.names} deve ser uma data antes de ${valor}`};
        return this;
    }

    max(valor) {
        this.validate.max = {args: valor, msg: `${this.names} deve ser menor ou igual a ${valor}`};
        return this;
    }

    min(valor) {
        this.validate.min = {args: valor, msg: `${this.names} deve ser maior ou igual a ${valor}`};
        return this;
    }

    isCreditCard(valor = true) {
        this.validate.isCreditCard = {args: valor, msg: `${this.names} deve ser um número de cartão de crédito válido`};
        return this;
    }

    build() {
        const results = this.validate;
        this.validate = {};
        return results;
    }
};

export default new validate();
