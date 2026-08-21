const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');

router.get('/', cartController.show);
router.post('/add', cartController.add);
router.put('/update/:itemId', cartController.update);
router.delete('/remove/:itemId', cartController.remove);

module.exports = router;