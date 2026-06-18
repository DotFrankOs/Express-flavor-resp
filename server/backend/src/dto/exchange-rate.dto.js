class ExchangeRateDTO {
  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return { base: 'USD', rates: {}, symbols: {} };

    const result = { base: 'USD', rates: {}, symbols: {} };
    dataList.forEach(r => {
      result.rates[r.code] = parseFloat(r.rate ?? 0);
      result.symbols[r.code] = r.symbol;
    });
    return result;
  }
}

module.exports = ExchangeRateDTO;