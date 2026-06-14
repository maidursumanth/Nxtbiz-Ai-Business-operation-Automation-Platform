let socketServer = null;

export function setSocketServer(io) {
  socketServer = io;
}

export function emitRealtime(eventName, payload) {
  if (socketServer) {
    socketServer.emit(eventName, payload);
  }
}
