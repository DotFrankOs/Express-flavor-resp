const { tableService } = require('../services');
const { TableDTO, TableLayoutDTO } = require('../dto');

exports.getTables = async (req, res, next) => {
  try {
    const data = await tableService.getTablesByRestaurantId(req.params.id);
    res.json(TableDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};

exports.getLayout = async (req, res, next) => {
  try {
    const data = await tableService.getLayoutByRestaurantId(req.params.id);
    res.json(TableLayoutDTO.fromRaw(data));
  } catch (err) {
    next(err);
  }
};

exports.getPricing = async (req, res, next) => {
  try {
    const data = await tableService.getPricingByRestaurantId(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};