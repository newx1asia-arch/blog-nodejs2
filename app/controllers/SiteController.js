// app/controllers/SiteController.js
const Product = require('../models/Product');
const Contact = require('../models/Contact');
const SiteSetting = require('../models/SiteSetting');
const Voucher = require('../models/Voucher');
const categories = require('../../config/db/categories');

const PAGE_SIZE = 12;

class SiteController {
    async index(req, res, next) {
        try {
            const [flashSaleProducts, suggestedProducts, categoryResults, settings, siteVouchers] = await Promise.all([
                Product.find({ salePrice: { $exists: true, $ne: null, $gt: 0 } })
                    .sort({ createdAt: -1 })
                    .allowDiskUse(true)
                    .limit(10)
                    .lean(),
                Product.find({}).sort({ createdAt: -1 }).allowDiskUse(true).limit(16).lean(),
                Promise.all(
                    categories.map(cat =>
                        Product.find({ category: cat.key })
                            .sort({ createdAt: -1 })
                            .allowDiskUse(true)
                            .limit(4)
                            .lean()
                    )
                ),
                SiteSetting.getSettings(),
                // Voucher toàn sàn (không thuộc seller nào) -> hiển thị nổi bật trên trang chủ
                Voucher.find({ active: true, $or: [{ seller: null }, { seller: { $exists: false } }] })
                    .sort({ createdAt: -1 })
                    .limit(6)
                    .lean()
            ]);

            const categorySections = categories.map((cat, i) => ({
                key: cat.key,
                name: cat.name,
                products: categoryResults[i]
            }));

            res.render('home', {
                flashSaleProducts,
                suggestedProducts,
                categorySections,
                introVideo: settings.introVideo,
                siteVouchers
            });
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu trang chủ:", error);
            res.render('home', { flashSaleProducts: [], suggestedProducts: [], categorySections: [], siteVouchers: [] });
        }
    }

    about(req, res) {
        res.render('about');
    }

    contact(req, res) {
        res.render('contact', {
            success: req.session.contactSuccess || null,
            error: req.session.contactError || null
        });
        req.session.contactSuccess = null;
        req.session.contactError = null;
    }

    async submitContact(req, res, next) {
        try {
            const fullname = (req.body.fullname || '').trim();
            const email = (req.body.email || '').trim();
            const message = (req.body.message || '').trim();

            if (!fullname || !email || !message) {
                req.session.contactError = 'Vui lòng điền đầy đủ thông tin.';
                return res.redirect('/contact');
            }

            await Contact.create({ fullname, email, message });
            req.session.contactSuccess = 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.';
            res.redirect('/contact');
        } catch (error) {
            next(error);
        }
    }

    async search(req, res, next) {
        try {
            const keyword = req.query.q ? String(req.query.q).trim() : '';
            const category = req.query.category ? String(req.query.category).trim() : '';
            const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
            const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
            const sort = req.query.sort || 'newest';
            const page = Math.max(1, parseInt(req.query.page) || 1);

            const filter = {};
            if (keyword) filter.name = { $regex: keyword, $options: 'i' };
            if (category) filter.category = category;
            if (minPrice !== null || maxPrice !== null) {
                filter.price = {};
                if (minPrice !== null) filter.price.$gte = minPrice;
                if (maxPrice !== null) filter.price.$lte = maxPrice;
            }

            let sortOption = { createdAt: -1 };
            if (sort === 'price-asc') sortOption = { price: 1 };
            if (sort === 'price-desc') sortOption = { price: -1 };
            if (sort === 'best-selling') sortOption = { sold: -1 };
            if (sort === 'rating') sortOption = { ratingAvg: -1 };

            const total = await Product.countDocuments(filter);
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            const currentPage = Math.min(page, totalPages);

            const products = await Product.find(filter)
                .sort(sortOption)
                .allowDiskUse(true) // Product lưu ảnh base64 trong document nên có thể rất nặng;
                                     // cho phép Mongo sort tạm trên đĩa để tránh lỗi "Sort exceeded memory limit"
                .skip((currentPage - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .lean();

            const baseQuery = { ...req.query };
            delete baseQuery.page;
            const queryString = new URLSearchParams(baseQuery).toString();

            res.render('search', {
                products,
                categories,
                keyword,
                category,
                minPrice: req.query.minPrice || '',
                maxPrice: req.query.maxPrice || '',
                sort,
                total,
                currentPage,
                totalPages,
                queryString,
                hasPrev: currentPage > 1,
                hasNext: currentPage < totalPages,
                prevPage: currentPage - 1,
                nextPage: currentPage + 1,
                pages: Array.from({ length: totalPages }, (_, i) => i + 1)
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SiteController();
