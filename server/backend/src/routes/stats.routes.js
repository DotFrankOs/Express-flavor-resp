const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const statsController = require('../controllers/stats.controller');
const { statsValidator } = require('../middlewares/validators');

router.post(
  '/stats/purchase',
  protegerRuta,
  statsValidator.validateRecordPurchase,
  statsController.recordPurchase
);
router.get('/stats/restaurants/:id', statsController.getStats);
router.get('/stats/restaurants/:id/top', statsController.getTop);
router.get('/stats/restaurants/:id/items/:itemId', statsController.getItemCount);
router.get('/stats/restaurants/:id/items/:itemId/variants', statsController.getVariants);

module.exports = router;