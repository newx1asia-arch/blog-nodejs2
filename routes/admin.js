const express = require('express');
const router = express.Router();
const reportController = require('../app/controllers/ReportController');
const { requireAdmin } = require('../app/middlewares/auth');

router.use(requireAdmin);

router.get('/reports', reportController.index);
router.post('/reports/:id/takedown', reportController.takedown);
router.post('/reports/:id/dismiss', reportController.dismiss);

module.exports = router;