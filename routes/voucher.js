// routes/voucher.js
const express = require('express');
const router = express.Router();
const voucherController = require('../app/controllers/VoucherController');
const { requireAuth } = require('../app/middlewares/auth');

router.use(requireAuth);

router.get('/', voucherController.index);
router.post('/', voucherController.store);
router.post('/:id/toggle', voucherController.toggle);
router.delete('/:id', voucherController.destroy);

module.exports = router;