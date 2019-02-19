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

## 接口文档

### 使用须知

!> 本项目仅供学习使用；

!> 为了方便使用，默认使用本地数据库作为测试环境，另外使用阿里云 sms 服务、融云服务、七牛云服务等均需要更改为自己的账号下的 ID，秘钥使用；

!> 该版本对融云聊天服务进行了简单包装，如若需要更换其他第三方服务，可以自行替换，具体参见代码；

!> 所有接口均进行了 [ECDH+AES](https://josenspire.github.io/2019/01/31/ECC-ECDH/) 磋商和加密，以中间件的形式模拟了 AOP 的做法，如若需要去掉加密环节，可以自行替换 输入/输出 中间件;

!> 加密参数说明：请求格式分为三个参数，格式如下
```
  {
    "data": "加密的请求数据",
    "secretKey": "客户端公钥",
    "signature": "签名",
  }
```
> 请求数据 data 说明，请求数据的协议如下：

```
data = {
  "params": "xxx",   (必须)
  "token": "xxx",    (部分接口必须)
  "deviceID": "xxx", (可选，用于单点登录和身份识别)
  "extension": "xxx",(可选，扩展字段)
}
```

!> 数据响应格式分为两个参数：

```
{
  "data": "gIExuGITMA1Xe4Hb9H0o7w==",
  "signature": "MEUCIGjtC5fxOWxgVGsqKAhM2+sB/UKbAIGT66pmM6DqedlTAiEAguL3msV+uKx41slIYS2aq04atOlhjytylTiV0onTcZA="
}
```
> 相应数据 data 说明，响应数据的协议如下：

```
data = {
  "status":  200,
  "data":    {Object},
  "message": "xxx"
}
```

### 获取手机验证码
- API： `http://{HOST}/{VERSION}/api/auth/obtainSMSCode`
-	Method： `POST`
-	Desc： `获取手机验证码`
- Note: `codeType: REGISTER/LOGIN`,
- Demo: 
```
{
	"params": {
		"codeType": "REGISTER",
		"telephone": "13631210005"
	},
	"extension": {
		"OS": "Mobile"
	}
}
```

- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 用户注册
- API： `http://{HOST}/{VERSION}/api/auth/register`
-	Method： `POST`
-	Desc： `用户注册`
- Note: -
- Demo: 
```
{
	"params": {
		"user": {
			"codeType": "REGISTER",
			"verifyCode": "",
			"telephone": "13631210005",
			"password": "123456",
			"nickname": "Jamestest5",
			"sex": 0,
			"birthday": "2018-01-01",
			"location": "ZHA",
			"signature": "This guy is lazy. He doesn't fill in anything...",
			"deviceID": "OS-MI5S-6611"	
		},
		"verifyCode": "89236"
	},
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 用户注册
- API： `http://{HOST}/{VERSION}/api/auth/login`
-	Method： `POST`
-	Desc： `用户注册`
- Note: -
- Demo: 
```
{
	"params": {
		"user": {
			"telephone": "13631210005",
			"password": "123456",
			"deviceID": "OS-MI5S-6622"
		},
		"verifyCode": ""
	},
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 获取用户个人信息
- API： `http://{HOST}/{VERSION}/api/user/getUserProfile`
-	Method： `POST`
-	Desc： `获取用户个人信息`
- Note: -
- Demo: 
```
{
	"params": {
		"targetUserID": "5c623c26f07dab3e30a85633"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 更新用户个人信息
- API： `http://{HOST}/{VERSION}/api/user/getUserProfile`
-	Method： `POST`
-	Desc： `更新用户个人信息`
- Note: -
- Demo: 
```
{
	"params": {
		"birthday": "2018-01-01T00:00:00.000Z",
        "signature": "This guy is lazy. He doesn't fill in anything...",
        "location": "ZHA",
        "nickname": "Jamestest4",
        "sex": "1"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 搜索用户
- API： `http://{HOST}/{VERSION}/api/user/searchUser`
-	Method： `POST`
-	Desc： `搜索用户`
- Note: `nickname/telephone，精确搜索`
- Demo: 
```
{
	"params": {
		"queryCondition": "Jamestest4",
		"pageIndex": 0
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 获取用户临时ID（可以用生成二维码）
- API： `http://{HOST}/{VERSION}/api/user/getTempUserID`
-	Method： `POST`
-	Desc： `获取用户临时ID（可以用生成二维码）`
- Note: -
- Demo: 
```
{
	"params": {},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 获取用户资料（根据临时ID）
- API： `http://{HOST}/{VERSION}/api/user/getUserProfileByTempUserID`
-	Method： `POST`
-	Desc： `获取用户资料（根据临时ID）`
- Note: -
- Demo: 
```
{
	"params": {
		"tempUserID": "f3b1cbeb-c48e-41f2-8306-29ed3025a503"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 新建群组
- API： `http://{HOST}/{VERSION}/api/group/create`
-	Method： `POST`
-	Desc： `新建群组`
- Note: -
- Demo: 
```
{
	"params": {
		"name": "测试群组1",
		"members": ["5c6121f8bd49df547ce6f8c4", "5c6122c2bd49df547ce6f8ca"]
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
name | String | 群组名称 | YES
members | Array | 群组成员 | YES

- members参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
userID | String | 组员userID | YES
alias | String | 组员别名(昵称) | YES

- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 群组添加组员
- API： `http://{HOST}/{VERSION}/api/group/add`
-	Method： `POST`
-	Desc： `群组添加组员`
- Note: -
- Demo: 
```
{
	"params": {
		"groupID": "5c6390f8f894d761a0d638ec",
		"members": ["5c64de4b9daded284c3bbd3d"]
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 加入群组
- API： http://{HOST}/{VERSION}/api/group/join
-	Method： `POST`
-	Desc： `加入群组`
- Note: -
- Demo: 
```
{
	"params": {
		"groupID": "5c6390f8f894d761a0d638ec"
	},
	"token": "O9h7/8zQNCJE4bwuh4NrheEpfYqEftD4cAyfJUGDVBn8smSDKoUj3ZOxdbhFd3iSLZpzVk67NbEaKXffTiiaAjIgBwOT8b1PKZVGnqXRF9JRQVX9mxe2WA==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 踢出群组
- API： http://{HOST}/{VERSION}/api/group/kick
-	Method： `POST`
-	Desc： `踢出群组`
- Note: -
- Demo: 
```
{
	"params": {
		"groupID": "5c6390f8f894d761a0d638ec",
		"targetUserID": "5c64de4b9daded284c3bbd3d"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 解散群组
- API： http://{HOST}/{VERSION}/api/group/dismiss
-	Method： `POST`
-	Desc： `解散群组`
- Note: -
- Demo: 
```
{
	"params": {
		"groupID": "5c650ade15e4d51ea05acca5"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 重命名群名称
- API： http://{HOST}/{VERSION}/api/group/rename
-	Method： `POST`
-	Desc： `重命名群名称`
- Note: -
- Demo: 
```
{
	"params": {
		"groupID": "5c650b2815e4d51ea05accaa",
		"name": "改名测试444"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 更新群公告
- API： http://{HOST}/{VERSION}/api/group/updateNotice
-	Method： `POST`
-	Desc： `更新群公告`
- Note: -
- Demo: 
```
{
	"params": {
		"groupID": "5c650b2815e4d51ea05accaa",
		"notice": "测试内容的This collection includes"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 更新群中个人别名
- API： http://{HOST}/{VERSION}/api/group/updateAlias
-	Method： `POST`
-	Desc： `更新群中个人别名`
- Note: -
- Demo: 
```
{
  params: {
      groupID: "5a8129cb2c448e31c889ce70"，
      alias: "群中展示名"
  },
  token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 获取个人所有群信息
- API： http://{HOST}/{VERSION}/api/group/getGroups
-	Method： `POST`
-	Desc： `获取个人所有群信息`
- Note: -
- Demo: 
```
{
	"params": {},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 获取群组临时ID（用于生成二维码）
- API： http://{HOST}/{VERSION}/api/group/getTempGroupID
-	Method： `POST`
-	Desc： `获取群组临时ID（用于生成二维码）`
- Note: -
- Demo: 
```
{
	"params": {
		"groupID": "5c650b2815e4d51ea05accaa"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 获取群组资料（根据临时ID）
- API： http://{HOST}/{VERSION}/api/group/getGroupByTempGroupID
-	Method： `POST`
-	Desc： `获取群组资料（根据临时ID）`
- Note: -
- Demo: 
```
{
	"params": {
		"tempGroupID": "14db3cd1-5b69-4c3e-a412-f71daf8b7d1c"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 请求添加联系人
- API： http://{HOST}/{VERSION}/api/group/requestContact
-	Method： `POST`
-	Desc： `请求添加联系人`
- Note: -
- Demo: 
```
{
	"params": {
		"contactID": "5c6122c2bd49df547ce6f8ca",
		"reason": "我就是想试试加你好友"
	},
	"token": "5Ec5OabtR0UkmHavykVuuuEpfYqEftD4cAyfJUGDVBn8smSDKoUj3WLESfP4bV699cs3SPrHCPbNKlTK2+4yCFXQJiyUkJ4IgGHqXNaMcPMdDeWXQ5Gb/A==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 同意添加联系人
- API： http://{HOST}/{VERSION}/api/group/acceptContact
-	Method： `POST`
-	Desc： `同意添加联系人`
- Note: -
- Demo: 
```
{
	"params": {
		"contactID": "5c623c26f07dab3e30a85633",
		"remarkName": "我就是想试试加你好友"
	},
	"token": "O9h7/8zQNCJE4bwuh4NrheEpfYqEftD4cAyfJUGDVBn8smSDKoUj3ZOxdbhFd3iSLZpzVk67NbEaKXffTiiaAjIgBwOT8b1PKZVGnqXRF9JRQVX9mxe2WA==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 拒绝添加联系人
- API： http://{HOST}/{VERSION}/api/group/rejectContact
-	Method： `POST`
-	Desc： `拒绝添加联系人`
- Note: -
- Demo: 
```
{
	"params": {
		"contactID": "5c623c26f07dab3e30a85633",
		"reason": "我不想让你加我"
	},
	"token": "O9h7/8zQNCJE4bwuh4NrheEpfYqEftD4cAyfJUGDVBn8smSDKoUj3ZOxdbhFd3iSLZpzVk67NbEaKXffTiiaAjIgBwOT8b1PKZVGnqXRF9JRQVX9mxe2WA==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 删除联系人
- API： http://{HOST}/{VERSION}/api/group/deleteContact
-	Method： `POST`
-	Desc： `删除联系人`
- Note: -
- Demo: 
```
{
	"params": {
		"contactID": "5c623c26f07dab3e30a85633"
	},
	"token": "O9h7/8zQNCJE4bwuh4NrheEpfYqEftD4cAyfJUGDVBn8smSDKoUj3ZOxdbhFd3iSLZpzVk67NbEaKXffTiiaAjIgBwOT8b1PKZVGnqXRF9JRQVX9mxe2WA==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 更新联系人备注信息
- API： http://{HOST}/{VERSION}/api/group/updateRemark
-	Method： `POST`
-	Desc： `更新联系人备注信息`
- Note: -
- Demo: 
```
{
	"params": {
		"contactID": "5c623c26f07dab3e30a85633",
		"remark": "新名字"
	},
	"token": "O9h7/8zQNCJE4bwuh4NrheEpfYqEftD4cAyfJUGDVBn8smSDKoUj3ZOxdbhFd3iSLZpzVk67NbEaKXffTiiaAjIgBwOT8b1PKZVGnqXRF9JRQVX9mxe2WA==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

### 获取当前用户联系人列表信息
- API： http://{HOST}/{VERSION}/api/group/getContacts
-	Method： `POST`
-	Desc： `获取当前用户联系人列表信息`
- Note: -
- Demo: 
```
{
	"params": {},
	"token": "O9h7/8zQNCJE4bwuh4NrheEpfYqEftD4cAyfJUGDVBn8smSDKoUj3ZOxdbhFd3iSLZpzVk67NbEaKXffTiiaAjIgBwOT8b1PKZVGnqXRF9JRQVX9mxe2WA==",
	"extension": {
		"OS": "Mobile"
	}
}
```
- 返回示例：
```
{
    status: 200,
    data: {},
    message: ""
}
```

## 未完待续
> 未来将会继续补充，更新

## 关于此文档
此文档由 [docsify](https://github.com/QingWei-Li/docsify/) 生成 docsify 是一个动
态生成文档网站的工具。不同于 GitBook、Hexo 的地方是它不会生成将 .md 转成 .html
文件，所有转换工作都是在运行时进行

## License
[The MIT License (MIT)](https://github.com/josenspire/super-im/blob/master/LICENSE)