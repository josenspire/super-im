const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const StringUtil = require('../app/utils/StringUtil')
const config = require('../configs/env/index');
const log4js = require('log4js');
const logger4js = log4js.getLogger('[Normal]');
const routers = require('../app/routes/index');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const _ = require('lodash');

var initCORS = app => {
  // CORS
  app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DEvarE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);           //  config cookie - send to server
    res.header("Access-Control-Max-Age", 60 * 60 * 1000 * 24 * 12); // "pre-check" request valid time
    res.header("X-Powered-By", ' 3.2.1');
    next();
  })
};

var initViewEngine = app => {
  // view engine setup
  app.set('views', path.join(__dirname, '../app/views'));
  app.set('view engine', 'ejs');
};

var initSession = app => {
  app.use(session({
    secret: StringUtil.randomString(32),
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
      // httpOnly: true,
    },
    store: new MongoStore({
      url: config.db.uri,
      collec: 'dbsession'
    })
  }));
};

var initMiddleware = app => {
  log4js.configure(path.join(__dirname, '../configs', 'log4jConfig.json'));
  app.use(log4js.connectLogger(logger4js));

  // uncomment after placing your favicon in /public
  app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
  app.use(logger('dev'));
  // config the http parser could handle json/text type.
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '../public')));
};

var initServerRouter = app => {
  routers(app);
};

var initErrorHandler = app => {
  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    // res.status(err.status || 500);
    // res.render('error');
    console.log('catch error', err);
    res.json({
      status: err.status || 500,
      data: {},
      message: _.toString(err),
    })
  });
}

module.exports.init = () => {
  const app = express();
  initCORS(app);
  initViewEngine(app);
  initSession(app);
  initMiddleware(app);
  initServerRouter(app);
  initErrorHandler(app);
  return app;
};
