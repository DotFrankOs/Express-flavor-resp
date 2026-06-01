const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/exchange.controller');
router.get('/exchange-rates', ctrl.getRates);
module.exports = router;
