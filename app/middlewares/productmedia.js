// app/middlewares/productmedia.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const VIDEO_DIR = path.join(__dirname, '../../public/uploads/videos');
const TMP_IMAGE_DIR = path.join(__dirname, '../../tmp-uploads');

[VIDEO_DIR, TMP_IMAGE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, file.fieldname === 'video' ? VIDEO_DIR : TMP_IMAGE_DIR);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const VIDEO_TYPES = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'video/x-msvideo', 'video/x-matroska', 'video/3gpp', 'video/mpeg',
    'application/octet-stream'
];
const VIDEO_EXTS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.avi', '.mkv', '.3gp', '.mpeg', '.mpg'];

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === 'video') {
        const ok = VIDEO_TYPES.includes(file.mimetype) || VIDEO_EXTS.includes(ext);
        return cb(ok ? null : new Error('Chỉ chấp nhận video (mp4, webm, ogg, mov, avi, mkv...)'), ok);
    }

    const ok = IMAGE_TYPES.includes(file.mimetype) || IMAGE_EXTS.includes(ext);
    return cb(ok ? null : new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'), ok);
}

// Khai báo rõ limits.files / limits.fields để tránh lỗi "Unexpected field" / rớt request
// ngẫu nhiên khi form gửi kèm nhiều field text khác cùng lúc với file.
const uploadproductmedia = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 150 * 1024 * 1024, // 150MB/file — khớp với thông báo hiển thị trên form
        files: 6,                    // tối đa 5 ảnh + 1 video
        fields: 20
    }
}).fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
]);

function imagesToDataUris(files) {
    if (!files || !files.length) return [];
    return files.map(file => {
        const buffer = fs.readFileSync(file.path);
        const dataUri = `data:${file.mimetype};base64,${buffer.toString('base64')}`;
        fs.unlink(file.path, () => {});
        return dataUri;
    });
}

function videoToPublicPath(files) {
    if (!files || !files.length) return null;
    return `/uploads/videos/${files[0].filename}`;
}

module.exports = { uploadProductMedia: uploadproductmedia, imagesToDataUris, videoToPublicPath };