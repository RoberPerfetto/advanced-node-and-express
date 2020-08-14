const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;

function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

module.exports = function(app, db) {
  
  app.route('/').get((req, res) => {
     res.render(process.cwd() + '/views/pug/index', { 
       title: 'Hello', 
       message: 'Please login', 
       showLogin: true, 
       showRegistration: true
     });
  });    

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.get('/auth/github', passport.authenticate('github'));

  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });
   
  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile', {username: req.user.username} );
  });

  app.route('/register').post((req, res, next) => {
    db.collection('users').findOne({ username: req.body.username }, function (err, user) {
        if(err) {
            next(err);
        } else if (user) {
            res.redirect('/');
        } else {
            const hash = bcrypt.hashSync(req.body.password, 12);
            db.collection('users').insertOne(
              {username: req.body.username,
               password: hash},
              (err, doc) => {
                  if(err) {
                      res.redirect('/');
                  } else {
                      next(null, user);
                  }
              }
            )
        }
    })},
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );
  
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
  
  app.route("/chat").get(ensureAuthenticated, function(req,res){
    res.render(process.cwd() + '/views/pug/chat.pug');
  });
}