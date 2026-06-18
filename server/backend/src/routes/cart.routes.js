const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const cartController = require('../controllers/cart.controller');
const { cartValidator } = require('../middlewares/validators');

router.get('/cart/:userId', protegerRuta, cartController.getCart);
router.put('/cart/:userId', protegerRuta, cartValidator.validateSaveCart, cartController.saveCart);
router.post('/cart/:userId/items', protegerRuta, cartValidator.validateCartItem, cartController.addItem);
router.patch('/cart/:userId/items/:itemId', protegerRuta, cartValidator.validateUpdateQuantity, cartController.updateQuantity);
router.delete('/cart/:userId/items/:itemId', protegerRuta, cartController.removeItem);
router.delete('/cart/:userId', protegerRuta, cartController.clearCart);

module.exports = router;