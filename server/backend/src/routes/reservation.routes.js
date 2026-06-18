const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const reservationController = require('../controllers/reservation.controller');
const { reservationValidator } = require('../middlewares/validators');

router.get('/restaurants/:id/reservations', reservationController.getAll);
router.post(
  '/restaurants/:id/reservations',
  protegerRuta,
  reservationValidator.validateCreate,
  reservationController.create
);
router.put(
  '/restaurants/:id/reservations',
  protegerRuta,
  reservationValidator.validateReplaceAll,
  reservationController.replaceAll
);
router.delete(
  '/restaurants/:id/reservations',
  protegerRuta,
  reservationValidator.validateRemove,
  reservationController.remove
);
router.get('/reservations/my', protegerRuta, reservationController.getMy);

module.exports = router;