import test from 'ava';
import UserDao from '../../app/dao/user.server.dao';
import UserModel from '../../app/models/user.server.model';
import TokenModel from '../../app/models/token.server.model';

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
    telephone: "13600088866",
    password: "123456",
    nickname: "德玛西亚",
    deviceID: "xiaomi-5s"
};

test.before(async t => {
    await UserDao.createUser(user, token);
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
        telephone: "13600088877",
        password: "123456",
        nickname: "德玛西亚22",
        deviceID: "xiaomi-5s"
    };
    const token2 = "123456000";
    const result = await UserDao.createUser(user2, token2);
    t.is(result.status, SUCCESS);
    t.is(result.data.userProfile.telephone, '13600088877');
});

test(`should return user information when given token then return result`, async t => {
    const result = await UserDao.tokenVerifyTest('1234567890');
    t.is(result.data.token, '1234567890');
});