const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');

router.get('/restaurants/:id/tables', tableController.getTables);
router.get('/restaurants/:id/tables/layout', tableController.getLayout);
router.get('/restaurants/:id/tables/pricing', tableController.getPricing);

module.exports = router;