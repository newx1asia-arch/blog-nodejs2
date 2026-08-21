const express = require('express');
const router = express.Router();
const siteController = require('../app/controllers/SiteController');
const productController = require('../app/controllers/ProductController');
const orderController = require('../app/controllers/OrderController');
const { requireAuth } = require('../app/middlewares/auth');

router.get('/search', siteController.search);
router.get('/about', siteController.about);
router.get('/contact', siteController.contact);
router.post('/contact', siteController.submitContact);
router.get('/me/products', requireAuth, productController.mine);
router.get('/me/orders', requireAuth, orderController.mine);
router.get('/', siteController.index);

module.exports = router;