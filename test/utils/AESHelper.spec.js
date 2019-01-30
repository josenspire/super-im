import test from 'ava';
import aesHelper from '../../app/utils/AESHelper.js';

const SECRET = 'P6t3mFN0dpG0wA7PP2/t8onOHiL6thG+FhJ6uRrvQqw=';

test.before(() => {});

test(`should encrypt plain data`, t => {
    const plainData = '德玛西亚';
    const result = aesHelper.cipher({plainData, secret: Buffer.from(SECRET, 'base64')});
    t.is('wSfckYnrOFCXE1In3AvHFA==', result);
});

test(`should decrypt encrypt data`, t => {
    const encryptData = `wSfckYnrOFCXE1In3AvHFA==`;
    const result = aesHelper.decipher({cipherText: encryptData, secret: Buffer.from(SECRET, 'base64')});
    t.is('德玛西亚', result);
});