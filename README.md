# super-im

> A node server-side for service font-end IM application


## Document
[GitHub Download](https://github.com/josenspire/super-im/blob/master/doc/read-api.docx)

[Online View](http://houly.cn)

## Environment Constrol

``` bash
# node 
dev-version(8.5.0)
required-verison(8.5.+)

# mongodb
dev-version(3.4.0)

# 环信sdk
version(3.0)

# alicloud

```

## Before Build Setup -- Config

``` bash
# This application using the Node official Crypto.js module, after Node.Js 8.5.+, Crypto.js begin to provide RSA, AES encryption.
RSA -- KEY save in configs/rsa_priv.pem, configs/rsa_pub.pem
AES -- KEY save in app/utils/Constants.js. ASE_SCETKEY

# 环信
configs/IMConfig

# alicloud
configs/SMSConfig

```

## Build Setup

``` bash
# install dependencies
npm install

# if your network has limitation on npm.org, you may change the npm registry to your nearby vendor. Or use: cnpm install
e.g.npm config set registry https://registry.npm.taobao.org/

# serve with hot reload at localhost:3000, you may change the port under bin/www
npm run start

# run unit tests
npm run mocha-test

```

For detailed explanation on how things work, checkout the [Documentation](http://houly.cn "Documentation")
