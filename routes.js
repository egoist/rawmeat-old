/**
 * Module dependencies.
 */
var co = require('co');
var parse = require('co-body');
var render = require('./lib/render');
var bcrypt = require('co-bcrypt');
var moment = require('moment');
var marked = require('marked');

// Set up mongoDB
var Mongorito = require('mongorito');
var Model = Mongorito.Model;

Mongorito.connect('localhost/rmblog');

// Wrap mongoDB in generator goodness
var Posts = Model.extend({
    collection: 'posts'
});
var Users = Model.extend({
    collection: 'users'
});
var Settings = Model.extend({
    collection: 'settings'
});

// Global variables

co(function *(){
  var Me = yield Users.findOne();
  var Site = yield Settings.findOne();
  if (Me) {
    global.M = Me.attributes;
  }
  if (Site) {
    global.S = Site.attributes;
  }
})()

// Helpers

function cutstr(str, len) {
        var str_length = 0;
        var str_len = 0;
        str_cut = new String();
        str_len = str.length;
        for (var i = 0; i < str_len; i++) {
            a = str.charAt(i);
            str_length++;
            if (escape(a).length > 4) {
                str_length++;
            }
            str_cut = str_cut.concat(a);
            if (str_length >= len) {
                str_cut = str_cut.concat("...");
                return str_cut;
            }
        }
        if (str_length < len) {
            return str;
        }
}

// And now... the route definitions

 module.exports.unsigned = function *unsigned() {
  this.redirect('/signin');
 }

/**
 * Post listing.
 */
module.exports.list = function *list() {
  var postList = yield Posts.limit(10).skip(0).sort({created_at:-1}).find();
  for (var i in postList) {
    postList[i] = postList[i].attributes;
    var timestamp = Date.parse(postList[i].created_at)/1000;
    postList[i].created_at = moment(timestamp,'X').fromNow();
    postList[i].body = marked(postList[i].body);
  }
  this.body = yield render('list', { posts: postList });
};

/**
 * Show creation form.
 */
module.exports.add = function *add() {
  if (!this.session.username) this.redirect('/signin');
  else this.body = yield render('new');
};

/**
 * Show post :id.
 */
module.exports.show = function *show(id) {
  // check if id valid obj_id
  var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
  if (!checkForHexRegExp.test(id)) {
    this.body = 'invalid post id';
  } else {
    var post = yield Posts.findById(id);
    post = post.attributes;
    post.pagetitle = post.title || cutstr(post.body, 40);
    post.body = marked(post.body);
    var timestamp = Date.parse(post.created_at)/1000;
    post.created_at = moment(timestamp,'X').fromNow();
    if (!post) this.throw(404, 'invalid post id');
    var username = this.session.username;
    this.state = {
      session: this.session
    };
    this.body = yield render('show', { post: post, username: username });
  }

};

/**
 * Create a post.
 */
module.exports.create = function *create() {
  var post = yield parse(this);
  if (!post.title)
    delete post.title
  if (this.session.username && post.body) {
    post.created_at = new Date;
    post.updated_at = new Date;
    post = new Posts(post);
    yield post.save();
    this.redirect('/');
  } 
};

/**
 * Show edit form
 */
module.exports.edit = function *edit(id) {
  var post = yield Posts.findById(id);
  post = post.attributes;
  this.body = yield render('edit', { post: post });
};

/**
 * Update post
 */
module.exports.update = function *update(id) {
  var postOriginal = yield Posts.findById(id);
  postOriginal = postOriginal.attributes;
  var post = yield parse(this);
  if (this.session.username && post.body) {
    postOriginal = new Posts(postOriginal);
    postOriginal.set('title', post.title);
    postOriginal.set('body', post.body);
    postOriginal.set('updated_at', new Date);
    yield postOriginal.save();
    this.redirect('/post/' + id);
  }
};

/**
 * Remove post
 */
module.exports.remove = function *remove(id) {
  if (this.session.username) {
    yield Posts.remove({_id:id});
    this.redirect('/');
  }  
};

/**
 * Show signin/register form
 */
module.exports.sign = function *sign() {
  this.body = yield render('sign');
}; 

/**
 * User sign in
 */
 module.exports.signin = function *signin() {
  var user = yield parse(this);
  var userGet = yield Users.findOne({ username: user.username });
  if (typeof(userGet) != 'undefined') {
    userGet = userGet.attributes;
  }
  if (!userGet) {
    this.body = 'We can\'t find ' + user.username;
  } else if (yield bcrypt.compare(user.password, userGet.password)) {
    this.body = 'You\'re in, redirect to home';
    this.redirect('/');
    this.session.username = user.username;
  } else {
    this.body = 'Username and password do not match';
  }
};

/**
 * User sign out
 */
 module.exports.signout = function *signout() {
  this.session = {};
  this.redirect('/');
 }

/** 
 * User register
 */

module.exports.register = function *register() {
  var user = yield parse(this);
  var userGet = yield Users.findOne();
  if (typeof(userGet) != 'undefined') {
    userGet = userGet.attributes;
  }
  if (userGet) {
    this.body = 'Raw Meat can only be enojoyed by one person, register is not allowed for now.';
  } else  {
    if (user.username == '') {
      this.body = 'Your username can not be empty';
    } else if (!user.password && user.password != user.password_c) {
      this.body = 'You password doesn\'t match';
    } else {
      var salt = yield bcrypt.genSalt(10)
      var hash = yield bcrypt.hash(user.password, salt)
      user.password = hash;
      user.salt = salt;
      delete user.password_c;
      user = new Users(user);
      yield user.save();
      this.session.username = user.username;
      this.body = 'Everything is done, let\'s rock now!';
    }
    
  }
}







