const DateUtils = require('../../app/utils/DateUtils');
const { SUCCESS, FAIL, SERVER_UNKNOW_ERROR } = require("../../app/utils/CodeConstants");

let chai = require('chai');
let should = chai.should();
let expect = chai.expect;
let assert = chai.assert;

describe('User Dao', () => {
    it('[User - createUser]', done => {
        UserDao.createUser(user, callback => {
            expect(callback.status).to.be.equal(SUCCESS);
            expect(callback.data.user.telephone).to.be.equal(telephone);
            expect(callback.data.token).to.be.exist(Constants.AES_SECRET);
            expect(callback.data.secretKey).to.be.equal(Constants.AES_SECRET);
            done();
        });
    });

})