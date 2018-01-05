const AESUtil = require('../utils/AESUtil')

exports.index = (req, res) => {
    return res.render('index', {
        title: 'Hello IM'
    })
}