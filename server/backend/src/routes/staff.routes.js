const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/staff.controller');

router.get('/staff/restaurants', protegerRuta, ctrl.getMyRestaurants);
router.get('/staff/restaurants/:restaurantId/dashboard', protegerRuta, ctrl.getDashboard);
router.patch('/staff/orders/:orderId/status', protegerRuta, ctrl.updateOrderStatus);

module.exports = router;