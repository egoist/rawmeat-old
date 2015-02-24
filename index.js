
/**
 * Module dependencies.
 */

var logger = require('koa-logger');
var route = require('koa-route');
var path = require('path');
var serve = require('koa-static');
var session = require('koa-generic-session');
var redisStore = require('koa-redis');
var csrf = require('koa-csrf');
var koa = require('koa');
var app = module.exports = koa();

// middleware
app.use(logger());
csrf(app);

// Session middleware
app.keys = ['&*$(&@#)*@#^&*$@&#()@*@#*&'];
app.use(session({
  prefix: 'rawmeat:sess',
  key: 'rawmeat',
  store: redisStore(),
  cookie: {
    httpOnly: false,
    maxage: 86400*365*1000
  }
}));

// Static file middleware
app.use(serve(__dirname + '/static'));

// route middleware
var routes = require('./routes.js');

app.use(route.get('/', routes.list));
app.use(route.get('/signin', routes.sign));
app.use(route.post('/signin', routes.signin));
app.use(route.get('/register', routes.sign));
app.use(route.post('/register', routes.register));
app.use(route.get('/signout', routes.signout));
app.use(route.get('/post/new', routes.add));
app.use(route.get('/post/:id', routes.show));
app.use(route.post('/post', routes.create));
app.use(route.post('/post/:id', routes.update));
app.use(route.get('/post/:id/edit', routes.edit));
app.use(route.get('/post/:id/delete', routes.remove));

// listen
app.listen(3000);
console.log('People love what you did, Aaron. We are listening on port 3000');
