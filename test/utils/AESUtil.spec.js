import test from 'ava';
import AESHelper from '../../app/utils/AESHelper.js';

const SECRET = '0123456789123456';

test(`should encrypt plain data`, t => {
    const plainData = '德玛西亚';
    const result = AESHelper.cipher(plainData, SECRET);
    t.is('SIpgXD51lCPLPUEXn+cyyw==', result);
});

test(`should decrypt encrypt data`, t => {
    const encryptData = `SIpgXD51lCPLPUEXn+cyyw==`;
    const result = AESHelper.decipher(encryptData, SECRET);
    t.is('德玛西亚', result);
});