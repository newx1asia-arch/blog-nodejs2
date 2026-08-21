const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Product = new Schema({
    name: { type: String, required: true, maxLength: 255 },
    description: { type: String, maxLength: 2000 },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    category: { type: String, maxLength: 100 },
    stock: { type: Number, default: 0 },
    img: { type: String }, // có thể là đường dẫn cũ (/uploads/...) hoặc data URI base64 mới
    images: [{ type: String }],
    video: { type: String, default: null }, // đường dẫn public tới video giới thiệu sản phẩm, VD: /uploads/videos/xxx.mp4
    sold: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    slug: { type: String, maxLength: 255, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', Product);