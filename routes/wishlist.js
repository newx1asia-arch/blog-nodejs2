const express = require('express');
const router = express.Router();
const wishlistController = require('../app/controllers/WishlistController');
const { requireAuth } = require('../app/middlewares/auth');

router.get('/', requireAuth, wishlistController.show);
router.post('/toggle/:productId', requireAuth, wishlistController.toggle);

module.exports = router;