import test from 'ava';
import ecdhHelper from '../../app/utils/ECDHHelper.js';
import path from 'path';
import { readFileSync } from 'fs';

// test(`should generate new key pair`, t => {
//   ecdhHelper.generateKeyPair();
//   t.true(ecdhHelper.privateKey.length > 0);
//   t.true(ecdhHelper.publicKey.length > 0);
// });

// test(`should setup private and generate public then calculate the 'secret' then return`, t => {
//   ecdhHelper.generateKeyPair();
//   const pkHex = `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAELMxJWGvqCoVejumijbLaXhjHupMmVvRjLHiQSRQN+wgaS49iFnNzm0GkaATW9YyqoxOfkuHjUZRl60POb5jPjg==`;
//   const secret = ecdhHelper.decrypto(pkHex);
//   t.true(secret.length > 0);
// });

test(`signature verify`, t => {
  const key = 'MIICXgIBAAKBgQC6K2faKIw+IfosK43aokfOalAgNXwB85Qy5gebDyfnFppYlJKPFg5kER/ybS+XYgRxtp7LzFMJEZ8HQunTX1uoRrjeUwYgI1MLddei/ASsVzGbHW7mI9l2sf4ZhdxQwZa2NLzM8mVVZxz8pizfvobspwqSv5lwZxMLKZboELkATQIDAQABAoGBAJLU8zbcLig/EhpOS7Z5sZq6vPF6XZEIdQVj6fHBFV6stBVTMPiLk9QWsZS5ywRhuVGakEn6oC8R59SJUPR2TEnmxzuZlj5+iq3G5lDWvV/QEQK2dRpYuZnkvRHPXFIO3KsYISNqGCEu9rrVzvsZ90dnf8jWev9qOQ270QZHhAZdAkEA4s3+YOIFrqWG6zYR6NznZBk/p3fpMjCvgum8/KXPHWeft/9oQYdZYU4MzfZEjRVUEljDLKGloqW6C4rN6nW0+wJBANIiV9d3cSYbex0aDB1K3w7bG7yws0nOwx76fupdSLG+61rvvqVFKaL2fDTR2+ApwqAZhguG/rC2hJiq2HWLTVcCQQC826MysYLhxtvuCHwpV6kmZQ/oN6VrMbc0X8YK61bnuV36LSd3SWlX6VIoPyUeBeCX1mnPRFtUcIPXEKIe1hz5AkAxnJwiqfeT6K8Tet/bVp79Uevli854oZFd0gR+7tFH7eyBRtM7D+45pHpEujtwXEuwIvaL6C5fqGf753I9pkr3AkEArkSCJ2SUsFqr/FWk4dWBk4Ti9UkQHTOlYbFV764SQTLiaPNjEkXtybfKNKH8G86JE+GFq29HF6HL7GM5Q/38+w==';
  ecdhHelper.privateKey = '-----BEGIN RSA PRIVATE KEY-----\n' + key + '\n-----END RSA PRIVATE KEY-----\n'
  console.log(ecdhHelper.privateKey);
  // ecdhHelper.privateKey = readFileSync(path.join(__dirname, '../../configs/ecdh_priv.pem')).toString();
  // rsaHelper.setPublicKey((`../../configs/ecdh_pub.pem`).toString());
  const result = ecdhHelper.signature('asdfasfd');
  t.true(result.length > 0);
});
