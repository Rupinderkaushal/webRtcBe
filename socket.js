const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.send('Hello World');
});

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Emit the user's own ID upon connection
    socket.emit("me", socket.id);

    // Create a new room or join an existing room
    socket.on("createOrJoinRoom", (roomId) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        const numClients = room ? room.size : 0;

        if (numClients === 0) {
            socket.join(roomId);
            socket.emit("roomCreated", roomId);
        } else if (numClients < 4) { // Assuming a maximum of 4 participants
            socket.join(roomId);
            socket.broadcast.to(roomId).emit("userJoined", socket.id);
        } else {
            socket.emit("roomFull", roomId);
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        // Notify the room that the user left
        for (let room of socket.rooms) {
            if (room !== socket.id) { // Exclude socket's personal room
                socket.broadcast.to(room).emit("userLeft", socket.id);
            }
        }
    });

    // Handle when a user starts calling another user
    socket.on("callUser", ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    });

    // Handle when a user answers a call
    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", { signal: data.signal, id: socket.id });
    });

    // Handle when a user sends their stream to the group
    socket.on("sendStream", ({ streamData, roomId }) => {
        socket.broadcast.to(roomId).emit("receiveStream", { streamData, from: socket.id });
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
