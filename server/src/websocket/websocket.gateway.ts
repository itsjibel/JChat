import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class FrinedRequests {
  @WebSocketServer()
  server: Server;

  private io: Server;

  createSocket(io: Server) {
    this.io = io;
  }
}
