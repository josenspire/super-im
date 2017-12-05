import { Promise } from 'mongoose';
import { resolve } from 'url';
import { reject } from './C:/Users/yangja2/AppData/Local/Microsoft/TypeScript/2.6/node_modules/@types/bluebird';

const UserModel = require('../models/user.server.model')
const TokenModel = require('../models/token.server.model')
const FriendModel = require('../models/friend.server.model')

const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')
const JWT_SECRET = require('../utils/Constants')   // secret key

const jwt = require('jwt-simple')
const uuidv4 = require('uuid/v4');

const StringUtil = require('../utils/StringUtil')

exports.createUser = async (user, cb) => {
    let result = { data: {}, message: '' };

    user.userID = StringUtil.randomString(64);
    try {
        let userModel = new UserModel(user);
        let _user = await insertUser(userModel);
        let tokenModel = new TokenModel({ token: uuidv4(), user: _user._id });
        let _token = await insertToken(tokenModel);
        let _updateUser = await updateUserTokenByUserId(_user._id, _token._id);

        result.status = CodeConstants.SUCCESS;
        result.data.user = _updateUser;
        result.data.token = _token.token;
        result.data.secretKey = Constants.AES_SECRET;
        cb(result)
    } catch (err) {
        console.log(err)
        cb(err)
    }
}

exports.queryUserByTelephoneAndPassword = async (telephone, password, cb) => {
    let result = { data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let _user = convertUser(data.user);
            result.status = CodeConstants.SUCCESS;
            result.data.user = _user;
            result.data.token = await updateToken(data.user.token, uuidv4());
            result.data.secretKey = Constants.AES_SECRET;
        } else {
            result.status = CodeConstants.FAIL;
            result.message = 'Sorry, Your telephone or password is invalid';
        }
        cb(result)
    } catch (err) {
        console.log(err)
        cb(err)
    }
}

// check telephone is exist?
exports.isTelephoneExist = (telephone, cb) => {
    let result = { status: false, message: '' };
    UserModel.findOne({ telephone: telephone }, (err, user) => {
        if (err) {
            result.message = 'Sorry, server unknow error';
        } else if (user) {
            result.status = true;
            result.message = 'The telephone is already exist';
        } else {
            result.status = false;
            result.message = 'The telephone is not exist'
        }
        cb(result)
    })
}

exports.queryByTelephone = async (telephone, cb) => {
    try {
        let user = await queryByTelephone(telephone);
        cb(user)
    } catch (err) {
        console.log('--[QUERY BY TELEPHONE FAIL]--', err)
        cb(err)
    }
}

exports.queryUserListByTelephone = async (telephoneList, cb) => {
    let result = { data: {}, message: '' };
    let promiseList = telephoneList.map(telephone => {
        return queryByTelephone(telephone);
    })
    try {
        let userList = await Promise.all(promiseList);
        let newUserList = [];
        userList.forEach(user => {
            if (user.status === CodeConstants.SUCCESS) {
                newUserList.push(user.data.user)
            }
        })
        result.status = CodeConstants.SUCCESS;
        result.data.userList = newUserList;
        cb(result)
    } catch (err) {
        console.log('--[QUERY USERLIST FAIL]--', err)
        cb(err)
    }
}

// update deviceID 
exports.updateDeviceID = async (telephone, password, deviceID, cb) => {
    let result = { data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let token = data.user.token.token;
            let _user = await updateDeviceID(telephone, deviceID);
            result.data.user = convertUser(_user);
            result.data.secretKey = Constants.AES_SECRET;
            result.data.token = token;
            result.status = CodeConstants.SUCCESS;
        } else {
            result.status = CodeConstants.FAIL;
            result.message = 'Telephone or password is incorrect';
        }
    } catch (err) {
        console.log('--[UPDATE DEVICEID FAIL]--', err)
        status = CodeConstants.FAIL;
        message = err;
    }
    cb(result)
}

