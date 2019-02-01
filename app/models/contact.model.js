const mongoose = require('mongoose');
const ContactSchema = require('../schemas/contact.schema');
const Contact = mongoose.model('Contact', ContactSchema);

module.exports = Contact;