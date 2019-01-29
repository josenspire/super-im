const AESUtil = require('../utils/AESHelper')

exports.index = (req, res) => {
    return res.render('index', {
        title: 'Hello IM'
    })
}