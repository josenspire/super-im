const UserDao = require('../../app/dao/user.server.dao');
const UserModel = require('../../app/models/user.server.model')
const Constants = require('../../app/utils/Constants');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../../app/utils/CodeConstants");

const mongoose = require('mongoose')
let MongoStore = require('connect-mongo')
const dbUrl = 'mongodb://127.0.0.1:27017/super-im'

let chai = require('chai');
let should = chai.should();
let expect = chai.expect;
let assert = chai.assert;

describe('User Dao', () => {

    var user = {};

    before(() => {
        mongoose.connect(dbUrl)
        console.log('-------------[DB connect success]-------------')

        user = {
            telephone: "13600088866",
            password: "123456",
            nickname: "德玛西亚",
            deviceID: "xiaomi-5s"
        };
    })

    it('[User - createUser]', done => {
        UserDao.createUser(user, callback => {
            expect(callback.status).to.be.equal(SUCCESS);
            expect(callback.data.user.telephone).to.be.equal(telephone);
            expect(callback.data.token).to.be.exist(Constants.AES_SECRET);
            expect(callback.data.secretKey).to.be.equal(Constants.AES_SECRET);
            done();
        });
    });

    it('[User - queryUserByTelephoneAndPassword]', done => {
        let telephone = "13600088866";
        let password = "123456";
        UserDao.queryUserByTelephoneAndPassword(telephone, password, callback => {
            expect(callback.status).to.be.equal(SUCCESS);
            expect(callback.data.user.telephone).to.be.equal(telephone);
            expect(callback.data.secretKey).to.be.equal(Constants.AES_SECRET);
            done();
        });
    });

    it('[User - queryByTelephone Testing]', done => {
        let telephone = "13600088866";
        UserDao.queryByTelephone(telephone, '', callback => {
            expect(callback.status).to.be.equal(SUCCESS);
            done();
        })
    });
});

