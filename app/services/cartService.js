const Cart = require('../models/Cart');

async function getOrCreateCart(req) {
    if (req.session.userId) {
        const userCart = await Cart.findOne({ user: req.session.userId });
        if (userCart) {
            req.session.cartId = userCart._id;
            return userCart;
        }
    }

    if (req.session.cartId) {
        const existing = await Cart.findById(req.session.cartId);
        if (existing) {
            if (req.session.userId && !existing.user) {
                existing.user = req.session.userId;
                await existing.save();
            }
            return existing;
        }
    }

    const cart = await Cart.create({
        sessionId: req.sessionID,
        user: req.session.userId || null,
        items: []
    });
    req.session.cartId = cart._id;
    return cart;
}

async function mergeCartOnLogin(req, userId) {
    if (!req.session.cartId) return;

    const guestCart = await Cart.findById(req.session.cartId);
    if (!guestCart) return;
    if (guestCart.user && guestCart.user.toString() === userId.toString()) return;

    const userCart = await Cart.findOne({ user: userId, _id: { $ne: guestCart._id } });

    if (!userCart) {
        guestCart.user = userId;
        await guestCart.save();
        return;
    }

    guestCart.items.forEach(guestItem => {
        const existing = userCart.items.find(i => i.product.toString() === guestItem.product.toString());
        if (existing) {
            existing.quantity += guestItem.quantity;
        } else {
            userCart.items.push({ product: guestItem.product, quantity: guestItem.quantity });
        }
    });
    userCart.updatedAt = Date.now();
    await userCart.save();
    await guestCart.deleteOne();

    req.session.cartId = userCart._id;
}

module.exports = { getOrCreateCart, mergeCartOnLogin };