const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Chỉ có đúng 1 document duy nhất trong collection này (singleton) — dùng key cố định để tìm/update
const SiteSetting = new Schema({
    key: { type: String, default: 'main', unique: true },
    introVideo: { type: String, default: null }, // đường dẫn public, VD: /uploads/site/intro.mp4
    updatedAt: { type: Date, default: Date.now }
});

SiteSetting.statics.getSettings = async function () {
    let settings = await this.findOne({ key: 'main' });
    if (!settings) {
        settings = await this.create({ key: 'main' });
    }
    return settings;
};

module.exports = mongoose.model('SiteSetting', SiteSetting);