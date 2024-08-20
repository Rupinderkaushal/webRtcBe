// const app = require("express")();
// const server = require("http").createServer(app);
// const cors = require("cors");
// const io = require("socket.io")(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// app.use(cors());
// const PORT = process.env.PORT || 8080;
// app.get('/', (req, res) => {
//         res.send('Hello World');
// });

// io.on("connection", (socket) => {
//     socket.emit("me", socket.id);
//     socket.on("disconnect", () => {
//         socket.broadcast.emit("callEnded")
//     });
//     socket.on("callUser", ({ userToCall, signalData, from, name }) => {
//         io.to(userToCall).emit("callUser", { signal: signalData, from, name });
//     });
//     socket.on("answerCall", (data) => {
//         io.to(data.to).emit("callAccepted", data.signal)
//     });
// });
// server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

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

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello World');
});

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Emit the user's own ID upon connection
    socket.emit("me", socket.id);

    // Join a specific room (group) based on the provided room ID
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("userJoined", socket.id);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        io.emit("callEnded", socket.id);
    });

    // Handle when a user starts calling another user
    socket.on("callUser", ({ userToCall, signalData, from, name, roomId }) => {
        io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    });

    // Handle when a user answers a call
    socket.on("answerCall", (data) => {
        io.to(data.roomId).emit("callAccepted", { signal: data.signal, id: socket.id });
    });

    // Handle when a user sends their stream to the group
    socket.on("sendStream", ({ streamData, roomId }) => {
        socket.broadcast.to(roomId).emit("receiveStream", { streamData, from: socket.id });
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
