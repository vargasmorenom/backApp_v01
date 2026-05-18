
const authSocket = require("./authSocket");
const likePost = require("./likes.post");


function initSockets(io) {

  io.use(authSocket);

  io.on('connection', (socket) => {
    const userId = socket.data.user?._id?.toString();
    if (userId) {
      socket.join(`user:${userId}`);
    }

    likePost(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnect id=${socket.id} userId=${userId} reason=${reason}`);
    });
  });
}
module.exports = initSockets;