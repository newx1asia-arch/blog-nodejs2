const fs = require('fs');
const path = require('path');
const multer = require('multer');

const SITE_VIDEO_DIR = path.join(__dirname, '../../public/uploads/site');
if (!fs.existsSync(SITE_VIDEO_DIR)) fs.mkdirSync(SITE_VIDEO_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, SITE_VIDEO_DIR),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `intro-${unique}${path.extname(file.originalname)}`);
    }
});

function fileFilter(req, file, cb) {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Chỉ chấp nhận video (mp4, webm, ogg, mov)'), allowed.includes(file.mimetype));
}

const uploadsitevideo = multer({
    storage,
    fileFilter,
    limits: { fileSize: 150 * 1024 * 1024 } // 150MB cho video giới thiệu trang chủ
});

module.exports = uploadsitevideo;