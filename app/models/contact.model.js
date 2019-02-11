const mongoose = require('mongoose');
const ContactSchema = require('../schemas/contact.schema');

module.exports = mongoose.model('Contact', ContactSchema);