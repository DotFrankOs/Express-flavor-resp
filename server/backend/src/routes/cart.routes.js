const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/cart.controller');
router.get('/cart/:userId', protegerRuta, ctrl.getCart);
router.put('/cart/:userId', protegerRuta, ctrl.saveCart);
router.delete('/cart/:userId', protegerRuta, ctrl.clearCart);
module.exports = router;
