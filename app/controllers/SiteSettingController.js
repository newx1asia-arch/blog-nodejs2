const fs = require('fs');
const path = require('path');
const SiteSetting = require('../models/SiteSetting');

class SiteSettingController {
    // [GET] /admin/settings — trang quản lý video giới thiệu chung
    async edit(req, res, next) {
        try {
            const settings = await SiteSetting.getSettings();
            res.render('admin/settings', { settings });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /admin/settings/video
    async uploadIntroVideo(req, res, next) {
        try {
            if (!req.file) {
                return res.redirect('/admin/settings');
            }

            const settings = await SiteSetting.getSettings();

            // Xoá video cũ trên đĩa (nếu có) để tránh rác tích tụ theo thời gian
            if (settings.introVideo) {
                const oldPath = path.join(__dirname, '../../public', settings.introVideo);
                fs.unlink(oldPath, () => {});
            }

            settings.introVideo = `/uploads/site/${req.file.filename}`;
            settings.updatedAt = Date.now();
            await settings.save();

            res.redirect('/admin/settings');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SiteSettingController();