import test from 'ava';
import ECDHHelper from '../../app/utils/ECDHHelper.js';

let ecdhHelper = null;
test.before(() => {
    ecdhHelper = ECDHHelper.getInstance();
});

test.skip(`should generate new key pair`, t => {
    ecdhHelper.generateKeyPair();
    t.true(ecdhHelper.privateKey.length > 0);
    t.true(ecdhHelper.publicKey.length > 0);
});

test(`jsrsasign signature`, t => {
    const key = `MIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQgGfFx/D8DawGy9lDHbt9X
    otigZgSOLmE1hAaUqgrbcEyhRANCAAQ6znqINQd5Dm1x0WVErMcq9J1Hxj+kUkxt
    iVlYX3R2oZdUV8J/T/dmIpisoB469HcepdzEy9C50uf5j31fQUxD`;
    ecdhHelper.privateKey = '-----BEGIN PRIVATE KEY-----\n' + key + '\n-----END PRIVATE KEY-----\n'

    const data = '德玛西亚';
    const signature = ecdhHelper.signatureByKJUR(data);
    console.log(signature);
    t.true(signature.length > 0);
});

test(`jsrsasign signature verify`, t => {
    const signatureText = `MEUCIQDU+YD+uxDUUaRSnNYPAKA9MuuYAXAz30R8gXD3eu89SgIgbkgnzGNI1VoK3dYFNRLHvQunmKIka3maryfpRSnfibk=`;
    const publicKey = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOs56iDUHeQ5tcdFlRKzHKvSdR8Y/pFJMbYlZWF90dqGXVFfCf0/3ZiKYrKAeOvR3HqXcxMvQudLn+Y99X0FMQw==`;
    const data = '德玛西亚';
    const result = ecdhHelper.verifySignatureByKJUR({
        data,
        signature: signatureText,
        publicKey
    });
    t.true(result);
});

test.skip(`signatrue and verify `, t => {
    const privKey = `MIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQgGfFx/D8DawGy9lDHbt9X
  otigZgSOLmE1hAaUqgrbcEyhRANCAAQ6znqINQd5Dm1x0WVErMcq9J1Hxj+kUkxt
  iVlYX3R2oZdUV8J/T/dmIpisoB469HcepdzEy9C50uf5j31fQUxD`;
    ecdhHelper.privateKey = '-----BEGIN PRIVATE KEY-----\n' + privKey + '\n-----END PRIVATE KEY-----\n'
    const publicKey = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOs56iDUHeQ5tcdFlRKzHKvSdR8Y/pFJMbYlZWF90dqGXVFfCf0/3ZiKYrKAeOvR3HqXcxMvQudLn+Y99X0FMQw==`;
    const data = 'NjX06gO7BKsm2iLIYyIfm6f';
    const signature = ecdhHelper.signatureByKJUR(data);
    const result = ecdhHelper.verifySignatureByKJUR({
        data,
        signature: signature,
        publicKey
    });
    t.true(result);
});

test(`should setup private and generate public then calculate the 'secret' then return`, t => {
    const otherPublicKey = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOs56iDUHeQ5tcdFlRKzHKvSdR8Y/pFJMbYlZWF90dqGXVFfCf0/3ZiKYrKAeOvR3HqXcxMvQudLn+Y99X0FMQw==`;
    const secret = ecdhHelper.computeSecret(otherPublicKey);
    t.is('P6t3mFN0dpG0wA7PP2/t8onOHiL6thG+FhJ6uRrvQqw=', secret);
});

test('generate PEM to base key', t => {
    const result = ecdhHelper.getBasePublicKey();
    t.true(result.length > 0);
});
