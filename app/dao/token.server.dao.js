

const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')
const TokenModel = require('../models/token.server.model')

exports.checkTokenExpires = (token, cb) => {
    let result = { data: {}, message: '' };
    TokenModel.findOne({ token: token }, (err, token) => {
        if (err) {
            result.status = CodeConstants.SERVER_UNKNOW_ERROR;
            result.message = 'Sorry, server unknow error';
        } else if (!token) {
            result.status = CodeConstants.FAIL;
            result.message = 'This token is no exist';
        } else if (token) {
            if (DateUtils.compareISODate(token.loginTime, DateUtils.formatCommonUTCDate(Date.now()))) {
                result.status = CodeConstants.SUCCESS;
                result.data = token;
                result.message = 'Token is effective';
            } else {
                result.status = CodeConstants.FAIL;
                result.message = 'Token is expired';
            }
        }
        cb(result)
    })
}

exports.tokenMethods = {
    insertToken: tokenModel => {
        return new Promise((resolve, reject) => {
            tokenModel.save((err, data) => {
                if (err) {
                    console.log('--[CREATE TOKEN FAIL]--', err)
                    reject(err)
                } else {
                    resolve(data);
                }
            })
        })
    },

    updateToken: (_id, uuid) => {
        return new Promise((resolve, reject) => {
            let opts = { loginTime: DateUtils.formatCommonUTCDate(Date.now()), token: uuid };
            TokenModel.findByIdAndUpdate(_id, { $set: opts })
                .exec(err => {
                    if (err) {
                        console.log('--[UPDATE TOKEN ERROR]--', err.message);
                        reject(err)
                    } else {
                        resolve(uuid)
                    }
                })
        })
    }
}
