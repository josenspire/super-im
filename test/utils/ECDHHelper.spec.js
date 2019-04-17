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
    const signature = ecdhHelper.signatureByECDSA(data);
    console.log(signature);
    t.true(signature.length > 0);
});

test(`jsrsasign signature verify`, t => {
    const signatureText = `MEUCIQDU+YD+uxDUUaRSnNYPAKA9MuuYAXAz30R8gXD3eu89SgIgbkgnzGNI1VoK3dYFNRLHvQunmKIka3maryfpRSnfibk=`;
    const publicKey = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEOs56iDUHeQ5tcdFlRKzHKvSdR8Y/pFJMbYlZWF90dqGXVFfCf0/3ZiKYrKAeOvR3HqXcxMvQudLn+Y99X0FMQw==`;
    const data = '德玛西亚';
    const result = ecdhHelper.verifySignatureByECDSA({
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
    const signature = ecdhHelper.signatureByECDSA(data);
    const result = ecdhHelper.verifySignatureByECDSA({
        data,
        signature: signature,
        publicKey
    });
    t.true(result);
});

test(`should setup private and generate public then calculate the 'secret' then return`, t => {
    const otherPublicKey = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErVv8/JB3r+HqQoicxr7DJUoe51LVjrEjSqZWt6vFzKrE+Ipwb3rAlNv5EcgH6UjQGfhYH0J4zwHmaqWbxSGPFQ==`;
    const secret = ecdhHelper.computeSecret(otherPublicKey);
    t.is('zusxK4+HackC8B8wL4/Ljyy/x+0Xkct3Gs1jypGcLCM=', secret);
});

test('generate PEM to base key', t => {
    const result = ecdhHelper.getBasePublicKey();
    t.true(result.length > 0);
});

test(`[support golang] should signature the base64 data and return "r","s" connect hex string`, t => {
    const signatureText = `5b63546b6KW/5Lqa562+5ZCN5pWw5o2u`;
    const signature = ecdhHelper.signatureByECDSAForGolang(signatureText, ecdhHelper.privateKeyPointHex);
    const expectations = signature.split(":");
    t.true(expectations.length === 2)
});

test(`[support golang] should verify signature and return the result for support Golang`, t => {
    const signatureText = `5b63546b6KW/5Lqa562+5ZCN5pWw5o2u`;
    const signature = ecdhHelper.signatureByECDSAForGolang(signatureText, ecdhHelper.privateKeyPointHex);
    const otherPublicKey = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE60BkU5fcacDtqV6Co2rPgxzfXdmLcnVNau6JE84AVPRz3x/cZFlJK6aSrSgzqxUPAU8NBNj1J4Z2oHdsjzZpMg==`;
    const result = ecdhHelper.verifySignatureByECDSAForGolang({
        data: signatureText,
        signature,
        publicKey: otherPublicKey
    });
    t.true(result);
});
