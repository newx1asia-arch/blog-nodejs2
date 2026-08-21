const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Report = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
        type: String,
        enum: ['fake', 'prohibited', 'spam', 'copyright', 'other'],
        default: 'other'
    },
    note: { type: String, maxLength: 500 },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Mỗi người chỉ tố cáo 1 sản phẩm 1 lần (gửi lại sẽ update report cũ thay vì tạo trùng)
Report.index({ product: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('Report', Report);