//BIBLIOTECAS
//HELPERS

//BANCO DE DADOS
import onda_errors from "../../models/public/onda_errors.js";
//SERVICES

const parametrosSistema = class parametrosSistema {
    constructor(data) {
        this._id = data?._id;
        // Mapeia o array para instâncias da classe PalavraRestrita
        this.onda_config_palavras_restritas_juridico = data?.onda_config_palavras_restritas_juridico;

        this.onda_config_regras_reprovacao_automatica = {
            reprovar_divida_maior_que: data?.onda_config_regras_reprovacao_automatica?.reprovar_divida_maior_que,
            verificar_black_list: data?.onda_config_regras_reprovacao_automatica?.verificar_black_list,
        };

        this.onda_config_analise_manual_aplicativos = {
            cpf_portal: data?.onda_config_analise_manual_aplicativos?.cpf_portal,
            cpf_wave: data?.onda_config_analise_manual_aplicativos?.cpf_wave,
            cnpj_portal: data?.onda_config_analise_manual_aplicativos?.cnpj_portal,
            cnpj_wave: data?.onda_config_analise_manual_aplicativos?.cnpj_wave,
        };

        this.onda_config_teto_para_ativar_analise_manual = {
            teto_em_reais: data?.onda_config_teto_para_ativar_analise_manual?.teto_em_reais,
        };

        this.onda_config_valores_adicionais = data?.onda_config_valores_adicionais;

        this.onda_config_planos = data?.onda_config_planos;

        this.createdAt = data?.createdAt;
        this.updatedAt = data?.updatedAt;
        this.__v = data?.__v;
    }

    set_onda_config_palavras_restritas_juridico() {
        class PalavraRestrita {
            constructor(data) {
                this.ativa = data?.ativa;
                this.label = data?.label;
                this._id = data?._id;
            }
        }

        if (Array.isArray(this.onda_config_palavras_restritas_juridico) == false) return [];

        const arrayFiltrado = this.onda_config_palavras_restritas_juridico
            .filter((item) => item.ativa)
            .map((item) => {
                const palavras_restritas_juridico = new PalavraRestrita(item);
                return palavras_restritas_juridico.label;
            });

        if (Array.isArray(arrayFiltrado) == false) return [];

        return arrayFiltrado;
    }
};

export default parametrosSistema;
