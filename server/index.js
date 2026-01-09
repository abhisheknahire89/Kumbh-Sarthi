import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ip from 'ip';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow any origin for local dev
        methods: ["GET", "POST"]
    }
});

// In-memory store for emergencies
let emergencies = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send current state to new user
    socket.emit('initial-data', emergencies);

    // Handle new emergency report
    socket.on('report-emergency', (data) => {
        console.log('New Emergency:', data);
        emergencies.unshift(data);
        if (emergencies.length > 50) emergencies.pop(); // Keep last 50
        io.emit('emergency-update', { type: 'INSERT', data });
    });

    // Handle status update
    socket.on('update-status', ({ id, status }) => {
        console.log('Update Status:', id, status);
        const index = emergencies.findIndex(e => e.id === id);
        if (index !== -1) {
            emergencies[index].status = status;
            io.emit('emergency-update', { type: 'UPDATE', data: emergencies[index] });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3001;
const LOCAL_IP = ip.address();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Local Server running!`);
    console.log(`📡 WebSocket URL: http://${LOCAL_IP}:${PORT}`);
    console.log(`\n👉 Update services/localSocket.ts with this IP if needed.\n`);
});
