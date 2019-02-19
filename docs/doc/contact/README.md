##### 1. 请求添加联系人
- API： http://{HOST}/{VERSION}/api/contact/requestContact
- Method： POST
- Desc： 请求添加联系人
- 请求示例：

```
{ 
    params: { 
        contactID: "59fbf016f1bbf808bac67d5c"
    }, 
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw=="
}

```

参数名 | 类型 | 说明 | 必含
---|---|---|---
contactID | String | 联系人userID | Yes
 
- 返回示例：

```

Success：
{
    status: 200,
    data: {},
    message: ""
}

Fail：
{
    status: 400,
    data: {},
    message: "This user is already your contact"
}
 
```

##### 2. 同意添加请求
- API： http://{HOST}/{VERSION}/api/contact/acceptContact
- Method： POST
- Desc： 添加联系人
- 请求示例：

```
{ 
    params: { 
        contactID: "59fbf016f1bbf808bac67d5c", 
        remarkName: ""
    }, 
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw=="
}

```


参数名 | 类型 | 说明 | 必含
contactID | String | 联系人userID | Yes
remarkName | String | 备注 | No
 
- 返回示例

```
Success：
{
    status: 200,
    data: {},
    message: ""
}

Fail：
{
    status: 400,
    data: {},
    message: "This user is already your friend"
}
 
```

##### 3. 拒绝添加请求
- API： http://{HOST}/{VERSION}/api/contact/rejectContact
- Method： POST
- Desc： 拒绝添加请求
- 请求示例：

```
{ 
    params: { 
        contactID: "59fbf016f1bbf808bac67d5c" 
    }, 
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw=="
}

```

- 请求参数:

参数名 | 类型 | 说明 | 必含
---|---|---|---
contactID | String | 联系人userID | Yes
 
- 返回示例：

```

Success：
{
    status: 200,
    data: {},
    message: ""
}

Fail：
{
    status: 400,
    data: {},
    message: "This user is already your contact"
}

```

##### 4. 删除联系人
- API： http://{HOST}/{VERSION}/api/contact/deleteContact
- Method： POST
- Desc： 删除用户联系人
- 请求示例：

```
{ 
    params: { 
        contactID: "59fbf016f1bbf808bac67d5c" 
    }, 
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw=="
}
```

- 参数解析: 

参数名 | 类型 | 说明 | 必含
---|---|---|---
contactID | String | 联系人userID | Yes

- 返回示例：

```
Success：
{
    status: 200,
    data: {},
    message: ""
}
Fail：
{
    status: 400,
    data: {},
    message: "This user is not your contact"
}

```

##### 5. 获取当前用户联系人列表信息
- API： http://{HOST}/{VERSION}/api/contact/getUserContacts
- Method： POST
- Desc： 获取用户联系人列表
- 请求示例：

```
{ 
    params: {}, 
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw=="
}

```

- 返回DATA参数解析: 

参数名 | 类型 | 说明 | 必含
---|---|---|---
user | Object | 用户信息 | Yes

- 返回示例：

```

Success：
{
    status: 200,
    data: {
        contacts:[
            {
                "userID": "59fbf016f1bbf808bac67d5c",
                "nickname": "james01",
                "avatar": "http://baidu.com",
                "signature": "",
                "sex": 0,
            },
            {
                "userID ": "59fbf016f1bbf808bac67d5c",
                "nickname": "james02",
                "avatar": "http://baidu.com",
                "signature": "",
                "sex": 0,
            }
        ]
    },
    message: ""
}

Fail：
{
    status: 400,
    data: {},
    message: "Server unknow error, get user contacts list fail"
}

```

##### 6. 获取当前用户黑名单列表
- API： http://{HOST}/{VERSION}/api/user/getBlackList
- Method： POST
- Desc： 获取用户黑名单列表
- 请求参数：null
- 返回DATA参数解析: 

参数名 | 类型 | 说明 | 必含
---|---|---|---
user | Object | 用户信息 | Yes
 
- 返回示例

```
Success：
{
    status: 200,
    data: {
        userList:[
            {
                "userID": "59fbf016f1bbf808bac67d5c",
                "nickname": "james01",
                "avatar": "http://baidu.com",
                "status": true,
                "signature": "",
                "sex": 1,
            },
            {
                "userID": "59fbf016f1bbf808bac67d5c",
                "nickname": "james02",
                "avatar": "http://baidu.com",
                "status": true,
                "signature": "",
                "sex": 2,
            }
        ]
    },
    message: ""
}

Fail：
{
    status: 400,
    data: {},
    message: "Server unknow error, get black list fail"
}

```

##### 7. 更新联系人备注
- API： http://{HOST}/{VERSION}/api/contact/updateRemark
- Method： POST
- Desc：更新联系人备注名
- 请求示例：

```
{ 
    params: { 
        contactID: "59fbf016f1bbf808bac67d5c", 
        remarkName: "BILIBILI" 
    }, 
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw=="
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
contactID | String | 联系人userID | Yes
remarkName | String | 备注 | Yes
 
- 返回示例：

```
Success：
{
    status: 200,
    data: {},
    message: ""
}
Fail：
{
    status: 400,
    data: {},
    message: "This user is not your contact"
}

```