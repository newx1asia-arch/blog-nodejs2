const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItem = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
}, { _id: true });

const Cart = new Schema({
    sessionId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    items: [CartItem],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', Cart);