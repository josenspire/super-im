const mongoose = require('mongoose');
const ContactSchema = require('../schemas/contact.server.schema');
const Contact = mongoose.model('Contact', ContactSchema);

module.exports = Contact;