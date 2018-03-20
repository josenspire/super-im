module.exports = {
  db: {
    uri: "mongodb://127.0.0.1:27017/super-im",
    // url: 'mongodb://superim:Password520@127.0.0.1:27017/super-im',
    options: {
      useMongoClient: true,
      // user: '',
      // pass: '',
      // keepAlive: true,
      // reconnectTries: 30
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