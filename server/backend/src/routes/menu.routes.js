const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menu.controller');
router.get('/restaurants/:id/menu', ctrl.getMenu);
module.exports = router;
