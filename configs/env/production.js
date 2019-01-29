module.exports = {
  db: {
    // uri: "mongodb://jamesy:Password1!@127.0.0.1:27017/superim",
    // 'mongodb://username:password@host:port/database?options...'
    username: "jamesy",
    password: "Password1!",
    host: "127.0.0.1",
    port: "27017",
    database: 'superIm',
    options: {
      useNewUrlParser: true,
      // keepAlive: true,
      // reconnectTries: 30,
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
