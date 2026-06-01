const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/table.controller');
router.get('/restaurants/:id/tables', ctrl.getTables);
router.get('/restaurants/:id/tables/layout', ctrl.getLayout);
module.exports = router;
