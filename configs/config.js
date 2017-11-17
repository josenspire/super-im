
exports.IMConfig = {
    host: 'a1.easemob.com',
    appKey: 'jokerdemo#im-node',
    org_name: 'jokerdemo',
    app_name: 'im-node',
    client_id: 'YXA64mUcQKJ1Eeee2VHIeCUVVg',
    client_secret: 'YXA6xacnSUkKwJG40rcGIwwyvZ3JTFU',
    // ca: 'resources/cacert/cacert.pem'
    ca: ''
}

exports.SMSConfig = {
    // accessKeyId: "LTAI74WHaxSZiyC3",  //阿里短信服务所用的密钥ID
    // secretAccessKey: "MptxNQw0puzat32v0H9lJLpsATthbO", //阿里短信服务所用的密钥值
    accessKeyId: "LTAIca0v4DrhU81u",
    secretAccessKey: "H65d6yImmUoqtP98U3NqSBVa3o9Jdo",
    signName: '叶智星',
    templateCode: 'SMS_105035046',
}

exports.QiniuConfig = {
    AccessKey: "so69n4btTsYen3Yb7lLdld6zkAKC_sqXHKJyEEAO",
    SecretKey: "440cXCFAl-d45ZDQXs3-YrL5oliYOuTMZdNtXYPJ",

    // target zoom
    Bucket: 'superim'
}