const Order = require('../models/Order');
const Voucher = require('../models/Voucher');
const Product = require('../models/Product');
const { getOrCreateCart } = require('../services/cartService');

class CheckoutController {
    // [GET] /checkout
    async show(req, res, next) {
        try {
            const cart = await getOrCreateCart(req);
            await cart.populate('items.product');
            const cartData = cart.toObject();

            const items = cartData.items
                .filter(i => i.product)
                .map(i => {
                    const price = i.product.salePrice || i.product.price;
                    return {
                        product: i.product,
                        quantity: i.quantity,
                        subtotal: price * i.quantity
                    };
                });

            if (items.length === 0) {
                return res.redirect('/cart');
            }

            const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

            let discount = 0;
            let voucherError = req.session.voucherError || null;
            req.session.voucherError = null;

            if (req.session.voucherCode) {
                const voucher = await Voucher.findOne({ code: req.session.voucherCode });
                if (voucher) {
                    const check = voucher.isValid(subtotal);
                    if (check.ok) {
                        discount = voucher.calcDiscount(subtotal);
                    } else {
                        voucherError = check.message;
                        req.session.voucherCode = null;
                    }
                } else {
                    req.session.voucherCode = null;
                }
            }

            const total = Math.max(0, subtotal - discount);

            res.render('checkout', {
                items,
                subtotal,
                discount,
                total,
                voucherCode: req.session.voucherCode || '',
                voucherError
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /checkout/apply-voucher
    async applyVoucher(req, res, next) {
        try {
            const code = (req.body.voucherCode || '').trim().toUpperCase();

            if (!code) {
                req.session.voucherCode = null;
                return res.redirect('/checkout');
            }

            const cart = await getOrCreateCart(req);
            await cart.populate('items.product');
            const subtotal = cart.items
                .filter(i => i.product)
                .reduce((sum, i) => {
                    const price = i.product.salePrice || i.product.price;
                    return sum + price * i.quantity;
                }, 0);

            const voucher = await Voucher.findOne({ code });
            if (!voucher) {
                req.session.voucherCode = null;
                req.session.voucherError = 'Mã giảm giá không tồn tại.';
                return res.redirect('/checkout');
            }

            const check = voucher.isValid(subtotal);
            if (!check.ok) {
                req.session.voucherCode = null;
                req.session.voucherError = check.message;
                return res.redirect('/checkout');
            }

            req.session.voucherCode = code;
            req.session.voucherError = null;
            res.redirect('/checkout');
        } catch (error) {
            next(error);
        }
    }

    // [POST] /checkout
    async placeOrder(req, res, next) {
        try {
            const { shippingName, shippingPhone, shippingAddress, paymentMethod } = req.body;

            if (!shippingName || !shippingPhone || !shippingAddress) {
                return res.status(400).send('<h1>Lỗi: Vui lòng điền đầy đủ thông tin giao hàng</h1><a href="/checkout">Quay lại</a>');
            }

            const cart = await getOrCreateCart(req);
            await cart.populate('items.product');
            const cartData = cart.toObject();

            const validItems = cartData.items.filter(i => i.product);
            if (validItems.length === 0) {
                return res.redirect('/cart');
            }

            // Kiểm tra tồn kho trước khi tạo đơn
            for (const i of validItems) {
                if (i.quantity > i.product.stock) {
                    return res.status(400).send(`<h1>Lỗi: "${i.product.name}" không đủ hàng tồn kho</h1><a href="/cart">Quay lại giỏ hàng</a>`);
                }
            }

            const orderItems = validItems.map(i => {
                const price = i.product.salePrice || i.product.price;
                return {
                    product: i.product._id,
                    name: i.product.name,
                    price,
                    quantity: i.quantity,
                    subtotal: price * i.quantity
                };
            });

            const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

            let discount = 0;
            let voucherCode = null;
            if (req.session.voucherCode) {
                const voucher = await Voucher.findOne({ code: req.session.voucherCode });
                if (voucher) {
                    const check = voucher.isValid(subtotal);
                    if (check.ok) {
                        discount = voucher.calcDiscount(subtotal);
                        voucherCode = voucher.code;
                        voucher.usedCount += 1;
                        await voucher.save();
                    }
                }
            }

            const total = Math.max(0, subtotal - discount);

            const order = await Order.create({
                buyer: req.session.userId,
                items: orderItems,
                subtotal,
                voucherCode,
                discount,
                total,
                shippingName: shippingName.trim(),
                shippingPhone: shippingPhone.trim(),
                shippingAddress: shippingAddress.trim(),
                paymentMethod: paymentMethod || 'COD',
                status: 'pending'
            });

            // Trừ tồn kho + cộng số lượng đã bán
            for (const i of validItems) {
                await Product.updateOne(
                    { _id: i.product._id },
                    { $inc: { stock: -i.quantity, sold: i.quantity } }
                );
            }

            // Dọn giỏ hàng + voucher đã dùng
            cart.items = [];
            cart.updatedAt = Date.now();
            await cart.save();
            req.session.voucherCode = null;

            res.redirect(`/orders/${order._id}`);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CheckoutController();