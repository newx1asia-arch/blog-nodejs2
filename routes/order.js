const express = require('express');
const router = express.Router();
const orderController = require('../app/controllers/OrderController');
const { requireAuth } = require('../app/middlewares/auth');

router.get('/:id', requireAuth, orderController.show);

module.exports = router;