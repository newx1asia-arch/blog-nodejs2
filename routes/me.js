const express = require('express');
const router = express.Router();
const meController = require('../app/controllers/MeController');
const productController = require('../app/controllers/ProductController');
const { requireAuth } = require('../app/middlewares/auth');
const uploadAvatar = require('../app/middlewares/uploadavatar');

// Tất cả route /me đều yêu cầu đăng nhập
router.use(requireAuth);

router.get('/', meController.profile);
router.get('/profile', meController.profile);
router.post('/profile', meController.updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), meController.updateAvatar);

router.get('/password', meController.showChangePassword);
router.post('/password', meController.changePassword);

router.get('/orders', meController.orders);

// Tái dùng luôn ProductController.mine (đã render 'me/my-products' sẵn)
router.get('/products', productController.mine);

module.exports = router;