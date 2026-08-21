const Wishlist = require('../models/Wishlist');

async function getOrCreateWishlist(userId) {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        wishlist = await Wishlist.create({ user: userId, products: [] });
    }
    return wishlist;
}

class WishlistController {
    async show(req, res, next) {
        try {
            const wishlist = await Wishlist.findOne({ user: req.session.userId })
                .populate('products')
                .lean();
            const products = wishlist ? wishlist.products.filter(Boolean) : [];
            res.render('wishlist', { products });
        } catch (error) {
            next(error);
        }
    }

    async toggle(req, res, next) {
        try {
            const wishlist = await getOrCreateWishlist(req.session.userId);
            const productId = req.params.productId;
            const idx = wishlist.products.findIndex(p => p.toString() === productId);

            if (idx > -1) {
                wishlist.products.splice(idx, 1);
            } else {
                wishlist.products.push(productId);
            }
            wishlist.updatedAt = Date.now();
            await wishlist.save();

            res.redirect(req.get('Referrer') || '/');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new WishlistController();