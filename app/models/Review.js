const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Review = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxLength: 1000 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', Review);