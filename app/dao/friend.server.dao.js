const FriendModel = require('../models/friend.server.model')

const CodeConstants = require('../utils/CodeConstants')
const Constants = require('../utils/Constants')
const DateUtils = require('../utils/DateUtils')

const uuidv4 = require('uuid/v4');

exports.addFriend = async (userID, friendID, cb) => {
    let result = { data: {}, message: '' };

    try {
        FriendModel.update({ _id: customerId }, { $pull: { friends: { userID: userID } } }, (err, res) => {

        });

        cb(result)
    } catch (err) {
        console.log(err)
        cb(err)
    }
}

let addFriend = (userID, friendID) => {

}