const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchange.controller');

router.get('/exchange-rates', exchangeController.getRates);

module.exports = router;