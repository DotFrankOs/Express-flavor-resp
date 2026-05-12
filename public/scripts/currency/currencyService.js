import { apiConfig } from '../config/apiConfig.js';
import { apiFetch } from '../utils/apiFetch.js';
import { mockExchangeRates } from '../data/mockData.js';

let _currentCurrency = localStorage.getItem('preferredCurrency') || 'NIO';
let _rates = { ...mockExchangeRates };
let _ready = false;

export const currencyService = {
  async init() {
    if (apiConfig.useMock) {
      _rates = { ...mockExchangeRates };
      _ready = true;
      return;
    }

    try {
      const data = await apiFetch('/exchange-rates');
      if (data && data.rates) {
        _rates = {};
        for (const [code, rate] of Object.entries(data.rates)) {
          _rates[code] = {
            symbol: data.symbols?.[code] || code,
            rate
          };
        }
        if (!_rates[data.base || 'USD']) {
          _rates[data.base || 'USD'] = { symbol: '$', rate: 1 };
        }
      }
      _ready = true;
    } catch (err) {
      console.warn('Error cargando tasas en vivo, usando tasas por defecto', err);
      _rates = { ...mockExchangeRates };
      _ready = true;
    }
  },

  setCurrency(code) {
    if (_rates[code]) {
      _currentCurrency = code;
      localStorage.setItem('preferredCurrency', code);
    }
  },

  getCurrency() {
    return _currentCurrency;
  },

  convert(amountBase) {
    const rate = _rates[_currentCurrency]?.rate || 1;
    return amountBase * rate;
  },

  formatPrice(amountBase) {
    const converted = this.convert(amountBase);
    const symbol = _rates[_currentCurrency]?.symbol || '$';
    return `${symbol} ${converted.toFixed(2)}`;
  },

  getAvailableCurrencies() {
    return Object.keys(_rates).map(code => ({
      code,
      symbol: _rates[code].symbol
    }));
  }
};