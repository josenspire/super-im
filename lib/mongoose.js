const config = require('../configs/env/index');
const chalk = require('chalk');
const path = require('path');
const glob = require('glob');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;  // mongoose 自带的 Promise 不支持 catch，因此替换

let loadModels = function () {

  let modelPatterns = glob.sync(path.resolve('./app/models/') + '/*.model.js');
  modelPatterns.forEach(modelPath => {
    require(modelPath);
  });
};

async function connect() {
  loadModels();
  let url = '';
  const dbConfig = config.db;
  if (dbConfig.username) {
    url = `mongodb://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  }
  else {
    url = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  }
  const db = await mongoose.connect(url, dbConfig.options).catch(error => {
    console.error(chalk.red('Could not connect to MongoDB!'));
    console.log(error);
  });
  // Enabling mongoose debug mode if required
  mongoose.set('debug', !!dbConfig.debug);
  return db;
}

async function disconnect(cb) {
  await mongoose.disconnect().catch(error => {
    console.info(chalk.red('Can not disconnected from MongoDB!'));
  });
  console.info(chalk.yellow('Disconnected from MongoDB.'));
}

module.exports = {
  connect,
  disconnect
};