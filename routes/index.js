const siteRouter = require('./site');
const productsRouter = require('./product');
const cartRouter = require('./cart');
const authRouter = require('./auth');
const checkoutRouter = require('./checkout');
const orderRouter = require('./order');
const wishlistRouter = require('./wishlist');
const meRouter = require('./me');
const sellerRouter = require('./seller');
const adminRouter = require('./admin');

function route(app) {
    app.use('/products', productsRouter);
    app.use('/cart', cartRouter);
    app.use('/auth', authRouter);
    app.use('/checkout', checkoutRouter);
    app.use('/orders', orderRouter);
    app.use('/wishlist', wishlistRouter);
    app.use('/me', meRouter);
    app.use('/seller', sellerRouter);
    app.use('/admin', adminRouter);
    app.use('/', siteRouter);
}

module.exports = route;