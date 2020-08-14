const mongo = require('mongodb').MongoClient;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;
const GitHubStrategy = require('passport-github').Strategy;


module.exports = function(app, db) {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
    
  passport.deserializeUser((id, done) => {
    db.collection('users').findOne({ _id: new ObjectID(id) }, (err, docUs) => {
      if(err) console.log(err)
      if(docUs) {
        done(null, docUs);
      } else {
        db.collection('socialusers').findOne({ _id: new ObjectID(id) }, (err, docSo) => {
          if(err) console.log(err)
          if(docSo) {
            done(null,docSo)
          } 
        })
      }
    });
  });
    
  passport.use(new LocalStrategy((username, password, done) => {
    db.collection('users').findOne({ username: username }, (err, user) => {
      console.log('User ' + username + ' attempted to log in.');
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password))  return done(null, false);
      return done(null, user);
    });
  })); 
  
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://ffc-advanced-node-and-express.glitch.me/auth/github/callback"
    }, (accessToken, refreshToken, profile, cb) => {
        db.collection('socialusers').findAndModify(
          { id: profile.id }, 
          {},
          { $setOnInsert: {
             id: profile.id,
             name: profile.username || 'John Doe',
             email: profile.emails ? profile.emails[0].value : 'No email', 
             created_on: new Date(),
             provider: profile.provider || ''
          },$set:{
             last_login: new Date()
          },$inc:{
             login_count: 1
            }
          },
          {upsert:true, new: true}, //Insert object if not found, Return new object after modify
            (err, doc) => {
               if (err) console.log(err)
               console.log(doc.value)
               return cb(null, doc.value);
            }
        );
      }
  ));
}