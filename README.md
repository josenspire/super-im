# SuperIM
> A node server-side for service font-end IM application

## 项目简介
学习项目，主要使用了 Alicould 的短信服务，七牛云存储服务，融云的通信服务。纯 Node.js 开发，数据库使用的是 MongoDB。

当前版本为 v1.0.5，主要更新为替换掉了 RSA+AES 加解密通信的过程，改为 ECDH+AES 秘钥磋商，已实现完整通信流程，证书生成方法和算法操作过程在代码中均有体现。

## 环境要求

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

## 快速开始
### 服务配置 -- Config
``` bash
# This application using the Node official Crypto.js and Jsrsasign.js module.
ECC -- KEY save in configs/ecdh_priv.pem, configs/ecdh_pub.pem

# 融云
configs/IMConfig

# alicloud
configs/SMSConfig

```

### 构建运行
``` bash
# install dependencies
npm install

# if your network has limitation on npm.org, you may change the npm registry to your nearby vendor. Or use: cnpm install
e.g.npm config set registry https://registry.npm.taobao.org/

# serve with hot reload at localhost:3000, you may change the port under bin/www
npm run start

# run unit tests
npm run mocha-test

# use ava testing
ava xxx

```

## 目录结构

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
├───docs              -- doc
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

## Docker
> 默认配置数据库连接的是 127.0.0.1, cloud 上运行需要更改 docker 的 host 模式，否则会出现连不上本地数据库问题。另外 docker 默认命令是运行 prod 环境下的配置，请自行修改配置

```shell
# 获取默认仓库的 docker 镜像
$ docker pull josenspire/superim
$ docker run -d -p 3001:3000 --net=host [image ID]

```

> 构建 docker 镜像

```shell
$ git clone https://github.com/josenspire/super-im.git && cd super-im

$ docker build -t xxx/super-im . 

$ docker run -d -p 3001:3000 --net=host [image ID]

```

For detailed explanation on how things work, checkout the [Documentation](https://josenspire.github.io/super-im/ "Documentation")
