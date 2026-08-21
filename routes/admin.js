// routes/admin.js
const express = require('express');
const router = express.Router();
const reportController = require('../app/controllers/ReportController');
const siteSettingController = require('../app/controllers/SiteSettingController');
const contactController = require('../app/controllers/AdminContactController');
const uploadSiteVideo = require('../app/middlewares/uploadsitevideo');
const { requireAdmin } = require('../app/middlewares/auth');

router.use(requireAdmin);

router.get('/reports', reportController.index);
router.post('/reports/:id/takedown', reportController.takedown);
router.post('/reports/:id/dismiss', reportController.dismiss);

router.get('/settings', siteSettingController.edit);
router.post('/settings/video', uploadSiteVideo.single('introVideo'), siteSettingController.uploadIntroVideo);

router.get('/contacts', contactController.index);
router.post('/contacts/:id/reply', contactController.reply);

module.exports = router;