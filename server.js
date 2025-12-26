const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('یوزی جدید اومد پارتی:', socket.id);
  socket.username = "ناشناس شیطون";

  // به خودش لیست کاربرهای فعلی رو بده (بدون خودش)
  socket.emit('current-users', Array.from(io.sockets.sockets.keys()).filter(id => id !== socket.id));

  // به همه بگو یکی جدید اومد (با آیدی)
  socket.broadcast.emit('user-joined', socket.id);

  // به خودش هم بگو که سوند جوین پخش کنه
  socket.emit('user-joined', socket.id);

  socket.on('set-name', (name) => {
    socket.username = name.trim() || "Brozone جون";
    io.emit('user-list', getUserList());
  });

  socket.on('chat', (msg) => {
    io.emit('chat', { name: socket.username, msg });
  });

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

const PORT = process.env.PORT || 25565;
server.listen(PORT, () => console.log(`پارتی Brozone رو پورت ${PORT} استارت شد! 🔥🪩`));
