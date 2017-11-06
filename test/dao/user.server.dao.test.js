const UserDao = require('../../app/dao/user.server.dao');

const Constants = require('../../app/utils/Constants');
const CodeConstants = require('../../app/utils/CodeConstants');

let chai = require('chai');
let should = chai.should();
let expect = chai.expect;
let assert = chai.assert;

describe('User', () => {
    it('[User - queryByTelephone Testing]', function (done) {

        (async function () {
            let telephone = "13631270436";

            // let result = await queryByTelephone(telephone);
            // console.log(result)
            // expect(result.status).to.be.equal(CodeConstants.SUCCESS);
            // done()
        })();
    });

    // it('[User - queryUserByTelephoneAndPassword]', (done) => {
    //     let telephone = "13631270436";
    //     let password = "123456";

    //     UserDao.queryUserByTelephoneAndPassword(telephone, password, callback => {
    //         console.log(result)
    //         expect(callback.status).to.be.equal(CodeConstants.SUCCESS);
    //         done();
    //     });
    // })
});


var queryByTelephone = (telephone) => {
    return new Promise((resolve, reject) => {
        UserDao.queryByTelephone(telephone, Constants.SMS_TYPE_LOGIN, callback => {
            console.log('sssssssssss', callback)
            resolve(callback)
        })
    })
}