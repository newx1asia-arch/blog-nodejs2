const express = require('express');
const router = express.Router();
const productController = require('../app/controllers/ProductController');
const reviewController = require('../app/controllers/ReviewController');
const reportController = require('../app/controllers/ReportController');
const { requireAuth } = require('../app/middlewares/auth');
const { uploadProductMedia } = require('../app/middlewares/productmedia');

// routes/product.js (chỉ đổi phần message trong handleProductMedia, còn lại giữ nguyên)
function handleProductMedia(req, res, next) {
    uploadProductMedia(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_UNEXPECTED_FIELD'
                ? 'Có trường file không hợp lệ, vui lòng tải lại trang và chọn lại ảnh/video.'
                : err.code === 'LIMIT_FILE_SIZE'
                    ? 'File vượt quá 150MB, vui lòng nén video hoặc chọn video dung lượng nhỏ hơn.'
                    : err.message;
            return res.status(400).send(
                `<h1>Lỗi tải ảnh: ${message}</h1><a href="javascript:history.back()">Quay lại</a>`
            );
        }
        next();
    });
}

router.get('/create', requireAuth, productController.create);
router.post('/store', requireAuth, handleProductMedia, productController.store);
router.get('/:id/edit', requireAuth, productController.edit);
router.put('/:id', requireAuth, handleProductMedia, productController.update);
router.delete('/:id', requireAuth, productController.destroy);
router.post('/:id/reviews', requireAuth, reviewController.store);
router.post('/:id/report', requireAuth, reportController.store);
router.get('/:slug', productController.show);

module.exports = router;