const express = require('express');
const router = express.Router();

router.use(require('./auth.routes'));
router.use(require('./restaurant.routes'));
router.use(require('./menu.routes'));
router.use(require('./table.routes'));
router.use(require('./reservation.routes'));
router.use(require('./order.routes'));
router.use(require('./cart.routes'));
router.use(require('./stats.routes'));
router.use(require('./report.routes'));
router.use(require('./exchange.routes'));
router.use(require('./health.routes'));
router.use(require('./staff.routes'));

module.exports = router;