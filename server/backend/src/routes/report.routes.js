const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const reportController = require('../controllers/report.controller');
const { reportValidator } = require('../middlewares/validators');

router.get('/reports', reportController.getAll);
router.post(
  '/reports',
  protegerRuta,
  reportValidator.validateCreate,
  reportController.create
);

module.exports = router;