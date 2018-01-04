const UserDao = require('../dao/user.server.dao')
const CodeConstants = require('../utils/CodeConstants')

let IMProxie = require('../api/proxies/rongCloud.server.proxies')
let QiniuProxie = require('../api/proxies/qiniu.server.proxies')

const uuidv4 = require('uuid/v4');
const mongoose = require('mongoose')

const CONTACT_OPERATION_REQUEST = 'Request';
const CONTACT_OPERATION_ACCEPT = 'Accept';
const CONTACT_OPERATION_REJECT = 'Reject';
const CONTACT_OPERATION_DELETE = "Delete";

// create user
exports.createUser = (user, cb) => {
    let userID = mongoose.Types.ObjectId();
    IMProxie.createUser(userID, user.nickname, null, response => {
        if (!response.error) {
            user._id = userID;
            UserDao.createUser(user, response.data, createCallback => {
                cb(createCallback)
            })
        } else {
            console.log('---[IM CRETEUSER FAIL]---', response.error)
            cb({
                status: CodeConstants.FAIL,
                data: {},
                message: response.error
            })
        }
    })

}

// user login
exports.queryUserByTelephoneAndPassword = (telephone, password, deviceID, cb) => {
    UserDao.queryUserByTelephoneAndPassword(telephone, password, _user => {
        if (_user.status === CodeConstants.SUCCESS) {
            if (_user.data.user.deviceID != deviceID) {
                _user.data.user = {};
                _user.data.verifyTelephone = true;
            } else {
                _user.data.verifyTelephone = false;
            }
        }
        cb(_user)
    })
}

// user login
exports.queryUserWithoutVerify = (telephone, password, cb) => {
    UserDao.queryUserByTelephoneAndPassword(telephone, password, _user => {
        cb(_user)
    })
}

exports.isTokenValid = (token, cb) => {
    UserDao.isTokenValid(token, callback => {
        cb(callback);
    })
}

exports.isTelephoneExist = (telephone, cb) => {
    UserDao.isTelephoneExist(telephone, isExist => {
        cb(isExist)
    })
}

// reset user's password
exports.resetPassword = (telephone, cb) => {
    UserDao.resetPassword(telephone, newpwd, _result => {
        cb(_result)
    })
}

exports.updateDeviceID = (telephone, password, deviceID, cb) => {
    UserDao.updateDeviceID(telephone, password, deviceID, callback => {
        cb(callback)
    })
}

exports.getUserProfile = (userID, cb) => {
    UserDao.queryByUserID(userID, callback => {
        cb(callback)
    })
}

exports.uploadAvatar = (telephone, cb) => {
    let fileName = telephone + '-' + uuidv4() + '.jpg';
    QiniuProxie.uploadAvatar(fileName, '/avatar/avatar.jpg')
        .then(result => {
            cb(result);
        })
        .catch(err => {
            cb(err);
        })
}

/** User Contacts Part */

exports.requestAddContact = (userID, contactID, message, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: "" };
    if (userID.toString() === contactID) {
        result.message = 'You can\'t add yourself to a contact';
        return cb(result);
    }
    UserDao.queryByUserID(contactID, async user => {
        if (user.status === CodeConstants.SUCCESS) {
            let isContact = await UserDao.checkContactIsExistByUserIDAndContactID(userID, contactID);
            if (isContact) {
                result.message = "This user is already your contact";
                cb(result);
            } else {
                IMProxie.sendContactNotification(userID, contactID, message, CONTACT_OPERATION_REQUEST, (err, _result) => {
                    if (err) { result.message = err; }
                    else { result.status = CodeConstants.SUCCESS; }
                    cb(result);
                })
            }
        } else {
            cb(user);
        }
    })
}

exports.acceptAddContact = (userID, contactID, remarkName, cb) => {
    UserDao.acceptAddContact(userID, contactID, remarkName || '', result => {
        if (result.status === CodeConstants.SUCCESS) {
            try {
                const message = "You've added him to be a contact";
                IMProxie.sendContactNotification(userID, contactID, message, CONTACT_OPERATION_ACCEPT);
            } catch (err) {
                result.status = CodeConstants.FAIL;
                result.data = {};
                result.message = err;
            }
        }
        cb(result)
    });
}

exports.rejectAddContact = (userID, rejectUserID, rejectReason, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: "" };

    UserDao.queryByUserID(rejectUserID, async user => {
        if (user.status === CodeConstants.SUCCESS) {
            let isContact = await UserDao.checkContactIsExistByUserIDAndContactID(userID, rejectUserID);
            if (isContact) {
                result.message = "Error operating, this user is already your contact";
                return cb(result);
            }
            IMProxie.sendContactNotification(userID, rejectUserID, rejectReason, CONTACT_OPERATION_REJECT);
            cb({
                status: CodeConstants.SUCCESS,
                data: {},
                message: ""
            })
        } else {
            cb(user);
        }
    })
}

exports.deleteContact = (userID, contactID, cb) => {
    UserDao.deleteContact(userID, contactID, result => {
        IMProxie.sendContactNotification(userID, contactID, "", CONTACT_OPERATION_DELETE);
        cb(result);
    });
}

exports.updateRemarkName = (userID, contactID, remarkName, cb) => {
    UserDao.updateRemarkName(userID, contactID, remarkName, updateResult => {
        cb(updateResult);
    })
}

exports.getUserContacts = (userID, cb) => {
    UserDao.queryUserContactsByUserID(userID, userList => {
        cb(userList);
    })
}

exports.searchUserByTelephoneOrNickname = (queryCondition, pageIndex, cb) => {
    UserDao.searchUserByTelephoneOrNickname(queryCondition, pageIndex, searchResult => {
        cb(searchResult);
    })
}

exports.getBlackList = (telephone, cb) => {
    // TODO
    cb([])
}