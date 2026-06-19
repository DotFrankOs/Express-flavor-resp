const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const cartController = require('../controllers/cart.controller');
const { cartValidator } = require('../middlewares/validators');
const { requireOwnership } = require('../middlewares/ownership.middleware');

router.get('/cart/:userId', protegerRuta, requireOwnership('userId'), cartController.getCart);
router.put('/cart/:userId', protegerRuta, requireOwnership('userId'), cartValidator.validateSaveCart, cartController.saveCart);
router.post('/cart/:userId/items', protegerRuta, requireOwnership('userId'), cartValidator.validateCartItem, cartController.addItem);
router.patch('/cart/:userId/items/:itemId', protegerRuta, requireOwnership('userId'), cartValidator.validateUpdateQuantity, cartController.updateQuantity);
router.delete('/cart/:userId/items/:itemId', protegerRuta, requireOwnership('userId'), cartController.removeItem);
router.delete('/cart/:userId', protegerRuta, requireOwnership('userId'), cartController.clearCart);

module.exports = router;