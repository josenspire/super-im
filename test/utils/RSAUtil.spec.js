import test from 'ava';
import {
  generateKeys,
  getPrivateKey,
  getPublicKey,
  signature,
  objectEncrypt,
  generateKeyPair
} from '../../app/utils/RSAUtil';

test.only('generate key pair', t => {
  const {
    publicKey,
    privateKey
  } = generateKeyPair();

  t.true(publicKey.length > 0);
});

test(`should generate key pair and then return them`, t => {
  const {
    publicKey,
    privateKey
  } = generateKeys();
  t.true(publicKey.length > 0);
  t.true(privateKey.length > 0);
});

test('should sign the encrypt by private key then return the signature', t => {
  const privateKey = 'SHltYOqrK4SEyJP371acCe//tpVnl8PutLVyTiHoGpDZI9TpLud88/UvX9N/YMgx9OMvj2UAt5Sz26ADpIgFhC+pUllIJuHgZQN0xZQaqsvM36FxFEJJFqChEBDPnfImAl5lIPRbY8h48SBP6NbcR120mSu1jPkF+v1uun9l4vo=';
  const publicKey = 'h2WBopPzi7Y5HXec/KJ6bUzASHU6v5JLqe2stzB4S4GeJE1al7VU0JClnD2evIHNEA0CG8qbofDq/SbdlIUgCRLF6fLPPHIpl313b1ZotS6Qh8/tkGakDa1Y9tk7VtFwWTtS9I46yRELXNg8OYoAwswvjYdDp70O+eMw9KbUoKs=';

  global.privateKey = privateKey;
  global.publicKey = publicKey;

  const jsonObj = {
    code: 200,
    data: {
      'name': 'James'
    },
    message: '',
  };

  const encryptText = objectEncrypt(jsonObj);
  console.log('-------encrypt successs: ', encryptText);

  const signatureText = signature(encryptText);
  console.log('----signatureText---: ', signatureText);

  t.true(publicKey.length > 0);
});