const express = require('express');
const router = express.Router();
const productController = require('../app/controllers/ProductController');
const reviewController = require('../app/controllers/ReviewController');
const reportController = require('../app/controllers/ReportController');
const { requireAuth } = require('../app/middlewares/auth');
const upload = require('../app/middlewares/upload');

function handleImageUpload(req, res, next) {
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            return res.status(400).send(
                `<h1>Lỗi tải ảnh: ${err.message}</h1><a href="javascript:history.back()">Quay lại</a>`
            );
        }
        next();
    });
}

router.get('/create', requireAuth, productController.create);
router.post('/store', requireAuth, handleImageUpload, productController.store);
router.get('/:id/edit', requireAuth, productController.edit);
router.put('/:id', requireAuth, handleImageUpload, productController.update);
router.delete('/:id', requireAuth, productController.destroy);
router.post('/:id/reviews', requireAuth, reviewController.store);
router.post('/:id/report', requireAuth, reportController.store);
router.get('/:slug', productController.show);

module.exports = router;