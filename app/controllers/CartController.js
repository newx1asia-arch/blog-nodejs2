const Product = require('../models/Product');
const { getOrCreateCart } = require('../services/cartService');

class CartController {
    async show(req, res, next) {
        try {
            const cart = await getOrCreateCart(req);
            await cart.populate('items.product');
            const cartData = cart.toObject();

            const items = cartData.items
                .filter(i => i.product)
                .map(i => {
                    const price = i.product.salePrice || i.product.price;
                    const overStock = i.quantity > i.product.stock;
                    return {
                        _id: i._id,
                        product: i.product,
                        quantity: i.quantity,
                        subtotal: price * i.quantity,
                        overStock
                    };
                });

            const total = items.reduce((sum, i) => sum + i.subtotal, 0);
            const hasOverStock = items.some(i => i.overStock);
            res.render('cart', { items, total, hasOverStock });
        } catch (error) {
            next(error);
        }
    }

    async add(req, res, next) {
        try {
            const { productId, quantity } = req.body;
            const qty = Math.max(1, parseInt(quantity) || 1);

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).send('<h1>404 - Sản phẩm không tồn tại</h1><a href="/">Quay về trang chủ</a>');
            }

            const cart = await getOrCreateCart(req);
            const existingItem = cart.items.find(i => i.product.toString() === productId);
            if (existingItem) {
                existingItem.quantity += qty;
            } else {
                cart.items.push({ product: productId, quantity: qty });
            }
            cart.updatedAt = Date.now();
            await cart.save();

            res.redirect('/cart');
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const cart = await getOrCreateCart(req);
            const item = cart.items.id(req.params.itemId);
            if (item) {
                item.quantity = Math.max(1, parseInt(req.body.quantity) || 1);
                cart.updatedAt = Date.now();
                await cart.save();
            }
            res.redirect('/cart');
        } catch (error) {
            next(error);
        }
    }

    async remove(req, res, next) {
        try {
            const cart = await getOrCreateCart(req);
            cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
            cart.updatedAt = Date.now();
            await cart.save();
            res.redirect('/cart');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CartController();