import test from 'ava';
import rsaHelper from '../../app/utils/RSAHelper';
import {
  readFileSync
} from 'fs';
import {
  join
} from 'path';

const dirPath = join(__dirname, '../../configs');

test.before(() => {
  // rsaHelper.generateKeyPair();
  rsaHelper.setPrivateKey(readFileSync(`${dirPath}/rsa_priv.pem`).toString());
  rsaHelper.setPublicKey(readFileSync(`${dirPath}/rsa_pub.pem`).toString());
});

test(`should encrypt 'object' data by 'private key' then return the base64 encrypt result`, t => {
  const jsonObj = {
    code: 200,
    data: {
      'name': 'James',
    },
    message: '',
  };
  const encryptText = rsaHelper.objectEncryptByPrivateKey(jsonObj);
  console.log('------encrypt by private: ', encryptText);
  t.true(encryptText.length > 0);
});

test(`should encrypt 'string' data by 'public key' then return the base64 encrypt result`, t => {
  const plainText = `{"code":200,"data":{"name":"James"},"message":""}`;
  const encryptText = rsaHelper.encryptByPublicKey(plainText);
  console.log('-------encrypt by public: ', encryptText);
  t.true(encryptText.length > 0);
});

test(`should encrypt 'object' data by 'public key' then return the base64 encrypt result`, t => {
  const jsonObj = {
    code: 200,
    data: {
      'name': 'James',
    },
    message: '',
  };
  const encryptText = rsaHelper.objectEncryptByPublicKey(jsonObj);
  console.log('------encrypt obj by public: ', encryptText);
  t.true(encryptText.length > 0);
});

test(`should decrypt encrypt data by 'private key' then return the decrypt result`, t => {
  const encryptText = `tBpMg6P+HZpLJ/ti55hRdyr345RgMFCfPUyTREw4weD2MhyoJoSaMaDFiALV4Z+iLfknAsTGOEKRqDWc8R4ZppRWcrPcon6bJGQRSFMT0j/qSpU6XID6+ZHNJ0/NQBogRtgJm6raLux7MyV6EV99fC0FZBoFXddFCD/gcl70+n8=`;
  const result = rsaHelper.decryptByPrivateKey(encryptText);
  t.deepEqual(result, {
    code: 200,
    data: {
      'name': 'James',
    },
    message: '',
  });
});

test(`should decrypt encrypt data by 'public key' then return the decrypt result`, t => {
  const encryptText = `P0y8B9I9zrXNEHL9IW7IoPXu0rRz/RWJ0ZqLYJZXfk1rUmk21KtUVZnkG/H1thKkbm7QqPcoiOQAEaHzHuoEv9wacEy7nGjInPCSNfLf/Y3z3fWN9yODyXNHMoic8e0IuMjSuSXVahdMzIuQA9GMUDtpJoQsK5rtkkxfdV1P/9o=`;
  const result = rsaHelper.decryptByPublicKey(encryptText);
  t.deepEqual(result, {
    code: 200,
    data: {
      'name': 'James',
    },
    message: '',
  });
});

test.only(`should sign 'public' decrypt data and return the signature result`, t => {
  const encryptText = `kFLMuRlKFBRR0mEJ2hL3X+IScZCXbFWy12C4n4KbF5MzTNKHesdjVGRIQogsI1kfNSSj2l6vGaNI1tuxBecg0BLXuB8gFBQTe2d9e0oqnXjOY9WiRHO/QrhTe+dGzDYsULoAOII68xRLes5TYhVFt7WGgDu0dQkOKulmPXSYrLY=`;
  const signature = rsaHelper.signature(encryptText);
  const expectationSignature = `WuNmh3/KdZdxsNEuHWSnbx2jSyC/zQGVW5eAaquz/fWkB3ZaGuVht+3gRLVUWbZOrgL+c9Wcih9PWtIHE57MGMiiVFrWMbFUebzX7wwk6pKRdg9d21aRQ+W8mCVf3sFNrF3PCT5YY2lfkTUpiV3xw5YAGiIrNbeyHlQBgQJPl1w=`;
  console.log('---------Signature: ', signature);
  t.is(signature, expectationSignature);
});

test.only(`should verify 'signature' then return the verify result`, t => {
  const encryptText = `kFLMuRlKFBRR0mEJ2hL3X+IScZCXbFWy12C4n4KbF5MzTNKHesdjVGRIQogsI1kfNSSj2l6vGaNI1tuxBecg0BLXuB8gFBQTe2d9e0oqnXjOY9WiRHO/QrhTe+dGzDYsULoAOII68xRLes5TYhVFt7WGgDu0dQkOKulmPXSYrLY=`;
  const signature = `WuNmh3/KdZdxsNEuHWSnbx2jSyC/zQGVW5eAaquz/fWkB3ZaGuVht+3gRLVUWbZOrgL+c9Wcih9PWtIHE57MGMiiVFrWMbFUebzX7wwk6pKRdg9d21aRQ+W8mCVf3sFNrF3PCT5YY2lfkTUpiV3xw5YAGiIrNbeyHlQBgQJPl1w=`;
  const result = rsaHelper.verifySignature(encryptText, signature);
  t.true(result);
});
