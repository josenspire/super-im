const UserDao = require('../../app/dao/user.server.dao');

const CodeConstants = require('../../app/utils/CodeConstants');

let chai = require('chai');
let should = chai.should();
let expect = chai.expect;
let assert = chai.assert;

describe('User', () => {
    it('[User - queryByTelephone Testing]', () => {
        let telephone = "13631270436";
        let result = UserDao.queryByTelephone(telephone, callback => {return callback})
        console.log(result)
        // expect(callback.status).to.be.equal(CodeConstants.SUCCESS);
    });
});