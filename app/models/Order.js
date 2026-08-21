const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItem = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true }
}, { _id: false });

const Order = new Schema({
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItem],
    subtotal: { type: Number, required: true, default: 0 },
    voucherCode: { type: String },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shippingName: { type: String, required: true },
    shippingPhone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    paymentMethod: { type: String, default: 'COD' },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', Order);