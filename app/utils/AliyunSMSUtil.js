const SMSConfig = require('../../configs/config').SMSConfig;
/**
 * 云通信基础能力业务短信发送、查询详情以及消费消息。
 * Created on 2017-07-31
 */
const SMSClient = require('@alicloud/sms-sdk')

// ACCESS_KEY_ID/ACCESS_KEY_SECRET 根据实际申请的账号信息进行替换
const accessKeyId = SMSConfig.accessKeyId
const secretAccessKey = SMSConfig.secretAccessKey;
//初始化sms_client
let smsClient = new SMSClient({ accessKeyId, secretAccessKey })

exports.sendSMS = (mobile, content, cb) => {
    //发送短信
    smsClient.sendSMS({
        PhoneNumbers: mobile,
        SignName: SMSConfig.signName,
        TemplateCode: SMSConfig.templateCode,
        TemplateParam: `{"code": ${content}}`
    }).then(function (res) {
        let { Code } = res
        if (Code === 'OK') {
            //处理返回参数
            console.log(res)
            cb(res)
        }
    }, function (err) {
        console.log(err)
        cb(err)
    })
}