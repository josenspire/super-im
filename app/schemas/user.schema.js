const SECRET = require('../utils/Constants').JWT_PASSWORD_SECRET;   // secret key

const mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

const jwt = require('jwt-simple');
const DateUtils = require('../utils/DateUtils');

// validate email format
let validateEmail = email => {
    const filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!email.match(filter)) {
        return false;
    } else {
        return true;
    };
};

// validate telephone
let validateTel = telephone => {
    return (telephone.length === 11)
};

// validate password
let validatePassword = password => {
    return (password.length >= 6 && password.length <= 16);
};

// validate nickname
let validateNickname = nickname => {
    return (nickname.length >= 1 && nickname.length <= 12);
};

let UserSchema = new mongoose.Schema({

    // telephone
    telephone: {
        type: String,
        unique: 'Telephone already exists',
        required: 'Please fill in a telephone number.',
        validate: [validateTel, "Telephone number's length should be 11 bits"],
        trim: true
    },

    email: {
        type: String,
        validate: [validateEmail, "Email format is incorrect"],
    },

    // tel country code
    countryCode: {
        type: String,
        default: "+86",
        trim: true
    },

    // password
    password: {
        type: String,
        required: 'Please fill in password',
        // validate: [validatePassword, "Password's length could not more than 6-16 bits"],
        trim: true
    },

    nickname: {
        type: String,
        required: 'Please fill in a nickname',
        validate: [validateNickname, "Nickname's length could not more that 12"],
        trim: false
    },

    avatar: {
        type: String,
        // default: "http://ozjhae6uc.bkt.clouddn.com/103e2911-091d-4de7-a002-542fea592b72.jpg",
        default: "",
        trim: true
    },

    // unknow: 0, male: 1, female: 2
    sex: {
        type: Number,
        default: 0
    },

    birthday: {
        type: Date,
        default: ""
    },

    signature: {
        type: String,
        default: "This guy is lazy. He doesn't fill in anything..."
    },

    // geographical location
    location: {
        type: String,
        default: ""
    },

    token: {
        type: ObjectId,
        ref: 'Token'
    },

    // device id
    deviceID: {
        type: String,
        required: 'Please fill in a device ID',
    },

    // 0: normal user
    // 50: super admin
    role: {
        type: Number,
        default: 0
    },

    // active ?
    status: {
        type: Boolean,
        default: true
    },

    // date note
    meta: {
        createAt: {
            type: Date,
            default: DateUtils.formatCommonUTCDate(Date.now())
        },
        updateAt: {
            type: Date,
            default: DateUtils.formatCommonUTCDate(Date.now())
        }
    }
}, {
        versionKey: false
    }
);


UserSchema.pre('save', function (next) {
    let user = this;
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    } else {
        this.meta.updateAt = DateUtils.formatCommonUTCDate(Date.now());
    }
    //encode password
    user.password = jwt.encode(user.password, SECRET);
    console.log('[ENCODE PASSWORD]', user.password);
    next()
});

//decode password and checking
UserSchema.methods = {
    comparePassword: function (_password) {
        const dpassword = jwt.decode(this.password, SECRET);
        console.log('----[TRUE PASSWORD]----', dpassword);
        return (_password === dpassword);
    }
};

UserSchema.statics = {
    findById: function (id, cb) {
        return this
            .findOne({ _id: id })
            .exec(cb)
    }
};

module.exports = UserSchema;