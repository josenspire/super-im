const constants = {
    AES_SECRET: 'DE_MA_XI_YA!!!',

    JWT_SECRET: 'NODE_USER_SECRET',

    MAX_ENCRYPT_BLOCK: 117,   // PKCS_1    2048 bit
    MAX_DECRYPT_BLOCK: 128,

    SMS_TYPE_REGISTER: 'REGISTER',
    SMS_TYPE_LOGIN: 'LOGIN',
    SMS_TYPE_OTHERS: 'OTHERS',

    SKIP_VERIFY: 'SKIP_VERIFY',
}

module.exports = constants;