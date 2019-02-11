# super-im

> A node server-side for service font-end IM application


## Document
[GitHub Download](https://github.com/josenspire/super-im/blob/master/doc/read-api.docx)

[Online View](http://houly.cn)

## Project

``` bash

super-im:
├───app               
│   ├───api           -- proxy api / call webservice
│   │   ├───client    
│   │   ├───commons   
│   │   ├───proxies   
│   │   └───resources 
│   │
│   ├───controllers   -- input control
│   ├───reopsitory    -- db operation
│   ├───daoManager    -- decoupling - between service and dao
│   ├───models        -- models
│   ├───routes        -- url routes
│   ├───schemas       -- db schemas
│   ├───services      -- service, business/logic operation
│   ├───utils         -- tools
│   └───views         -- ejs view
├───bin               -- entry
│   └───dev-server.js -- server start
├───configs           -- env config
│   ├───ecdh_priv.pem -- ecdh private key
│   ├───ecdh_pub.pem  -- ecdh public key
│   ├───env
│   │   ├───index.js        -- environment index config file
│   │   ├───development.js  -- development environment config file
│   │   ├───production.js   -- production environment config file
│   │   └───test.js         -- test environment config file
│   │
│   └───log4jConfig.json    -- log4js config file
├───doc               -- doc
│
├───lib               -- express, mongoose etc..
│   ├───app.js        -- server config file
│   ├───express.js    -- express config file
│   ├───logger.js     -- TODO
│   └───mongoose.js   -- mongoose config file
├───logs              -- log4js log files
├───public            -- public static resource
│   │
│   └───stylesheets   
├───test              -- unit test       
│    └───utils
└───Dockerfile        -- docker config file
```

## Environment Constrol

``` bash
# node 
dev-version(8.5.0)
required-verison(7.0.+)

# mongodb
dev-version(3.4.0)

# 环信sdk
version(3.0)

# alicloud

```

## Before Build Setup -- Config

``` bash
# This application using the Node official Crypto.js module, Crypto.js provide RSA, AES encryption.
RSA -- KEY save in configs/rsa_priv.pem, configs/rsa_pub.pem
AES -- KEY save in app/utils/Constants.js. ASE_SCETKEY

# 融云
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
