const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const { requireOwnership } = require('../middlewares/ownership.middleware'); // <-- FALTABA ESTO
const orderController = require('../controllers/order.controller');
const { orderValidator } = require('../middlewares/validators');

router.post(
  '/orders',
  protegerRuta,
  orderValidator.validateCreateOrder,
  orderController.create
);
router.get('/orders/user/:userId', protegerRuta, requireOwnership('userId'), orderController.getByUser);
router.patch(
  '/orders/:id/status',
  protegerRuta,
  orderValidator.validateUpdateStatus,
  orderController.updateStatus
);

module.exports = router;