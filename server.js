const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// مهم! موزیک‌ها درست سرو بشن
app.use('/music', express.static(path.join(__dirname, 'public/music')));
app.use(express.static('public'));

// فولدر موزیک
if (!fs.existsSync('./public/music')) {
  fs.mkdirSync('./public/music', { recursive: true });
}

const storage = multer.diskStorage({
  destination: './public/music/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // max 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل صوتی مجاز است!'));
    }
  }
});

app.post('/upload-music', upload.single('music'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'فایلی آپلود نشد' });
  }
  const musicUrl = '/music/' + req.file.filename;
  io.emit('new-music', musicUrl);
  res.json({ url: musicUrl });
});

// هندل ارورهای multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: 'فایل خیلی بزرگه یا مشکلی پیش اومد' });
  } else if (err) {
    res.status(400).json({ error: err.message });
  } else {
    next();
  }
});

io.on('connection', (socket) => {
  console.log('یوزی جدید اومد پارتی:', socket.id);
  socket.username = "ناشناس شیطون";
  socket.isMuted = false; // ⭐ وضعیت میوت اولیه
  socket.emit('current-users', Array.from(io.sockets.sockets.keys()).filter(id => id !== socket.id));
  socket.broadcast.emit('user-joined', socket.id);
  socket.emit('user-joined', socket.id);
  socket.on('set-name', (name) => {
    socket.username = name.trim() || "Brozone جون";
    io.emit('user-list', getUserList());
  });
  socket.on('toggle-mute', (muted) => {
    socket.isMuted = muted;
    io.emit('user-list', getUserList()); // ⭐ آپدیت لیست با میوت
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
    users.push({ id: s.id, name: s.username, isMuted: s.isMuted }); // ⭐ اضافه کردن isMuted
  }
  return users;
}

const PORT = process.env.PORT || 25565;
server.listen(PORT, () => console.log(`پارتی Brozone رو پورت ${PORT} استارت شد! 🔥🪩🎶`));
