const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Voucher = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    // null = voucher toàn sàn (áp dụng mọi shop), có giá trị = voucher riêng của 1 shop
    seller: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now }
});

Voucher.methods.isValid = function (orderTotal) {
    if (!this.active) return { ok: false, message: 'Mã giảm giá không còn hiệu lực.' };
    if (this.expiresAt && this.expiresAt < new Date()) return { ok: false, message: 'Mã giảm giá đã hết hạn.' };
    if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) return { ok: false, message: 'Mã giảm giá đã hết lượt sử dụng.' };
    if (orderTotal < this.minOrder) {
        return { ok: false, message: `Đơn hàng tối thiểu ${this.minOrder.toLocaleString('vi-VN')}₫ để áp dụng mã này.` };
    }
    return { ok: true };
};

Voucher.methods.calcDiscount = function (orderTotal) {
    let discount = this.type === 'percent'
        ? Math.round(orderTotal * (this.value / 100))
        : this.value;
    if (this.type === 'percent' && this.maxDiscount) {
        discount = Math.min(discount, this.maxDiscount);
    }
    return Math.min(discount, orderTotal);
};

module.exports = mongoose.model('Voucher', Voucher);