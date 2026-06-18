const { reportService } = require('../services');
const { ReportDTO } = require('../dto');

exports.getAll = async (req, res, next) => {
  try {
    const data = await reportService.getAll();
    res.json(ReportDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await reportService.create(req.body, req.userId);
    res.json(ReportDTO.fromRaw(data));
  } catch (err) {
    next(err);
  }
};