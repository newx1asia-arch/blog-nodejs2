require('dotenv').config();

const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');

const route = require('../routes');
const db = require('../config/db');
const Cart = require('../app/models/Cart');
const Wishlist = require('../app/models/Wishlist');
const categories = require('../config/db/categories');

const app = express();
const port = process.env.PORT || 3000;

// Connect to Database
db.connect();

// Static Files & Parsing Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session Config
app.use(session({
    secret: process.env.SESSION_SECRET || 'shopvn-secret-key-doi-lai-trong-production',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Global Variables Middlewares (res.locals)
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId
        ? {
            id: req.session.userId,
            name: req.session.userName,
            avatar: req.session.userAvatar || null,
            role: req.session.userRole || 'user'
        }
        : null;
    next();
});

app.use((req, res, next) => {
    res.locals.categories = categories;
    next();
});

app.use(async (req, res, next) => {
    try {
        if (req.session.cartId) {
            const cart = await Cart.findById(req.session.cartId);
            res.locals.cartCount = cart ? cart.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
        } else {
            res.locals.cartCount = 0;
        }
    } catch (error) {
        res.locals.cartCount = 0;
    }
    next();
});

app.use(async (req, res, next) => {
    try {
        if (req.session.userId) {
            const wishlist = await Wishlist.findOne({ user: req.session.userId }).lean();
            res.locals.wishlistIds = wishlist ? wishlist.products.map(id => id.toString()) : [];
        } else {
            res.locals.wishlistIds = [];
        }
    } catch (error) {
        res.locals.wishlistIds = [];
    }
    next();
});

// View Engine (Handlebars) Config
app.engine('hbs', engine({
    extname: '.hbs',
    helpers: {
        dateFormat: (date) => {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        },
        eq: function (a, b, options) {
            if (a === b) return options.fn(this);
            return options.inverse(this);
        },
        sum: (a, b) => a + b,
        multiply: (a, b) => a * b,
        renderStars: (rating) => {
            const r = Math.round(rating || 0);
            let html = '';
            for (let i = 1; i <= 5; i++) {
                html += i <= r ? '<ion-icon name="star"></ion-icon>' : '<ion-icon name="star-outline"></ion-icon>';
            }
            return html;
        },
        join: (arr) => Array.isArray(arr) ? arr.join('\n') : '',
        discountPercent: (price, salePrice) => {
            if (!price || !salePrice || salePrice >= price) return 0;
            return Math.round(((price - salePrice) / price) * 100);
        },
        statusClass: (status) => `status-${status || 'pending'}`,
        formatPrice: (value) => {
            const num = Number(value) || 0;
            return new Intl.NumberFormat('vi-VN').format(num);
        },
        avatarPlaceholder: () =>
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%23CBD5E1'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%23fff'/%3E%3Cpath d='M6 36c0-8 6-13 14-13s14 5 14 13' fill='%23fff'/%3E%3C/svg%3E",
        formatCount: (num) => {
            const n = Number(num) || 0;
            if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'tr';
            if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            return String(n);
        },
        currentYear: () => new Date().getFullYear(),
        inArray: (arr, val) => Array.isArray(arr) && arr.map(String).includes(String(val)),
        defaultVal: (a, b) => (a !== undefined && a !== null && a !== '') ? a : b
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Initialize Routes
route(app);

// Start Server
app.listen(port, () => {
    console.log(`\n🚀 Server đang chạy thành công tại: http://localhost:${port}`);
});