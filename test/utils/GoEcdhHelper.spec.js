import test from 'ava';
import GoEcdhHelper from '../../app/utils/GoEcdhHelper.js';
import AESHelper from '../../app/utils/AESHelper.js';
import {b64tohex} from 'jsrsasign';

let ecdhHelper = null;

test.before(() => {
    ecdhHelper = GoEcdhHelper.getInstance();
});

test.skip(`should generate new key pair`, t => {
    ecdhHelper.generateKeyPair();
    t.true(ecdhHelper.privateKey.length > 0);
    t.true(ecdhHelper.publicKey.length > 0);
});

test('generate PEM to base key', t => {
    const result = ecdhHelper.getBasePublicKey();
    t.true(result.length > 0);
});

test(`[support golang] should signature the base64 data and return "r","s" connect hex string`, t => {
    const signatureText = `5b63546b6KW/5Lqa562+5ZCN5pWw5o2u`;
    const signature = ecdhHelper.signatureByECDSAForGolang({
        hexData: b64tohex(signatureText),
        privateKeyPointHex: ecdhHelper.privateKeyPointHex,
    });
    t.true(signature.length > 170)
});

test(`[support golang] should signature by 'private key' and then verify the result by 'public key'`, t => {
    const signatureText = `5b63546b6KW/5Lqa5Lq65rC45LiN6KiA5byD77yB`;
    const signature = ecdhHelper.signatureByECDSAForGolang({
        hexData: b64tohex(signatureText),
        privateKeyPointHex: ecdhHelper.privateKeyPointHex,
    });
    const otherPublicKey = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAFYf7bhFdUeTiIwk0KbDoengAREz96cRNgMRkHBF9G0rJCFBaQcZ5p3f2etaUoz4zoaGwLuU1Hw2ko2Wtak81A==`;

    console.log("[data]: ", signatureText);
    console.log("[signature]: ", signature);
    console.log("[secretKey]: ", otherPublicKey);

    const result = ecdhHelper.verifySignatureByECDSAForGolang({
        hexData: b64tohex(signatureText),
        signature,
        publicKey: otherPublicKey
    });
    t.true(result);
});

// TODO: have not pass testing
test.failing(`[support golang] should verify signature from golang server's signature data by 'other public key' and then return the verify result`, t => {
    const signatureText = `5b63546b6KW/5Lqa5Lq65rC45LiN6KiA5byD77yB`;
    const signature = `Mjc2Njc3MjZhMTNmMTRiYTJiMDJmOTA1MDZjMjI5NzY4NTQzNmJkNTYzZGI5MjEwNDZiNTkxZmI1NjRhM2JkYjpiNGFmN2ExM2QyOGYzNjYxODkyMTJhMGQ4MTU2YjI5MzUyY2FlNTMzOGVlMzJkOGY2OGFiNDc0YTFmMjMyMDg2`;
    const otherPublicKey = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAESXlawnDVweVXk8nyfWN/0ZPYYroTrmlLt/Ta2NQav5Kb/cN0kXD6Hx9+sYU1LwoJzc6hoUDnjAvfUmgn6TzkxQ==`;

    const result = ecdhHelper.verifySignatureByECDSAForGolang({
        hexData: b64tohex(signatureText),
        signature,
        publicKey: otherPublicKey
    });
    t.true(result);
});

test(`[support golang] for api testing, generate request model`, t => {
    const requestJSON = {
        telephone: "1364105201",
        password: "123456789",
    };
    const publicKey = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAFYf7bhFdUeTiIwk0KbDoengAREz96cRNgMRkHBF9G0rJCFBaQcZ5p3f2etaUoz4zoaGwLuU1Hw2ko2Wtak81A==`;
    const serverPubKey = `MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEFkfIqOstDMrt3xbxEZ7e/eUxe2paZzemDAkVe26nFcniMyPVkGiL0U1yjxOR6Gi65r1PPvwxfec6SYpOM6CgbQ==`;

    const secret = ecdhHelper.computeSecret(serverPubKey);

    const cipherData = AESHelper.cipher({
        plainData: JSON.stringify(requestJSON),
        secret: Buffer.from(secret, 'base64'),
    });
    console.log("[data]: ", cipherData);
    console.log("[secretKey]: ", publicKey);
    const signature = ecdhHelper.signatureByECDSAForGolang({
        hexData: b64tohex(cipherData),
        privateKeyPointHex: ecdhHelper.privateKeyPointHex,
    });
    console.log("[signature]: ", signature);

    t.is(secret, '0Ip1YLH/K31gocq74xZAEFjJNvZ0WeCGky1q6/EkaLY=');
});
