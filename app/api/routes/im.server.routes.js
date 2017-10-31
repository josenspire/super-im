module.exports = function (app) {
  let controller = require('../controllers/im.server.controller');
  app.route('/api/user/regist').get(controller.userRegister);
};

