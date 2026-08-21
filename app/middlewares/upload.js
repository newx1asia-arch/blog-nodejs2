const multer = require('multer');

function fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'));
    }
}

// Dùng memoryStorage thay vì diskStorage: ảnh được giữ tạm trong RAM (req.files[].buffer)
// rồi ProductController sẽ chuyển thành base64 và lưu thẳng vào MongoDB.
// => Ảnh sản phẩm không còn phụ thuộc ổ đĩa của server, không bị mất khi
//    server khởi động lại / redeploy (đặc biệt quan trọng với hosting có ổ đĩa tạm).
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 1.5 * 1024 * 1024 } // 1.5MB/ảnh, tối đa 5 ảnh -> tổng vẫn nằm dưới giới hạn 16MB/document của Mongo
});

module.exports = upload;