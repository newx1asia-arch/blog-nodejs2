const User = require('../models/User');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const Follow = require('../models/Follow');

const PAGE_SIZE = 12;

class SellerController {
    // [GET] /seller — trang tổng hợp tất cả cửa hàng đang bán trên sàn
    async index(req, res, next) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);

            const pipeline = [
                { $match: { owner: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: '$owner',
                        productCount: { $sum: 1 },
                        totalSold: { $sum: { $ifNull: ['$sold', 0] } },
                        avgRating: { $avg: '$ratingAvg' }
                    }
                },
                { $sort: { productCount: -1 } }
            ];

            const allSellers = await Product.aggregate(pipeline);
            const total = allSellers.length;
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            const currentPage = Math.min(page, totalPages);
            const pageSlice = allSellers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

            const userIds = pageSlice.map(s => s._id);
            const [users, followerCounts] = await Promise.all([
                User.find({ _id: { $in: userIds } }).select('name avatar createdAt').lean(),
                Follow.aggregate([
                    { $match: { seller: { $in: userIds } } },
                    { $group: { _id: '$seller', count: { $sum: 1 } } }
                ])
            ]);

            const userMap = {};
            users.forEach(u => { userMap[u._id.toString()] = u; });
            const followerMap = {};
            followerCounts.forEach(f => { followerMap[f._id.toString()] = f.count; });

            const sellers = pageSlice
                .filter(s => userMap[s._id.toString()]) // bỏ owner đã bị xóa tài khoản
                .map(s => {
                    const user = userMap[s._id.toString()];
                    return {
                        _id: s._id,
                        name: user.name,
                        avatar: user.avatar || null,
                        createdAt: user.createdAt,
                        productCount: s.productCount,
                        totalSold: s.totalSold,
                        ratingAvg: s.avgRating ? +s.avgRating.toFixed(1) : 0,
                        followerCount: followerMap[s._id.toString()] || 0
                    };
                });

            res.render('seller/index', {
                sellers,
                currentPage,
                totalPages,
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

    // [GET] /seller/:id — trang cửa hàng (kiểu Shopee Mall)
    async show(req, res, next) {
        try {
            const sellerId = req.params.id;
            const seller = await User.findById(sellerId).lean();
            if (!seller) {
                return res.status(404).send('<h1>404 - Không tìm thấy cửa hàng</h1><a href="/">Quay về trang chủ</a>');
            }

            const page = Math.max(1, parseInt(req.query.page) || 1);
            const filter = { owner: sellerId };

            const [products, totalProducts, followerCount, followed, vouchers] = await Promise.all([
                Product.find(filter).sort({ createdAt: -1 })
                    .skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
                Product.countDocuments(filter),
                Follow.countDocuments({ seller: sellerId }),
                req.session.userId ? Follow.exists({ seller: sellerId, follower: req.session.userId }) : null,
                Voucher.find({
                    active: true,
                    $or: [{ seller: sellerId }, { seller: null }, { seller: { $exists: false } }]
                }).sort({ createdAt: -1 }).lean()
            ]);

            const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

            res.render('seller/show', {
                seller,
                products,
                totalProducts,
                followerCount,
                isFollowing: !!followed,
                isOwnSeller: !!(req.session.userId && String(req.session.userId) === String(sellerId)),
                vouchers,
                currentPage: page,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
                prevPage: page - 1,
                nextPage: page + 1,
                pages: Array.from({ length: totalPages }, (_, i) => i + 1)
            });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /seller/:id/follow
    async toggleFollow(req, res, next) {
        try {
            const sellerId = req.params.id;
            if (String(sellerId) === String(req.session.userId)) {
                return res.redirect(req.get('Referrer') || '/');
            }

            const existing = await Follow.findOne({ follower: req.session.userId, seller: sellerId });
            if (existing) {
                await existing.deleteOne();
            } else {
                await Follow.create({ follower: req.session.userId, seller: sellerId });
            }

            res.redirect(req.get('Referrer') || `/seller/${sellerId}`);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SellerController();