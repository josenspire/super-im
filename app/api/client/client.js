let Token = require('../commons/token.server.common');
let request = require('../request');

let Initialized = false;
let token = new Token();

function client(json, callback) {
    if (!Initialized || token.isExpire()) {
        token.accessAdminToken(function () {
            Initialized = true;
            if (typeof callback == 'function') {
                callback(json);
            } else {
                httpRequestWithToken(json);
            }
        });
    } else {
        if (typeof callback == 'function') {
            callback(json);
        } else {
            httpRequestWithToken(json);
        }
    }

}
function httpRequestWithToken(json) {
    if (token == null) {
        console.log('err: failed to access token!')
    } else {
        json.headers = json.headers || {};
        json.headers['Content-Type'] = 'application/json';
        json.headers['Authorization'] = 'Bearer ' + token.getToken();
        request.httpRequest(json);
    }
}

function uploadFileWithToken(json) {
    if (token == null) {
        console.log('err: failed to access token!')
    } else {
        json.headers = json.headers || {};
        json.headers['http'] = 'multipart/form-data';
        json.headers['Authorization'] = 'Bearer ' + token.getToken();
        request.uploadFile(json);
    }
}

function accessCommonToken(username, password, callback) {
    if (token == null) {
        console.log('err: failed to access token!')
    } else {
        token.accessCommonToken(username, password, _token => {
            callback(_token)
        })
    }
}

module.exports = {
    client: client,
    httpRequestWithToken: httpRequestWithToken,
    uploadFileWithToken: uploadFileWithToken,
    accessCommonToken: accessCommonToken

}