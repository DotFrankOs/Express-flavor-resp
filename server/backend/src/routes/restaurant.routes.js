const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/restaurant.controller');
router.get('/restaurants', ctrl.getAll);
router.get('/restaurants/:id', ctrl.getById);
module.exports = router;
