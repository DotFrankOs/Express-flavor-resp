const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/health.controller');
router.get('/health', ctrl.check);
module.exports = router;
