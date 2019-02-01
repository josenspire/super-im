import test from 'ava';
import AspectControl from '../../app/commons/aspect.server.common';

test.before(() => {
});

test(`should decrypt request data and verify signature then return verify failed result`, t => {
    const requestData = {
        data: 'WkiENgtvdBcHix4ljMta9g==',
        secretKey: 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAElPcD/IBfHJ0gX0vspSig/h89OGAJ+vjh6wvCarzuyLdCMKaHByf2tjqhK+a7Rb06qUQ4ssFaHwsCMOFozEt3NA==',
        signature: 'MEUCIQDov+ZpEuU6ElgPkL4nWtJfycSNiXEU8gZA/UD/Yh3tbgIgCT9HImKBrPx3EjdtXgNtKKxp5pe96cdQrISC0lw/Q6U=',
    };

    let req = {
        body: requestData,
    };

    let result = {};
    let res = {
        json: params => {
            result = params;
        },
    };

    AspectControl.handleRequest(req, res);
    console.log('----', result);
    t.true(result.length > 0);
});