exports.autoLoginByTokenAuth = (token, cb) => {
    let result = { data: {}, message: '' };
    TokenModel.findOne({ token: token })
        .populate('user')
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (!token) {
                result.status = CodeConstants.FAIL;
                result.message = 'This token is invalid, please login again';
            } else if (token) {
                if (DateUtils.compareISODate(token.loginTime, DateUtils.formatCommonUTCDate(Date.now()))) {
                    let _user = convertUser(token.user);
                    result.status = CodeConstants.SUCCESS;
                    result.data.user = _user;
                    result.data.token = token.token;
                    result.data.secretKey = Constants.AES_SECRET;
                } else {
                    result.status = CodeConstants.FAIL;
                    result.message = 'This token is expired, please login again';
                }
            }
            cb(result)
        })
}

exports.isTokenValid = (token, cb) => {
    let result = { data: {}, message: '' };
    TokenModel.findOne({ token: token })
        .populate("user", "userID, telephone")
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (!token) {
                result.status = CodeConstants.FAIL;
                result.message = 'This token is invalid, please login again';
            } else if (token) {
                if (DateUtils.compareISODate(token.loginTime, DateUtils.formatCommonUTCDate(Date.now()))) {
                    result.status = CodeConstants.SUCCESS;
                    result.data.userID = token.user.userID;
                } else {
                    result.status = CodeConstants.FAIL;
                    result.message = 'This token is expired, please login again';
                }
            }
            cb(result)
        })
}

exports.resetTokenByToken = (token, cb) => {
    let result = { data: {}, message: '' };
    TokenModel.findOneAndUpdate({ token: token }, { $set: { token: '' } })
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (token) {
                result.status = CodeConstants.SUCCESS;
            } else {
                result.status = CodeConstants.FAIL;
                result.message = 'The token is invalid'
            }
            cb(result)
        })
}

exports.resetPassword = (telephone, newPassword, cb) => {
    let result = { data: {}, message: '' };
    let password = jwt.encode(newPassword, JWT_SECRET.JWT_PASSWORD_SECRET);
    UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { password: password } })
        .exec((err, user) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (user) {
                result.status = CodeConstants.SUCCESS;
            } else {
                result.status = CodeConstants.FAIL;
                result.message = 'This telephone is no exist'
            }
            cb(result)
        })
}


/** User Friend Part */
exports.addFriend = async (userID, friendID, remarkName, cb) => {
    let result = { data: {}, message: '' };
    try {
        let friendList = await addFriend(userID, friendID, remarkName);
        result.data = convertFriends(friendList);
        result.status = CodeConstants.SUCCESS;
    } catch (err) {
        console.log('---[ADD FRIEND FAIL]---', err)
        result.status = CodeConstants.FAIL;
        result.message = err;
    }
    cb(result)
}

exports.updateRemarkName = async (userID, friendID, remarkName, cb) => {
    let result = { data: {}, message: '' };
    try {
        let updateResult = await updateRemarkName(userID, friendID, remarkName);
        result.data = updateResult;
        result.status = CodeConstants.SUCCESS;
    } catch (err) {
        console.log('---[UPDATE FRIEND REMARK FAIL]---', err)
        result.status = CodeConstants.FAIL;
        result.messages = err;
    }
    cb(result);
}

exports.queryUserFriendsByUserID = async (userID, cb) => {
    let result = { data: {}, message: '' };
    try {
        let friends = await queryUserFriendsByUserID(userID);
        result.data = convertFriends(friends);
        result.status = CodeConstants.SUCCESS;
    } catch (err) {
        console.log('---[QUERY FRIENDS FAIL]---', err)
        result.status = CodeConstants.FAIL;
        result.messages = err;
    }
    cb(result)
}

/** User & Token Part */

var insertToken = tokenModel => {
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
}

var updateToken = (_id, uuid) => {
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

var updateDeviceID = (telephone, deviceID) => {
    return new Promise((resolve, reject) => {
        UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { deviceID: deviceID } }, (err, user) => {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                user.deviceID = deviceID;
            }
            resolve(user);
        })
    })
}

var insertUser = userModel => {
    return new Promise((resolve, reject) => {
        userModel.save((err, user) => {
            if (err) {
                console.log("[--CREATE USER FAIL--]", err);
                let message = '';
                let errMsg = err.errors;
                if (errMsg) {
                    if (errMsg.telephone || errMsg.password) {
                        message = errMsg.telephone ? errMsg.telephone.message : errMsg.password.message;
                    } else if (errMsg.nickname) {
                        message = errMsg.nickname.message;
                    }
                    // result.status = CodeConstants.FAIL;
                } else {
                    message = 'Sorry, server unknow error';
                }
                reject(message);
            } else {
                resolve(user);
            }
        });
    })
}

