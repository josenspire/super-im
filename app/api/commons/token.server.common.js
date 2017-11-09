const IMConfig = require('../../../configs/config').IMConfig;
const request = require('./../request');
function Token() {
    var client_id = IMConfig.client_id;
    var client_secret = IMConfig.client_secret;
    var token = '';
    var expiredAt;
    var commonExpiredAt;
    this.getToken = function () {
        return token;
    };
    this.accessAdminToken = function (callback) {
        var data = { grant_type: 'client_credentials', client_id: client_id, client_secret: client_secret };
        request.httpRequest({
            data: data,
            path: 'token',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            callback: function (data) {
                var d = JSON.parse(data);
                token = d.access_token;
                expiredAt = d.expires_in * 1000 + new Date().getMilliseconds();
                if (typeof callback == 'function')
                    callback(token);
            }
        });
    };

    // request common user token
    this.accessCommonToken = function (username, password, callback) {
        var data = { grant_type: 'password', username: username, password: password };
        console.log(data)
        request.httpRequest({
            data: data,
            path: 'token',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            callback: function (data) {
                var d = JSON.parse(data);
                token = d.access_token;
                commonExpiredAt = d.expires_in * 1000 + new Date().getMilliseconds();
                console.log('token is: ' + token);
                if (typeof callback == 'function')
                    callback(token);
            }
        });

    };

    //Check token is expired
    this.isExpire = function () {
        return new Date().getMilliseconds() > expiredAt;
    }

    this.isCommonExpire = function() {
        return new Date.getMilliseconds() > commonExpiredAt;
    }
}

module.exports = Token;

