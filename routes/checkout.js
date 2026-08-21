const express = require('express');
const router = express.Router();
const checkoutController = require('../app/controllers/CheckoutController');
const { requireAuth } = require('../app/middlewares/auth');

router.get('/', requireAuth, checkoutController.show);
router.post('/apply-voucher', requireAuth, checkoutController.applyVoucher);
router.post('/', requireAuth, checkoutController.placeOrder);

module.exports = router;