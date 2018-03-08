const multer = require('multer')
const bytes = require('bytes')
const uuidv4 = require('uuid/v4');

let storage = multer.diskStorage({
    //设置上传文件路径,以后可以扩展成上传至七牛,文件服务器等等
    destination: "public/qiniu/avatar/",
    //给上传文件重命名
    filename: function (req, file, cb) {
        let fileFormat = (file.originalname).split(".");
        // cb(null, file.fieldname + "." + fileFormat[fileFormat.length - 1]);
        cb(null, uuidv4() + "." + fileFormat[fileFormat.length - 1]);
    }
});

//添加配置文件到muler对象。
let upload = multer({
    storage: storage,
    limits: {
        fileSize: bytes('2MB') // 限制文件大小
    },
    fileFilter: (req, files, callback) => {
        // 只允许上传 jpg|png|jpeg|gif|svg 格式的文件
        var type = '|' + files.mimetype.slice(files.mimetype.lastIndexOf('/') + 1) + '|';
        // var fileTypeValid = '|jpg|png|jpeg|gif|svg'.indexOf(type) !== -1;
        // callback(null, !!fileTypeValid);
        callback(null, true);
    }
});

module.exports = upload;