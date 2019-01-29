
module.exports = {
    SUCCESS: 200,
    FAIL: 400,
    SIGNATURE_VERIFY_FAIL: 401,
    REQUEST_ERROR: 404,
    REQUEST_TIMEOUT_ERROR: 408,

    SERVER_UNKNOW_ERROR: 500,
    SERVER_REJECT_ERROR: 503,  // server reject reqest. 
    SERVER_TIMEOUT_ERROR: 504, // server handle time out
}