import test from 'ava';
import UserDao from '../../app/dao/user.server.dao';
import UserModel from '../../app/models/user.server.model';
import {SUCCESS, FAIL, SERVER_UNKNOW_ERROR} from "../../app/utils/CodeConstants";
import mongoose from 'mongoose';
import MongodbMemoryServer from 'mongodb-memory-server';

const mongod = new MongodbMemoryServer();

test.before(async () => {
    const uri = await mongod.getConnectionString();
    await mongoose.connect(uri);
});

const token = '1234567890';
const user = {
    telephone: "13600088866",
    password: "123456",
    nickname: "德玛西亚",
    deviceID: "xiaomi-5s"
};

// test.beforeEach(async t => {
//
// });
// test.afterEach.always(async t => {
//     await UserModel.remove({});
// });

test.after.always(t => {
    mongoose.disconnect();
    mongod.stop();
});


test(`should create a new User and return the create user with user information`, async t => {
    const result = await UserDao.createUser(user, token);
    t.is(result.status, SUCCESS);
    t.is(result.data.userProfile.telephone, '13600088866');
});

