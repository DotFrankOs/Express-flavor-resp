const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const staffController = require('../controllers/staff.controller');
const { staffValidator } = require('../middlewares/validators');

router.get('/staff/restaurants', protegerRuta, staffController.getMyRestaurants);
router.get(
  '/staff/restaurants/:restaurantId/dashboard',
  protegerRuta,
  staffController.getDashboard
);
router.patch(
  '/staff/orders/:orderId/status',
  protegerRuta,
  staffValidator.validateUpdateOrderStatus,
  staffController.updateOrderStatus
);

module.exports = router;