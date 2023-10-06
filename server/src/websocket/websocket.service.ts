import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class WebsocketService {
  private io: Server;
  private connectedSockets = new Set<Socket>();

  setIo(io: Server) {
    this.io = io;
  }

  addSocket(socket: Socket) {
    this.connectedSockets.add(socket);
  }

  removeSocket(socket: Socket) {
    this.connectedSockets.delete(socket);
  }

  getConnectedSockets() {
    return this.connectedSockets;
  }

  emitToUser(username: string, event: string, data: any) {
    for (const socket of this.connectedSockets) {
      if (username === socket.user.username) {
        this.io.to(socket.id).emit(event, data);
      }
    }
  }
}
