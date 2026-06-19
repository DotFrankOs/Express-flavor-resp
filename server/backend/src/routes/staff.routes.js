const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const staffController = require('../controllers/staff.controller');
const { staffValidator } = require('../middlewares/validators');
const { requireRestaurantAccess } = require('../middlewares/ownership.middleware');

router.get('/staff/restaurants', protegerRuta, staffController.getMyRestaurants);
router.get('/staff/restaurants/:restaurantId/dashboard', protegerRuta, requireRestaurantAccess(), staffController.getDashboard);
router.patch('/staff/orders/:orderId/status', protegerRuta, requireRestaurantAccess(), staffValidator.validateUpdateOrderStatus, staffController.updateOrderStatus);

module.exports = router;