const index = require('./index.server.routes');
const auth = require('./auth.server.routes');
const user = require('./user.server.routes');
const contact = require('./contact.server.routes');
const group = require('./group.server.routes');

module.exports = initRouter = app => {
  app.use('/', index);
  
  app.use('/v1/api/auth/', auth);
  app.use('/v1/api/user/', user);
  app.use('/v1/api/contact/', contact);
  app.use('/v1/api/group/', group);
}