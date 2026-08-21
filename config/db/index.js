const mongoose = require('mongoose');

async function connect() {
    try {
        // Kiểm tra xem biến môi trường đã nạp chưa
        if (!process.env.MONGODB_URI) {
            throw new Error('❌ Chưa cấu hình MONGODB_URI trong file .env!');
        }

        // Bổ sung options giúp ổn định kết nối và xử lý lỗi DNS SRV
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4,               // Ép ưu tiên IPv4 để khắc phục lỗi querySrv ECONNREFUSED
            serverSelectionTimeoutMS: 5000, // Giới hạn thời gian chờ kết nối là 5 giây (thay vì treo 10s)
        });

        console.log('✅ Kết nối Database thành công!');
    } catch (error) {
        console.log('❌ Kết nối Database thất bại!');
        console.log(error.message || error);
    }
}

module.exports = { connect };