import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { WebsocketService } from './websocket/websocket.service';
import * as express from 'express';
import * as fs from 'fs';
import * as https from 'https';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import * as socket from 'socket.io';
import * as jwt from 'jsonwebtoken';
import * as mysql from 'mysql2/promise';

async function bootstrap() {
  const server = express(); // Initialize Express as a function
  server.use(express.static('../public'));
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const websocketService = app.get(WebsocketService);
  await app.init();

  // Express middleware and routes can be used here
  dotenv.config();

  const privateKey = fs.readFileSync('key.pem', 'utf8');
  const certificate = fs.readFileSync('cert.pem', 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: process.env.CREDENTIALS_PASSPHRASE,
  };

  const httpsServer = https.createServer(credentials, server);
  const port = 443;

  const io = new socket.Server(httpsServer);
  websocketService.setIo(io);
  const connectedSockets = new Set();
  const jwtSecretKey = process.env.JWT_SECRET;
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  io.use((socket, next) => {
    const token = socket.handshake.query.token; // Get the token from the WebSocket handshake query

    // Verify the token (similar to how you verify access tokens)
    jwt.verify(token, jwtSecretKey, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = decoded; // Attach the user information to the socket
      connectedSockets.add(socket); // Add the socket to the connectedSockets set
      next();
    });
  });

  io.on('connection', async (socket) => {
    websocketService.addSocket(socket);
    console.log(`'${socket.user.username}' connected`);

    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        'SELECT sender_username, receiver_username, is_accepted FROM FriendRequests WHERE BINARY sender_username = ? OR BINARY receiver_username = ?',
        [socket.user.username, socket.user.username],
      );

      io.to(socket.id).emit('friendRequest', rows);
      connection.release(); // Release the connection back to the pool when done
    } catch (error) {
      console.error('Error executing SQL query:', error);
    }

    socket.on('refreshFriendRequests', async () => {
      try {
        const connection = await pool.getConnection();
        const [results] = await connection.execute(
          'SELECT sender_username, receiver_username, is_accepted FROM FriendRequests WHERE BINARY sender_username = ? OR BINARY receiver_username = ?',
          [socket.user.username, socket.user.username],
        );

        websocketService.emitToUser(
          socket.user.username,
          'friendRequest',
          results,
        );

        for (const result of results) {
          const friendRequestUsername =
            result.sender_username != socket.user.username
              ? result.sender_username
              : result.receiver_username;

          const [results] = await connection.execute(
            'SELECT sender_username, receiver_username, is_accepted FROM FriendRequests WHERE BINARY sender_username = ? OR BINARY receiver_username = ?',
            [friendRequestUsername, friendRequestUsername],
          );

          websocketService.emitToUser(
            friendRequestUsername,
            'friendRequest',
            results,
          );
        }

        connection.release();
      } catch (error) {
        console.error('Error executing SQL query:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`'${socket.user.username}' disconnected`);
      connectedSockets.delete(socket); // Remove the socket from the connectedSockets set
      websocketService.removeSocket(socket);
    });
  });

  httpsServer.listen(port, () => {
    console.log(`Server is running on port https://jchat.com`);
  });
}

bootstrap();
