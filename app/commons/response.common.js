const { SUCCESS, FAIL, SERVER_ERROR } = require('../utils/Constants');

class TResponse {
    success (result, message) {
        return { status: SUCCESS, data: result || {}, message: message || "" };
    };

    fail (code, message) {
        return { status: code || FAIL, data: {}, message: message || 'Server unknow error' };
    };

    error (err, message) {
        console.error(`${err.stack}`);
        return { status: err.code || SERVER_ERROR, data: {}, message: message || err.message };
    };
};

module.exports = new TResponse();
