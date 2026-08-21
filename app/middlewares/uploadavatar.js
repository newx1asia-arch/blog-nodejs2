const multer = require('multer');

function fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp)'));
    }
}

// memoryStorage: avatar được lưu base64 thẳng vào MongoDB (xem MeController.updateAvatar)
// thay vì ghi ra ổ đĩa, tránh bị mất khi server khởi động lại.
const uploadAvatar = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

module.exports = uploadAvatar;