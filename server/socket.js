const ChatModal = require('./models/ChatModal');

function Socket(io) {
    const onlineUsers = new Map();
    io.on("connection", (socket) => {
        console.log("new user " + socket.id);

        // Emit an event to all clients when a new user joins
        socket.broadcast.emit("new_user", { id: socket.id });

         // Emit user status as online immediately upon connection
        socket.on('user_connected', (userId) => {
            onlineUsers.set(userId, socket.id);
            // Send the new user's status to all clients
            io.emit('update_user_status', { userId, status: 'online' });

            // Send the list of all online users to the newly connected user
            socket.emit('online_users', Array.from(onlineUsers.keys()));

        });

        socket.on('join_room', (data) => {
            socket.join(data);
            console.log(`User With Id: ${socket.id} joined room: ${data}`);
        })
        // socket.on('join_room', (data) => {
        //     console.log("data",data)
        //     try {
        //         socket.join(data.room);
        //         onlineUsers.set(data.userId, socket.id);
        //         io.emit('update_user_status', { userId: data.userId, status: 'online' });
        //         console.log(`User with ID: ${socket.id} joined room: ${data.room}`);
        //     } catch (err) {
        //         console.error(`Error joining room: ${err}`);
        //     }
        // });

        socket.on("send", (data) => {
            // console.log(data, socket.id);
            ChatModal.create(data);
            socket.to(data.room).emit('receive', data);
            console.log("send")
        })

        socket.on("disconnect", () => {
            const disconnectedUserId = [...onlineUsers.entries()].find(([userId, sockId]) => sockId === socket.id)?.[0];
            if (disconnectedUserId) {
                onlineUsers.delete(disconnectedUserId);
                io.emit('update_user_status', { userId: disconnectedUserId, status: 'offline' });
            }
            console.log(`user left ${socket.id}`);
        })
    });
}

module.exports = Socket;