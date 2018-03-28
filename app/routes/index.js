let index = require('./index.server.routes');
let auth = require('./auth.server.routes');
let user = require('./user.server.routes');
let contact = require('./contact.server.routes');
let group = require('./group.server.routes');

module.exports = initRouter = app => {
  app.use('/', index);
  
  app.use('/v1/api/auth/', auth);
  app.use('/v1/api/user/', user);
  app.use('/v1/api/contact/', contact);
  app.use('/v1/api/group/', group);
}