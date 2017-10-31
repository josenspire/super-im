let client = require('./../client');

//Create a user
exports.createUser = (username, password, callback) => {
    let data = { username: username, password: password };
    client.client({
        data: data,
        path: 'users',
        method: 'POST',
        headers: {},
        callback: function (data) {
            console.log('[IM Create User]: ', data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Create multiple users
exports.createUsers = (users, callback) => {
    client.client({
        data: users,
        path: 'users',
        method: 'POST',
        headers: {},
        callback: function (data) {
            console.log('[IM Create Users]: ', data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Get a user
exports.getUser = (username, callback) => {
    client.client({
        path: 'users/' + username,
        method: 'GET',
        headers: {},
        callback: function (data) {
            console.log(data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Get users in batch
exports.getUsers = (limit, cursor, callback) => {
    client.client({
        path: 'users',
        method: 'GET',
        headers: {},
        query: { 'limit': limit, 'cursor': cursor },
        callback: function (data) {
            console.log(data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Delete a user
exports.deleteUser = (username, callback) => {
    client.client({
        path: 'users/' + username,
        method: 'DELETE',
        headers: {},
        callback: function (data) {
            console.log(data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Delete users in batch
exports.deleteUsers = (limit, cursor, callback) => {
    client.client({
        path: 'users',
        method: 'DELETE',
        headers: {},
        query: { 'limit': limit, 'cursor': cursor },
        callback: function (data) {
            console.log(data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Reset user's password
exports.resetPassword = (username, oldpwd, newpwd, callback) => {
    var data = { oldpassword: oldpwd, newpassword: newpwd };
    client.client({
        data: data,
        path: 'users/' + username + '/password',
        method: 'PUT',
        headers: {},
        callback: function (data) {
            console.log(data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Update user's nickname
exports.editNickname = (username, nickname, callback) => {
    var data = { nickname: nickname };
    client.client({
        data: data,
        path: 'users/' + username,
        method: 'PUT',
        headers: {},
        callback: function (data) {
            console.log(data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Add a friend for user
exports.addFriend = (username, friendname, callback) => {
    client.client({
        path: 'users/' + username + '/contacts/users/' + friendname,
        method: 'POST',
        headers: {},
        callback: function (data) {
            console.log(data);
            if (typeof callback == 'function')
                callback(data);
        }
    });
};

//Delete a friend for user
exports.deleteFriend = (username, friendname, callback) => {
    client.client({
        path: 'users/' + username + '/contacts/users/' + friendname,
        method: 'DELETE',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Get user's friends list
exports.showFriends = (username, callback) => {
    client.client({
        path: 'users/' + username + '/contacts/users',
        method: 'GET',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Get user's blacklist
exports.getBlacklist = (username, callback) => {
    client.client({
        path: 'users/' + username + '/blocks/users',
        method: 'GET',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Block user(s)
exports.addUserForBlacklist = (username, users, callback) => {
    var data = { usernames: users };
    client.client({
        data: data,
        path: 'users/' + username + '/blocks/users',
        method: 'POST',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//UnBlock user(s)
exports.deleteUserFromBlacklist = (username, blackuser, callback) => {
    client.client({
        path: 'users/' + username + '/blocks/users/' + blackuser,
        method: 'DELETE',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Get user online status
exports.isOnline = (username, callback) => {
    client.client({
        path: 'users/' + username + '/status',
        method: 'GET',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Get offline message count
exports.getOfflineMessages = (username, callback) => {
    client.client({
        path: 'users/' + username + '/offline_msg_count',
        method: 'GET',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Get offline message status
exports.getOfflineMessageStatus = (username, msgid, callback) => {
    client.client({
        path: 'users/' + username + '/offline_msg_status/' + msgid,
        method: 'GET',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Deactivate user account
exports.deactivateUser = (username, callback) => {
    client.client({
        path: 'users/' + username + '/deactivate',
        method: 'POST',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};

//Activation user account
exports.activateUser = (username, callback) => {
    client.client({
        path: 'users/' + username + '/activate',
        method: 'POST',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });

};

//Logout user
exports.disconnectUser = (username, callback) => {
    client.client({
        path: 'users/' + username + '/disconnect',
        method: 'GET',
        callback: function (data) {
            console.log(data);
            typeof callback == 'function' && callback(data);
        }
    });
};