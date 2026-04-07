
const authSocket = require("./authSocket");
const likePost = require("./likes.post");


function initSockets(io) {

  io.use(authSocket);

  io.on('connection', (socket) => {
    likePost(io, socket);
    socket.on('disconnect', () => {});
  });
}
module.exports = initSockets;