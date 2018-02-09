const constants = {
    AES_SECRET: 'DE_MA_XI_YA_WANG',

    JWT_PASSWORD_SECRET: 'NODE_USER_SECRET',
    JWT_USERID_SECRET: 'NODE_USERID_SECRET',

    MAX_ENCRYPT_BLOCK: 117,   // PKCS_1    2048 bit
    MAX_DECRYPT_BLOCK: 128,

    SMS_TYPE_REGISTER: 'REGISTER',
    SMS_TYPE_LOGIN: 'LOGIN',
    SMS_TYPE_OTHERS: 'OTHERS',

    SKIP_VERIFY: 'SKIP_VERIFY',

    QN_DEFAULT_EXTERNAL_LINK: "http://ozjhae6uc.bkt.clouddn.com/",

    DEFAULT_MAX_GROUP_MEMBER_COUNT: 500,
    GROUP_NAME_MAX_LENGTH: 32,
    MAX_USER_GROUP_OWN_COUNT: 10,

    GROUP_OPERATION_CREATE: 'Create',
    GROUP_OPERATION_ADD: 'Add',
    GROUP_OPERATION_QUIT: 'Quit',
    GROUP_OPERATION_DISMISS: 'Dismiss',
    GROUP_OPERATION_KICKED: 'Kicked',
    GROUP_OPERATION_RENAME: 'Rename',
    GROUP_OPERATION_BULLETIN: 'Bulletin',
    GROUP_OPERATION_TRANSFER: 'Transfer',
}

module.exports = constants;