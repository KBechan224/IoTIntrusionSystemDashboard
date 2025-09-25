// Load environment configuration first
const environment = require('./config/env');
const { appLogger } = require('./utils/logger');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var { engine } = require('express-handlebars');

// Import database connection
const db = require('./config/database');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var dashboardRouter = require('./routes/dashboard');
var devicesRouter = require('./routes/devices');
var alertsRouter = require('./routes/alerts');
var deviceAccessRouter = require('./routes/deviceAccess');

// Import authentication middleware
const { attachUser, redirectIfAuth } = require('./middleware/auth');

var app = express();

// view engine setup
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts/'),
  partialsDir: path.join(__dirname, 'views/partials/'),
  helpers: {
    eq: function(a, b) {
      return a === b;
    }
  }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(logger(environment.logging.loggerFormat));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: environment.session.secret,
  resave: environment.session.resave,
  saveUninitialized: environment.session.saveUninitialized,
  cookie: environment.session.cookie
}));

app.use(express.static(path.join(__dirname, 'public')));

// Make user session available to all templates
app.use(attachUser);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/device-access', deviceAccessRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/alerts', alertsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  appLogger.info('Received SIGINT. Graceful shutdown');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  appLogger.info('Received SIGTERM. Graceful shutdown');
  await db.close();
  process.exit(0);
});

module.exports = app;
