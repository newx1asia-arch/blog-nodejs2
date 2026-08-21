require('dotenv').config();
const mongoose = require('mongoose');
const Voucher = require('../app/models/Voucher');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });

    const vouchers = [
        { code: 'SALE10', type: 'percent', value: 10, minOrder: 100000, maxDiscount: 50000, usageLimit: 100, active: true },
        { code: 'FREESHIP', type: 'fixed', value: 20000, minOrder: 0, usageLimit: 0, active: true }
    ];

    for (const v of vouchers) {
        await Voucher.findOneAndUpdate({ code: v.code }, v, { upsert: true, new: true });
    }

    console.log('✅ Đã tạo voucher mẫu: SALE10, FREESHIP');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });