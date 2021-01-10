var express = require('express');
var path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const botName = 'Admin';

var app = express();

/** creating a server */
const server = http.createServer(app);
const io = socketio(server);
/** adding a PORT */
const PORT = 3001 || process.env.PORT;

server.listen(PORT , () => console.log(`Server running on port ${PORT}`));

/** Run when a client connects */
io.on('connection', (socket) => {
  /** Listen to the user joining the room from the main js  */
  socket.on('joinRoom', ({username, room})=> {
  /** creating the user object and sending params to the users util*/
  const user = userJoin(socket.id, username, room);

  socket.join(user.room);

  /** Welcome new user */
  socket.emit('message', formatMessage(botName, 'Welcome to chat app'));
  /** broadcasts to a specific room when a user connects */
  socket.broadcast
  .to(user.room)
  .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

  /** Send users and room info  */
  io
  .to(user.room).emit('roomUsers', {
    room: user.room,
    users: getRoomUsers(user.room)
    });
  });


  /** Catching the typed message from the main js */
  socket.on('chatMessage', (message) => {
    /** Getting the current user */
    const user = getCurrentUser(socket.id);

    io
    .to(user.room)
    .emit('message', formatMessage(user.username, message));
  });
  
  /** Runs when client disconnects */
  socket.on('disconnect', () => {
    /** Get user who left  */
    const user = userLeave(socket.id);

    if(user) {
      io
      .to(user.room)
      .emit('message', formatMessage(botName, `${user.username}  has left the chat... `));

    /** Send users and room info  */
      io
      .to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

});

/** Setting the static folder */
app.use(express.static(path.join(__dirname, 'public')));


module.exports = app;
