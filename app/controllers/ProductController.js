const Product = require('../models/Product');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Report = require('../models/Report');
const Voucher = require('../models/Voucher');
const categories = require('../../config/db/categories');
const { imagesToDataUris, videoToPublicPath } = require('../middlewares/productmedia');

function generateSlug(name) {
    return name
        .toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

class ProductController {
    show(req, res, next) {
        Product.findOne({ slug: req.params.slug })
            .populate('owner', 'name avatar createdAt')
            .lean()
            .then(async product => {
                if (!product) {
                    return res.status(404).send('<h1>404 - Sản phẩm không tồn tại</h1><a href="/">Quay về trang chủ</a>');
                }

                let ownerInfo = null;
                if (product.owner) {
                    if (typeof product.owner === 'object' && product.owner._id) {
                        ownerInfo = {
                            _id: product.owner._id.toString(),
                            name: product.owner.name || 'Người bán',
                            avatar: product.owner.avatar || null
                        };
                    } else {
                        ownerInfo = { _id: product.owner.toString(), name: 'Người bán', avatar: null };
                    }
                }
                product.owner = ownerInfo;

                const [reviews, relatedProducts, wishlist, myReport] = await Promise.all([
                    Review.find({ product: product._id })
                        .sort({ createdAt: -1 })
                        .populate('user', 'avatar')
                        .lean(),
                    product.category
                        ? Product.find({ category: product.category, _id: { $ne: product._id } })
                            .sort({ createdAt: -1 }).limit(4).lean()
                        : [],
                    req.session.userId ? Wishlist.findOne({ user: req.session.userId }).lean() : null,
                    req.session.userId ? Report.findOne({ product: product._id, reporter: req.session.userId }).lean() : null
                ]);

                const normalizedReviews = reviews.map(r => ({
                    ...r,
                    userAvatar: (r.user && r.user.avatar) ? r.user.avatar : (r.userAvatar || null)
                }));

                const images = (product.images && product.images.length) ? product.images : [product.img || '/img/pattern.png'];
                const hasReviewed = req.session.userId
                    ? reviews.some(r => r.user && r.user._id ? r.user._id.toString() === req.session.userId : String(r.user) === String(req.session.userId))
                    : false;
                const isWishlisted = wishlist
                    ? wishlist.products.some(p => p.toString() === product._id.toString())
                    : false;
                const isOwner = req.session.userId && ownerInfo && ownerInfo._id === req.session.userId;

                res.render('products/detail', {
                    product,
                    reviews: normalizedReviews,
                    images,
                    hasReviewed,
                    relatedProducts,
                    isWishlisted,
                    isOwner,
                    alreadyReported: !!myReport
                });
            })
            .catch(error => {
                console.error("Lỗi khi tải chi tiết sản phẩm:", error);
                next(error);
            });
    }

    // [GET] /products/create — nạp thêm danh sách voucher của seller để hiển thị/tạo ngay tại đây
    async create(req, res, next) {
        try {
            const myVouchers = await Voucher.find({ seller: req.session.userId })
                .sort({ createdAt: -1 })
                .lean();

            res.render('products/create', {
                categories,
                myVouchers,
                voucherSuccess: req.session.voucherSuccess || null,
                voucherError: req.session.voucherFormError || null
            });
            req.session.voucherSuccess = null;
            req.session.voucherFormError = null;
        } catch (error) {
            next(error);
        }
    }

    async store(req, res, next) {
        try {
            const name = req.body.name ? req.body.name.trim() : '';
            if (!name) {
                return res.status(400).send('<h1>Lỗi: Tên sản phẩm không được để trống</h1><a href="/products/create">Quay lại</a>');
            }
            if (!req.body.price || Number(req.body.price) < 0) {
                return res.status(400).send('<h1>Lỗi: Giá sản phẩm không hợp lệ</h1><a href="/products/create">Quay lại</a>');
            }

            let slug = req.body.slug ? req.body.slug.trim() : generateSlug(name);
            slug = `${slug}-${Date.now().toString().slice(-5)}`;

            const images = imagesToDataUris(req.files && req.files.images);
            const video = videoToPublicPath(req.files && req.files.video);

            const dataToSave = {
                ...req.body,
                name,
                slug,
                images,
                img: images[0] || '/img/pattern.png',
                video,
                owner: req.session.userId
            };

            await Product.create(dataToSave);
            res.redirect('/');
        } catch (error) {
            console.error("Lỗi khi tạo sản phẩm:", error);
            next(error);
        }
    }

    // [GET] /products/:id/edit — cũng nạp voucher để tiện quản lý luôn khi sửa sản phẩm
    async edit(req, res, next) {
        try {
            const product = await Product.findById(req.params.id).lean();
            if (!product) {
                return res.status(404).send('<h1>404 - Sản phẩm không tồn tại</h1><a href="/">Quay về trang chủ</a>');
            }
            if (product.owner && product.owner.toString() !== req.session.userId) {
                return res.status(403).send('<h1>403 - Bạn không có quyền sửa sản phẩm này</h1><a href="/">Quay về trang chủ</a>');
            }

            const myVouchers = await Voucher.find({ seller: req.session.userId })
                .sort({ createdAt: -1 })
                .lean();

            res.render('products/edit', {
                product,
                categories,
                myVouchers,
                voucherSuccess: req.session.voucherSuccess || null,
                voucherError: req.session.voucherFormError || null
            });
            req.session.voucherSuccess = null;
            req.session.voucherFormError = null;
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).send('<h1>404 - Sản phẩm không tồn tại</h1><a href="/">Quay về trang chủ</a>');
            }
            if (product.owner && product.owner.toString() !== req.session.userId) {
                return res.status(403).send('<h1>403 - Bạn không có quyền sửa sản phẩm này</h1><a href="/">Quay về trang chủ</a>');
            }

            const dataToUpdate = { ...req.body, updatedAt: Date.now() };

            const newImages = imagesToDataUris(req.files && req.files.images);
            if (newImages.length > 0) {
                dataToUpdate.images = newImages;
                dataToUpdate.img = newImages[0];
            }

            const newVideo = videoToPublicPath(req.files && req.files.video);
            if (newVideo) {
                dataToUpdate.video = newVideo;
            } else {
                delete dataToUpdate.video;
            }

            if (req.body.name && !req.body.slug) {
                dataToUpdate.slug = `${generateSlug(req.body.name)}-${Date.now().toString().slice(-5)}`;
            }

            await Product.updateOne({ _id: req.params.id }, dataToUpdate);
            res.redirect('/');
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).send('<h1>404 - Sản phẩm không tồn tại</h1><a href="/">Quay về trang chủ</a>');
            }
            if (product.owner && product.owner.toString() !== req.session.userId) {
                return res.status(403).send('<h1>403 - Bạn không có quyền xóa sản phẩm này</h1><a href="/">Quay về trang chủ</a>');
            }
            await product.deleteOne();
            res.redirect(req.get('Referrer') || '/');
        } catch (error) {
            next(error);
        }
    }

    async mine(req, res, next) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const pageSize = 10;
            const filter = { owner: req.session.userId };

            const [products, total] = await Promise.all([
                Product.find(filter).sort({ createdAt: -1 })
                    .skip((page - 1) * pageSize).limit(pageSize).lean(),
                Product.countDocuments(filter)
            ]);

            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            res.render('me/my-products', {
                products: products || [],
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
}

module.exports = new ProductController();