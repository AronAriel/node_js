const { Server } = require("socket.io");

let ioInstance = null;

function initNotifications(server) {
  ioInstance = new Server(server, {
    cors: { origin: "*" }
  });
}

function notifyArticleCreated(article) {
  if (!ioInstance) return;
  ioInstance.emit("article:created", article);
}

function notifyArticleUpdated(article) {
  if (!ioInstance) return;
  ioInstance.emit("article:updated", article);
}

function notifyArticleDeleted(id) {
  if (!ioInstance) return;
  ioInstance.emit("article:deleted", { id });
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initNotifications,
  notifyArticleCreated,
  notifyArticleUpdated,
  notifyArticleDeleted,
  getIO
};
