const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    name: { type: String, required: true, maxLength: 255 },
    email: { type: String, required: true, unique: true, maxLength: 255 },
    password: {
        type: String,
        required: function () { return !this.googleId; }
    },
    googleId: { type: String, unique: true, sparse: true },
    phone: { type: String, maxLength: 20 },
    address: { type: String, maxLength: 500 },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // dùng để phân quyền trang /admin
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', User);