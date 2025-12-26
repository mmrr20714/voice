const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('یوزی جدید اومد پارتی:', socket.id);
  socket.username = "ناشناس شیطون";

  socket.on('set-name', (name) => {
    socket.username = name.trim() || "Brozone جون";
    io.emit('user-list', getUserList());
  });

  socket.on('chat', (msg) => {
    io.emit('chat', { name: socket.username, msg });
  });

  socket.broadcast.emit('user-joined');
  socket.emit('user-list', getUserList());

  socket.on('signal', (data) => {
    socket.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
  });

  socket.on('disconnect', () => {
    io.emit('user-left');
    io.emit('user-list', getUserList());
  });
});

function getUserList() {
  const users = [];
  for (let s of io.sockets.sockets.values()) {
    users.push({ id: s.id, name: s.username });
  }
  return users;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`پارتی Brozone رو پورت ${PORT} استارت شد! 🔥🪩`));
