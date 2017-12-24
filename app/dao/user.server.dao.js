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

const _ = require('lodash')

let mongoose = require('mongoose')

exports.createUser = async (user, token, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    let tokenID = mongoose.Types.ObjectId();
    try {
        user.token = tokenID;
        let userModel = new UserModel(user);
        let _user = await insertUser(userModel);

        let tokenModel = new TokenModel({ _id: tokenID, token: token, user: user._id });
        let _token = await insertToken(tokenModel);

        // let _updateUser = await updateUserTokenByUserID(_user._id, _token._id);
        let initFriends = await initFriendList(user._id);

        result.status = CodeConstants.SUCCESS;
        result.data.user = convertUser(_user);
        result.data.token = _token.token;
        result.data.secretKey = Constants.AES_SECRET;
    } catch (err) {
        console.log(err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.queryUserByTelephoneAndPassword = async (telephone, password, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let _user = convertUser(data.user);
            await updateToken(data.user.token);
            result.data.token = data.user.token.token;
            result.data.user = _user;
            result.data.secretKey = Constants.AES_SECRET;
            result.status = CodeConstants.SUCCESS;
        } else {
            result.message = 'Sorry, Your telephone or password is invalid';
        }
    } catch (err) {
        console.log(err)
        result.message = err;
        result.data = {};
    }
    cb(result)
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

exports.queryByUserID = async (userID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let user = await queryByUserID(userID);
        if (!user) {
            result.message = 'This user is not exist'
        } else {
            result.data.userProfile = convertUserProfile(user);
            result.status = CodeConstants.SUCCESS;
        }
    } catch (err) {
        console.log('--[QUERY BY USERID FAIL]--', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.queryUserListByTelephone = async (telephoneList, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
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
    } catch (err) {
        console.log('--[QUERY USERLIST FAIL]--', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

// update deviceID 
exports.updateDeviceID = async (telephone, password, deviceID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let data = await queryUserByTelephoneAndPassword(telephone, password);
        if (data.isMatch) {
            let token = data.user.token.token;
            let _user = await updateDeviceID(telephone, deviceID);
            delete _user.deviceID;
            result.data.user = convertUser(_user);
            result.data.secretKey = Constants.AES_SECRET;
            result.data.token = token;
            result.status = CodeConstants.SUCCESS;
        } else {
            result.message = 'Telephone or password is incorrect';
        }
    } catch (err) {
        console.log('--[UPDATE DEVICEID FAIL]--', err)
        result.message = err;
        result.data = {};
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
                if (DateUtils.compareISODate(token.loginTime, DateUtils.formatCommonUTCDate(Date.now() - (1000 * 60 * 60 * 24)))) {
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
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    TokenModel.findOne({ token: token })
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (!token) {
                result.message = 'This token is invalid, please login again';
            } else if (token) {
                result.status = CodeConstants.SUCCESS;
                result.data.userID = token.user;
                // if (DateUtils.compareISODate(token.loginTime, DateUtils.formatCommonUTCDate(Date.now() - (1000 * 60 * 60 * 24)))) {
                //     result.status = CodeConstants.SUCCESS;
                //     result.data.userID = token.user;
                // } else {
                //     result.message = 'This token is expired, please login again';
                // }
            }
            cb(result)
        })
}

exports.resetTokenByToken = (token, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    TokenModel.findOneAndUpdate({ token: token }, { $set: { token: '' } })
        .exec((err, token) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (token) {
                result.status = CodeConstants.SUCCESS;
            } else {
                result.message = 'The token is invalid'
            }
            cb(result)
        })
}

exports.resetPassword = (telephone, newPassword, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    let password = jwt.encode(newPassword, JWT_SECRET.JWT_PASSWORD_SECRET);
    UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { password: password } })
        .exec((err, user) => {
            if (err) {
                result.status = CodeConstants.SERVER_UNKNOW_ERROR;
                result.message = 'Sorry, server unknow error';
            } else if (user) {
                result.status = CodeConstants.SUCCESS;
            } else {
                result.message = 'This telephone is no exist'
            }
            cb(result)
        })
}


/** User Friend Part */
exports.addFriend = async (userID, friendID, remarkName, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let isCurrentUser = checkFriendIDIsCurrentUserID(userID, friendID);
        if (isCurrentUser) {
            result.message = 'You can\'t add yourself to a friend';
        } else {
            let isUserExist = await queryByUserID(friendID);
            if (!isUserExist) {
                result.message = 'This user is not exist';
            } else {
                let isExist = await checkFriendIsExistByUserIDAndFriendID(userID, friendID);
                if (isExist) {
                    result.message = 'This user is already your friend';
                } else {
                    let friendList = await addFriend(userID, friendID, remarkName);
                    result.status = CodeConstants.SUCCESS;
                }
            }
        }
    } catch (err) {
        console.log('---[ADD FRIEND FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.deleteFriend = async (userID, friendID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let isCurrentUser = checkFriendIDIsCurrentUserID(userID, friendID);
        if (isCurrentUser) {
            result.message = 'You can\'t delete yourself as a friend';
        } else {
            let isUserExist = await queryByUserID(friendID);
            if (!isUserExist) {
                result.message = 'This user is not exist';
            } else {
                let isFriendExist = await checkFriendIsExistByUserIDAndFriendID(userID, friendID);
                if (!isFriendExist) {
                    result.message = 'This user is not your friend';
                } else {
                    let deleteResult = await deleteFriend(userID, friendID);
                    result.status = CodeConstants.SUCCESS;
                }
            }
        }
    } catch (err) {
        console.log('---[DELETE FRIEND FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.updateRemarkName = async (userID, friendID, remarkName, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let isCurrentUser = checkFriendIDIsCurrentUserID(userID, friendID);
        if (isCurrentUser) {
            result.message = 'You can\'t set yourself a remark name'
        } else {
            let isExist = await checkFriendIsExistByUserIDAndFriendID(userID, friendID);
            if (!isExist) {
                result.message = 'This user is not your friend';
            } else {
                let updateResult = await updateRemarkName(userID, friendID, remarkName);
                result.status = CodeConstants.SUCCESS;
            }
        }
    } catch (err) {
        console.log('---[UPDATE FRIEND REMARK FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result);
}

exports.queryUserFriendsByUserID = async (userID, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let friendsInfo = await queryUserFriendsByUserID(userID);
        if (!friendsInfo) {
            result.data.friends = [];
        } else {
            result.data.friends = convertFriends(friendsInfo);
            result.status = CodeConstants.SUCCESS;
        }
    } catch (err) {
        console.log('---[QUERY FRIENDS FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result)
}

exports.searchUserByTelephoneOrNickname = async (queryCondition, pageIndex, cb) => {
    let result = { status: CodeConstants.FAIL, data: {}, message: '' };
    try {
        let userList = await searchUserByTelephoneOrNickname(queryCondition, pageIndex);
        result.data.userList = convertSearchUserList(userList);
        result.status = CodeConstants.SUCCESS;
    } catch (err) {
        console.log('---[QUERY USER FAIL]---', err)
        result.message = err;
        result.data = {};
    }
    cb(result);
}

/** User & Token Part */

var insertToken = tokenModel => {
    return new Promise((resolve, reject) => {
        tokenModel.save((err, data) => {
            if (err) {
                console.log('--[CREATE TOKEN FAIL]--', err)
                reject('Server unknow error,login fail')
            } else {
                resolve(data);
            }
        })
    })
}

var updateToken = (_id) => {
    return new Promise((resolve, reject) => {
        let opts = { loginTime: DateUtils.formatCommonUTCDate(Date.now()) };
        TokenModel.findByIdAndUpdate(_id, { $set: opts })
            .exec(err => {
                if (err) {
                    console.log('--[UPDATE TOKEN ERROR]--', err.message);
                    reject('Server unknow error, login fail')
                } else {
                    resolve()
                }
            })
    })
}

var updateDeviceID = (telephone, deviceID) => {
    return new Promise((resolve, reject) => {
        UserModel.findOneAndUpdate({ telephone: telephone }, { $set: { deviceID: deviceID } }, (err, user) => {
            if (err) {
                console.log(err)
                reject('Server unknow error, login fail')
            } else {
                user.deviceID = deviceID;
            }
            resolve(user);
        })
    })
}

var insertUser = userModel => {
    let message = '';
    return new Promise((resolve, reject) => {
        userModel.save((err, user) => {
            if (err) {
                console.log("[--CREATE USER FAIL--]", err);
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
    return new Promise((resolve, reject) => {
        UserModel.findOne({ telephone: telephone })
            .exec((err, user) => {
                if (err) {
                    console.log(err)
                    reject('Sorry, server unknow error')
                } else if (user) {
                    resolve(convertUser(user));
                }
            })
    })
}

var queryByUserID = userID => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ _id: userID })
            .exec((err, user) => {
                if (err) {
                    console.log('---[QUERY BY USERID]---')
                    reject('This user is not exist')
                } else {
                    resolve(user)
                }
            })
    })
}

var queryUserByTelephoneAndPassword = (telephone, password) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ telephone: telephone })
            .populate('token')
            .exec((err, user) => {
                if (err) {
                    console.log(err)
                    reject('The telephone or password is invalid')
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

var updateUserTokenByUserID = (userID, tokenID) => {
    return new Promise((resolve, reject) => {
        UserModel.findByIdAndUpdate(userID, { $set: { token: tokenID } })
            .exec((err, _user) => {
                if (err) {
                    console.log('--[UPDATE USER TOKEN FAIL]--', err);
                    reject('Server unknow error');
                } else {
                    resolve(_user);
                }
            })
    })
}

/** User Friend Part */
var addFriend = (userID, friendID, remarkName) => {
    return new Promise(async (resolve, reject) => {
        try {
            let friend = {
                userID: friendID,     // current user add other friend
                remarkName: remarkName
            };
            let _friend = {
                userID: userID,       // other friend add current user
                remarkName: ''
            }
            Promise.all([addFriendToEachOther(userID, friend), addFriendToEachOther(friendID, _friend)])
                .then(result => { resolve(result) })
                .catch(err => { reject('Server unknow error, add friend fail') })
        } catch (err) {
            console.log(err)
            reject('Server unknow error, add friend fail')
        }
    })
}

var addFriendToEachOther = (userID, friend) => {
    return new Promise((resolve, reject) => {
        FriendModel.findOneAndUpdate({ userID: userID }, { $addToSet: { friends: friend } }, (err, result) => {
            if (err) {
                reject('Server unknow error, add friend fail');
            } else if (result) {
                resolve(result);
            }
        })
    })
}

var deleteFriend = (userID, friendID) => {
    return new Promise(async (resolve, reject) => {
        Promise.all([deleteFriendToEachOther(userID, friendID), deleteFriendToEachOther(friendID, userID)])
            .then(result => { resolve(result) })
            .catch(err => { reject('Server unknow error, delete friend fail') })
    })
}

var deleteFriendToEachOther = (userID, friendID) => {
    return new Promise((resolve, reject) => {
        FriendModel.update({ userID: userID }, { $pull: { friends: { userID: friendID } } }, (err, result) => {
            if (err) {
                reject('Server unknow error, delete friend fail');
            } else {
                resolve(result);
            }
        })
    })
}

var initFriendList = userID => {
    return new Promise((resolve, reject) => {
        let friendModel = new FriendModel({ userID: userID, friends: [] });
        friendModel.save((err, friendList) => {
            if (err) {
                console.log('INIT FRIEND LIST FAIL', err)
                reject('Server unknow error, init friend list fail')
            } else {
                resolve(friendList);
            }
        })
    })
}

var checkFriendIsExistByUserIDAndFriendID = async (userID, friendID) => {
    let isExist = false;
    try {
        let userFriends = await queryUserFriendsByUserID(userID);
        if (!userFriends) {
            isExist = false;
        } else {
            let friends = userFriends.friends;
            for (let index = 0; index < friends.length; index++) {
                let friend = friends[index];
                if (friend.userID._id.toString() === friendID) {
                    isExist = true;
                    break;
                }
            }
        }
    } catch (err) {
        console.log(err)
        isExist = false;
    }
    return isExist;
}

var checkFriendIDIsCurrentUserID = (userID, friendID) => {
    let _userID = JSON.parse(JSON.stringify(userID));
    if (_userID) {
        if (_userID.toString() === friendID) return true;
    }
    return false;
}

var updateRemarkName = (userID, friendID, remarkName) => {
    return new Promise(async (resolve, reject) => {
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
                            if (err) reject('Server unknow error, update remark name fail');
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
            .populate("friends.userID")    // 查询数组中的某个字段的ref数据
            .exec((err, friends) => {
                if (err) {
                    console.log(err);
                    reject('Server unknow error, get user friend list fail');
                } else {
                    resolve(friends);
                }
            })
    })
}

var searchUserByTelephoneOrNickname = (queryCondition, pageIndex) => {
    return new Promise((resolve, reject) => {
        const nickNameReg = new RegExp(queryCondition, 'i');
        UserModel.find({ $or: [{ telephone: queryCondition }, { nickname: { $regex: nickNameReg } }] })
            .populate("user")
            .limit(20)
            .skip(pageIndex * 20)
            .exec((err, userList) => {
                if (err) {
                    console.log('---[SEARCH USER FAIL]---', err)
                    reject('Server unknow error, search user fail')
                } else if (!userList) {
                    reject('User is not exist')
                } else {
                    resolve(userList)
                }
            })
    })
}

var convertUser = user => {
    let _user = JSON.parse(JSON.stringify(user)) || {};
    _user.userID = user._id;
    delete _user._id;
    delete _user.token;
    delete _user.status;
    delete _user.role;
    delete _user.meta;
    delete _user.password;
    delete _user.__v;
    return _user;
}

var convertUserProfile = user => {
    let _user = JSON.parse(JSON.stringify(user)) || {};
    _user.userID = user._id;
    delete _user._id;
    delete _user.token;
    delete _user.deviceID;
    delete _user.status;
    delete _user.role;
    delete _user.meta;
    delete _user.password;
    delete _user.__v;
    return _user;
}

var convertFriendInfo = friend => {
    let _friend = JSON.parse(JSON.stringify(friend)) || {};

    let user = _friend.userID;
    user.remarkName = _friend.remarkName;
    user.userID = user._id;

    delete user._id;
    delete user.password;
    delete user.deviceID;
    delete user.__v;
    delete user.token;
    delete user.meta;
    delete user.status;
    delete user.role;

    return user;
}

var convertFriends = friendsData => {
    let _friendList = friendsData.friends;
    if (!_friendList.length) return [];

    let convertFriendsData = [];
    for (let i = 0; i < _friendList.length; i++) {
        let friend = _friendList[i];
        friend = convertFriendInfo(friend);
        convertFriendsData.push(friend);
    }
    return convertFriendsData;
}

var convertSearchUserList = userList => {
    let _userList = JSON.parse(JSON.stringify(userList));
    if (!_userList.length) return [];

    let convertUserListData = [];
    for (let i = 0; i < _userList.length; i++) {
        let user = _userList[i];
        user = convertUserProfile(user);
        convertUserListData.push(user);
    }
    return convertUserListData;
}