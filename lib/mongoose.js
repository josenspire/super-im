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
  let db = await mongoose.connect(config.db.uri, config.db.options).catch(error => {
    console.error(chalk.red('Could not connect to MongoDB!'));
    console.log(error);
  });
  // Enabling mongoose debug mode if required
  mongoose.set('debug', !!config.db.debug);
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