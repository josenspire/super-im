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

    const encryptText = '德玛西亚';
    const signature = ecdhHelper.signatureByKJUR(encryptText);
    t.true(signature.length > 0);
});

test(`jsrsasign signature verify`, t => {
    const signatureText = `MEUCIQDcTneyzHoZiP6dbRfYAXo+YRuH9zb+27bM0F9h9XlvrAIgHEi2iL9cScYW+bMVIBlqgmz8vF++lkniQkHbwy/f88o=`;
    const key = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOs56iDUHeQ5tcdFlRKzHKvSdR8Y/pFJMbYlZWF90dqGXVFfCf0/3ZiKYrKAeOvR3HqXcxMvQudLn+Y99X0FMQw==`;
    const publicKey = `-----BEGIN PUBLIC KEY-----\n` + key + `\n-----END PUBLIC KEY-----`;
    const encryptText = '德玛西亚';
    const result = ecdhHelper.verifySignatureByKJUR({
        encryptText,
        signature: signatureText,
        publicKey
    });
    t.true(result);
});

test(`signatrue and verify `, t => {
    const privKey = `MIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQgGfFx/D8DawGy9lDHbt9X
  otigZgSOLmE1hAaUqgrbcEyhRANCAAQ6znqINQd5Dm1x0WVErMcq9J1Hxj+kUkxt
  iVlYX3R2oZdUV8J/T/dmIpisoB469HcepdzEy9C50uf5j31fQUxD`;
    ecdhHelper.privateKey = '-----BEGIN PRIVATE KEY-----\n' + privKey + '\n-----END PRIVATE KEY-----\n'
    const pubKey = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOs56iDUHeQ5tcdFlRKzHKvSdR8Y/pFJMbYlZWF90dqGXVFfCf0/3ZiKYrKAeOvR3HqXcxMvQudLn+Y99X0FMQw==`;
    const publicKey = `-----BEGIN PUBLIC KEY-----\n` + pubKey + `\n-----END PUBLIC KEY-----`;
    const encryptText = 'NjX06gO7BKsm2iLIYyIfm6f';
    const signature = ecdhHelper.signatureByKJUR(encryptText);

    const result = ecdhHelper.verifySignatureByKJUR({
        encryptText,
        signature: signature,
        publicKey
    });
    t.true(result);
});

test(`jsrsasign signature verify 2`, t => {
    const encryptText = "1234";
    const signature = "MEQCIG3KrEf4mcRgwWXEVjvJ0/+CEA42SFt0drzP9sj1hZXZAiBY5e7VIb8jouPpkagNSBzbbq/wYIWh4DEmaiWAYVgnVg==";
    let publicKey = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEQvJxZbmjqTJ7fJCpAeVjvDBrSPUcKsRTN7RdKmjYkDld0s5jSRxA5nolQti5530GS23puF9SsKazy+6XlBJRmQ==";
    publicKey = `-----BEGIN PUBLIC KEY-----\n` + publicKey + `\n-----END PUBLIC KEY-----`;

    const result = ecdhHelper.verifySignatureByKJUR({
        encryptText,
        signature, signature,
        publicKey
    });
    t.true(result);
});

test(`should setup private and generate public then calculate the 'secret' then return`, t => {
    const key = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOs56iDUHeQ5tcdFlRKzHKvSdR8Y/pFJMbYlZWF90dqGXVFfCf0/3ZiKYrKAeOvR3HqXcxMvQudLn+Y99X0FMQw==`;
    const otherPublicKey = ecdhHelper.generateBaseKeyToPEM(key);
    const secret = ecdhHelper.computeSecret(otherPublicKey);
    t.is('P6t3mFN0dpG0wA7PP2/t8onOHiL6thG+FhJ6uRrvQqw=', secret);
});

test.only('generate PEM to base key', t => {
    const result = ecdhHelper.getBasePublicKey();
    t.true(result.length > 0);
});
