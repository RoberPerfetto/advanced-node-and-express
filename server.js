'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport = require('passport');
const session = require('express-session');
const mongo = require('mongodb').MongoClient;
const cors = require('cors');
const http = require('http').Server(express);
const routes = require('./routes.js');
const auth = require('./auth.js');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
//const MongoStore = require('connect-mongo')(session);
const sessionStore = new session.MemoryStore();

const app = express();

fccTesting(app); //For FCC testing purposes

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set up a template engine
app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  key: 'express.sid',
  store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());

mongo.connect(process.env.DATABASE, {useNewUrlParser: true}, (err, db) => {
  if (err) console.log('Database error: ' + err);
    console.log('Successful database connection');
  
    var db = db.db('TestDB');
    routes(app, db);
    auth(app,db);    
    
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });
    
    var server = app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
    
    const io = require('socket.io').listen(server);
  
    io.use(passportSocketIo.authorize({
      cookieParser: cookieParser,
      key:          'express.sid',
      secret:       process.env.SESSION_SECRET,
      store:        sessionStore 
    }));
  
    let currentUsers = 0;
    let usernames = [];   
    
    io.on('connection', socket => {
      
      currentUsers++;
      console.log('user ' + socket.request.user.username || socket.request.user.name + ' connected');
      io.emit('user', {name: socket.request.user.username || socket.request.user.name, currentUsers, connected: true});
      
      socket.on('chat message', (message) => io.emit('chat message', {name: socket.request.user.username || socket.request.user.name, message}));

      socket.on('disconnect', () => {
        currentUsers--;
        io.emit('user', {name: socket.request.user.username || socket.request.user.name, currentUsers, connected: false});
      });

    });
  }
);