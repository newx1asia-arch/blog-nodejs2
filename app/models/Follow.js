const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Follow = new Schema({
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Một người chỉ theo dõi 1 shop một lần
Follow.index({ follower: 1, seller: 1 }, { unique: true });

module.exports = mongoose.model('Follow', Follow);