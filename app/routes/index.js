const index = require('./index.routes');
const auth = require('./auth.routes');
const user = require('./user.routes');
const contact = require('./contact.routes');
const group = require('./group.routes');

module.exports = initRouter = app => {
  app.use('/', index);
  
  app.use('/v1/api/auth/', auth);
  app.use('/v1/api/user/', user);
  app.use('/v1/api/contact/', contact);
  app.use('/v1/api/group/', group);
};