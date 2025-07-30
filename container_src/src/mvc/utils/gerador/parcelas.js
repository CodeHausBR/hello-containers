const geradorDeParcelas = class geradorDeParcelas {
  static gerarDatasVencimentoParcelas({ data, parcelas }) {
    let dataValue = new Date(data);
    let diaVencimento = dataValue.getDate() + 1; // Dia inicial de vencimento
    let arrayData = [];

    for (let i = 0; i < parcelas; i++) {
        let novaData = new Date(dataValue);
        novaData.setMonth(novaData.getMonth() + i); // Adiciona o número de meses

        // Tenta definir o mesmo dia
        novaData.setDate(diaVencimento);
        
        // Verifica se o mês foi alterado (o JavaScript pode mudar para o próximo mês se o dia não existir)
        if (novaData.getMonth() !== (dataValue.getMonth() + i) % 12) {
            // Se o dia não existir no mês, volta para o último dia válido do mesmo mês
            novaData.setDate(0);
        }

        let dataFormatada = novaData.toLocaleDateString("pt-BR");
        arrayData.push(dataFormatada);
    }

    return arrayData;
}
  static gerarParcelasComJuros({
    parcelas = Number,
    valorTotal = Number,
    vencimento = String,
    juros = Number,
    desconto = Number
  }) {
    let arrayParcelas = [];
    const valorComJuros = juros > 0 ? Math.ceil(valorTotal * juros) : valorTotal;
    const valorComDesconto = desconto > 0 ? Math.ceil(valorComJuros - (valorComJuros * (desconto / 100))) : valorComJuros
    const valorParcelas = valorComDesconto / parcelas;
    const listaVencimentos = this.gerarDatasVencimentoParcelas({
      data: vencimento,
      parcelas: parcelas,
    });
    const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    for (let i = 1; i <= parcelas; i++) {
      arrayParcelas.push(
        new Object({
          parcela: i,
          valor: formatadorMoeda.format(valorParcelas),
          data: listaVencimentos[i - 1],
        })
      );
    }

    const parcelamento = new Object({
      valor_corrigido: valorComJuros,
      quantidade_parcelas: parcelas,
      parcelamento: arrayParcelas,
    });

    return parcelamento;
  }
};

export default geradorDeParcelas;
