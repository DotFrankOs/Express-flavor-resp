const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/order.controller');
router.post('/orders', protegerRuta, ctrl.create);
router.get('/orders/user/:userId', protegerRuta, ctrl.getByUser);
module.exports = router;
