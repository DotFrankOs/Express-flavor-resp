const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/report.controller');
router.get('/reports', ctrl.getAll);
router.post('/reports', protegerRuta, ctrl.create);
module.exports = router;
