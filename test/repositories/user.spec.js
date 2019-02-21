import test from 'ava';
import UserRepository from '../../app/repositories/user.repository';
import UserModel from '../../app/models/user.model';
import TokenModel from '../../app/models/token.model';

import {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} from "../../app/utils/CodeConstants";
import mongoose from 'mongoose';
import MongodbMemoryServer from 'mongodb-memory-server';

const mongod = new MongodbMemoryServer();

test.before(async () => {
    const uri = await mongod.getConnectionString();
    await mongoose.connect(uri, {useNewUrlParser: true});
});

const token = '1234567890';
const user = {
    telephone: "13631210001",
    password: "12345678",
    nickname: "德玛西亚22",
    deviceID: "xiaomi-5s"
};

test.before(async t => {
    await UserRepository.createUser(user, token);
});
test.afterEach(async t => {
    await UserModel.remove({});
    await TokenModel.remove({});
});

test.after.always(t => {
    mongoose.disconnect();
    mongod.stop();
});


test(`should create a new User and return the create user with user information`, async t => {
    const user2 = {
        telephone: "13631210001",
        password: "12345678",
        nickname: "德玛西亚22",
        deviceID: "xiaomi-5s"
    };
    const token2 = "123456000";
    const {userProfile} = await UserRepository.createUser(user2, token2);
    t.is(userProfile.telephone, '13631210001');
});

test(`should return user information when given token then return result`, async t => {
    const result = await UserRepository.tokenVerifyTest('1234567890');
    t.is(result.data.token, '1234567890');
});

test.only(`should verify telephone and password then return the query verify result`, async t => {
    const result = await UserRepository.queryUserByTelephoneAndPassword("13631210001", "12345678");
    t.is(result.userProfile.telephone, "13631210001");
});
