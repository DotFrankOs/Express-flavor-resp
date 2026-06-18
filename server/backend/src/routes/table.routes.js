const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');

router.get('/restaurants/:id/tables', tableController.getTables);
router.get('/restaurants/:id/tables/layout', tableController.getLayout);

module.exports = router;