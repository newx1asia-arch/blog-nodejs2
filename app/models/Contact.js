const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Contact = new Schema({
    fullname: { type: String, required: true, maxLength: 255 },
    email: { type: String, required: true, maxLength: 255 },
    message: { type: String, required: true, maxLength: 2000 },
    status: { type: String, enum: ['new', 'resolved'], default: 'new' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', Contact);