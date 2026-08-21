const express = require('express');
const router = express.Router();
const sellerController = require('../app/controllers/SellerController');
const { requireAuth } = require('../app/middlewares/auth');

router.get('/', sellerController.index);           // /seller — danh sách tất cả cửa hàng
router.post('/:id/follow', requireAuth, sellerController.toggleFollow);
router.get('/:id', sellerController.show);          // /seller/:id — phải đặt SAU route '/'

module.exports = router;