var queryByTelephone = telephone => {
    let result = { data: {}, message: '' };
    return new Promise((resolve, reject) => {
        UserModel.findOne({ telephone: telephone })
            // .populate("token")
            .exec((err, user) => {
                if (err) {
                    console.log(err)
                    result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                    result.message = 'Sorry, server unknow error';
                    result.status = CodeConstants.FAIL;
                    reject(err)
                } else if (user) {
                    result.status = CodeConstants.SUCCESS;
                    let _user = convertUser(user);
                    result.data.user = _user;
                    // result.data.token = user.token.token;
                } else {
                    result.status = CodeConstants.FAIL;
                    result.message = 'The telephone is not exist'
                }
                resolve(result)
            })
    })
}

var queryUserByTelephoneAndPassword = (telephone, password) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ telephone: telephone })
            .populate('token', 'token')
            .exec((err, user) => {
                if (err) {
                    console.log(err)
                    reject(err)
                } else if (!user) {
                    resolve('Sorry, Your telephone or password is invalid');
                } else {
                    user.comparePassword(password, isMatch => {
                        resolve(isMatch ? { user: user, isMatch: true } : { isMatch: false })
                    })
                }
            })
    })
}

var updateUserTokenByUserId = (userId, tokenId) => {
    return new Promise((resolve, reject) => {
        UserModel.findByIdAndUpdate(userId, { $set: { token: tokenId } })
            .exec((err, _user) => {
                if (err) {
                    console.log('--[UPDATE USER TOKEN FAIL]--', err);
                    reject(err);
                } else {
                    resolve(_user);
                }
            })
    })
}

/** User Friend Part */
var addFriend = (userID, friendID, remarkName) => {
    return new Promise((resolve, reject) => {
        FriendModel.findOneAndUpdate({ userID: userID }, {
            $push: {
                friends: {
                    userID: friendID,
                    remarkName: remarkName
                }
            }
        }, (err, result) => {
            if (err) {
                reject(err);
            } else if (!result) {
                saveFriend(userID, friendID, remarkName).then(friendList => {
                    resolve(friendList);
                }).catch(err => {
                    reject(err)
                });
            } else {
                resolve(result);
            }
        })
    })
}

/** init friend list */
var saveFriend = (userID, friendID, remarkName) => {
    return new Promise((resolve, reject) => {
        let friends = [];
        friends.push({ userID: friendID, remarkName: remarkName });
        let friendModel = new FriendModel({ userID: userID, friends: friends });
        friendModel.save((err, friendList) => {
            if (err) {
                reject(err)
                console.log('SAVE FRIEND FAIL', err)
            } else {
                resolve(friendList);
            }
        })
    })
}

var updateRemarkName = (userID, friendID, remarkName) => {
    return new Promise((resolve, reject) => {
        FriendModel.findOne({ userID: userID }, (err, friendList) => {
            if (err) {
                reject(err)
            } else if (friendList) {
                let friends = friendList.friends;
                for (let i = 0; i < friends.length; i++) {
                    if (friends[i].userID == friendID) {
                        friends[i].remarkName = remarkName;
                        friendList.markModified('remarkName');
                        friendList.save((err, newFriendProfile) => {
                            if (err) reject(err);
                            else resolve(newFriendProfile);
                        });
                    }
                }
            }
        })
    })
}

var queryUserFriendsByUserID = userID => {
    return new Promise((resolve, reject) => {
        FriendModel.findOne({ userID: userID })
            .populate("User")
            .exec((err, friends) => {
                if(err) {
                    reject(err);
                    console.log(err);
                } else if(!friends){
                    reject("UserID is not exist");
                } else {
                    resolve(friends);
                }
            })
    })
}


var convertUser = user => {
    let _user = JSON.parse(JSON.stringify(user));
    delete _user._id;
    delete _user.token;
    delete _user.meta;
    delete _user.password;
    delete _user.__v;
    return _user;
}

var convertFriends = friends => {
    let _friends = JSON.parse(JSON.stringify(friends));
    delete _friends._id;
    delete _friends.__v;
    delete _friends.meta;
    return _friends;
}