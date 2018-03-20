module.exports = {
  db: {
    uri: "mongodb://47.95.250.204:27017/super-im",
    // url: 'mongodb://superim:Password520@47.95.250.204:27017/super-im',
    options: {
      useMongoClient: true,
    }
  },
  port: 3000,
  host: "127.0.0.1",
  log: {
    format: 'dev',
    fileLogger: {
      directoryPath: process.cwd(),
      fileName: 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  }
};
