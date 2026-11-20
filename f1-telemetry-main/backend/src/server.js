const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const raceRoutes = require('./routes/raceRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/races', raceRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Socket.io integration
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join:race', (raceId) => {
    socket.join(`race:${raceId}`);
    console.log(`Socket ${socket.id} joined race ${raceId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes Placeholder
app.get('/health', (req, res) => res.send('Backend is operational'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`F1 Telemetry Backend running on port ${PORT}`);
});

module.exports = { io, server, app };
