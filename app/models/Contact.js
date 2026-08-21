// app/models/Contact.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Contact = new Schema({
    fullname: { type: String, required: true, maxLength: 255 },
    email: { type: String, required: true, maxLength: 255 },
    message: { type: String, required: true, maxLength: 2000 },
    status: { type: String, enum: ['new', 'resolved'], default: 'new' },
    adminReply: { type: String, maxLength: 2000, default: null },
    repliedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', Contact);