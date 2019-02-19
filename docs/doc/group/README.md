##### 1. 新建群组
- API： http://{HOST}/{VERSION}/api/group/create
- Method： POST
- Desc：新建群
- 请求示例：

```
{ 
    params: {
        "name": "测试群组1",
        "members": [{
            "userID": "5a41ee3cc5fefe50c4604447" 
        }, 
        {
            "userID": "5a7d0123f5ea7a472335632e"
        }]
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
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
Success：
{
    status: 200,
    data: {
        "group": {
            "createTime": "2018-02-09T09:05:03.341Z",
            "createBy": "5a41ec55ae0d113fb05ba1d8",
            "owner": "5a41ec55ae0d113fb05ba1d8",
            "members": [
                {
                    "userID": "5a41ec55ae0d113fb05ba1d8",
                    "status": 0,
                    "role": 0,
                    "alias": "jamestest001"
                },
                {
                    "userID": "5a41ee3cc5fefe50c4604447",
                    "status": 0,
                    "role": 0,
                    "alias": "德玛西亚之力"
                },
                {
                    "userID": "5a7d0123f5ea7a472335632e",
                    "status": 0,
                    "role": 0,
                    "alias": "德玛西亚之屁"
                }
            ],
            "avatar": null,
            "notice": "",
            "name": "测试群组1",
            "groupID": "5a7d643fc15f01050c5f541d"
        }
    },
    message: ""
}
Fail：
{
    status: 400,
    data: {},
    message: "Current user's group count is out of max user group count limit (10)"
}

``` 

##### 2. 群组添加组员
- API： http://{HOST}/{VERSION}/api/group/add
- Method： POST
- Desc：添加群成员
- 请求示例：

```
{ 
    params: {
        "name": "测试群组1",
		"members": [{
            "userID": "5a41ee3cc5fefe50c4604447"
        }, 
        {
            "userID": "5a7d0123f5ea7a472335632e"
        }]
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
members | Array | 群组成员 | YES

- members参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
userID | String | 组员userID | YES
alias | String | 组员别名(昵称) | YES

- 返回示例：

```
Success：
{
    status: 200,
    data: {
        "group": {
            "createTime": "2018-02-09T09:05:03.341Z",
            "createBy": "5a41ec55ae0d113fb05ba1d8",
            "owner": "5a41ec55ae0d113fb05ba1d8",
            "members": [
                {
                    "userID": "5a41ec55ae0d113fb05ba1d8",
                    "status": 0,
                    "role": 0,
                    "alias": "jamestest001"
                },
                {
                    "userID": "5a41ee3cc5fefe50c4604447",
                    "status": 0,
                    "role": 0,
                    "alias": "德玛西亚之力"
                },
                {
                    "userID": "5a7d0123f5ea7a472335632e",
                    "status": 0,
                    "role": 0,
                    "alias": "德玛西亚之屁"
                }
            ],
            "avatar": null,
            "notice": "",
            "name": "测试群组1",
            "groupID": "5a7d643fc15f01050c5f541d"
        }
    },
    message: ""
}
Fail：
{
    status: 400,
    data: {},
    message: "Current group's user count is out of max group user count limit (500)"
}

``` 

##### 3. 加入群组
- API： http://{HOST}/{VERSION}/api/group/join
- Method： POST
- Desc：用户主动加入某群
- 请求示例：

```
{ 
    params: {
        groupID: "5a8129cb2c448e31c889ce70"
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
token | String | 当前用户token | YES

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
    message: "Current group's user count is out of max group user count limit (500)"
}

``` 

##### 4. 踢出群组
- API： http://{HOST}/{VERSION}/api/group/kick
- Method： POST
- Desc：群主踢出群成员
- 请求示例：

```
{ 
    params: {
        groupID: "5a8129cb2c448e31c889ce70",
        targetUserID: "5a41ee3cc5fefe50c4604496"
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
targetUserID | String | 操作的用户 | YES
token | String | 当前用户token | YES

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
    message: "You do not have the right to do this"
}

``` 

##### 5. 退出群组
- API： http://{HOST}/{VERSION}/api/group/quit
- Method： POST
- Desc：当期用户主动退群
- 请求示例：

```
{ 
    params: {
        groupID: "5a8129cb2c448e31c889ce70"
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
token | String | 当前用户token | YES

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
    message: "You are not in current group"
}

``` 

##### 6. 解散群组
- API： http://{HOST}/{VERSION}/api/group/quit
- Method： POST
- Desc：群主 主动解散群
- 请求示例：

```
{ 
    params: {
        groupID: "5a8129cb2c448e31c889ce70"
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
token | String | 当前用户token | YES

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
    message: "You do not have the right to do this"
}

``` 


##### 7. 重命名群名称
- API： http://{HOST}/{VERSION}/api/group/rename
- Method： POST
- Desc：所有群组内用户都可以重命名所在群的群名称
- 请求示例：

```
{ 
    params: {
        groupID: "5a8129cb2c448e31c889ce70"，
        name: "新群名"
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
name | String | 群名 | YES
token | String | 当前用户token | YES

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
    message: "Server unknow error, update group name fail"
}

``` 

##### 8. 更新群公告
- API： http://{HOST}/{VERSION}/api/group/updateNotice
- Method： POST
- Desc：群主可以更新群公告
- 请求示例：

```
{ 
    params: {
        groupID: "5a8129cb2c448e31c889ce70"，
        notice: "新群名"
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
notice | String | 群公告 | YES
token | String | 当前用户token | YES

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
    message: "Your do not have right to do that"
}

``` 

##### 9. 更新群中个人别名
- API： http://{HOST}/{VERSION}/api/group/updateAlias
- Method： POST
- Desc：群主可以更新群公告
- 请求示例：

```
{ 
    params: {
        groupID: "5a8129cb2c448e31c889ce70"，
        alias: "群中展示名"
    },
    token: "3biuc+StGb0XIqe7ULTJNvZK/1jFtmFusIMYEkbc+UZ1T+oH6YIlHhpeVEWsmogXSj5xvi5cYhy5e6d3a9iF1Uy1WDf6lQ7KOrIgc+VinFv7MAIb2whLqw==",
}

```

- 请求参数解析:

参数名 | 类型 | 说明 | 必含
---|---|---|---
groupID | String | 群组ID | YES
alias | String | 别名 | YES
token | String | 当前用户token | YES

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
    message: "Your do not have right to do that"
}

``` 