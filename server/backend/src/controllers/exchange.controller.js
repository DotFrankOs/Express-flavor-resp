const { exchangeService } = require('../services');
const { ExchangeRateDTO } = require('../dto');

exports.getRates = async (req, res, next) => {
  try {
    const data = await exchangeService.getRates();
    res.json(ExchangeRateDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};