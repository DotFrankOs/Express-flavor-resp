const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');

router.get('/restaurants', restaurantController.getAll);
router.get('/restaurants/:id', restaurantController.getById);

module.exports = router;