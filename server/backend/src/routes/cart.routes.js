const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const cartController = require('../controllers/cart.controller');
const { cartValidator } = require('../middlewares/validators');

router.get('/cart/:userId', protegerRuta, cartController.getCart);
router.put(
  '/cart/:userId',
  protegerRuta,
  cartValidator.validateSaveCart,
  cartController.saveCart
);
router.delete('/cart/:userId', protegerRuta, cartController.clearCart);

module.exports = router;