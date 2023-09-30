import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as cookieParser from 'cookie-parser';
import * as multer from 'multer';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as https from 'https'; // Import https
import * as cors from 'cors';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as mysql from 'mysql2'; // Import mysql2
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // Specify the application type

  app.useStaticAssets(join(__dirname, '../../', 'public')); // Use join to create the correct path
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors());

  // Define multer storage and upload middleware for handling file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // Middleware for parsing JWT tokens and verifying them
  const jwtSecretKey = process.env.JWT_SECRET;
  const accessTokenExpiry = '15m';
  const refreshTokenExpiry = '15d';

  const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  function isValidUsername(username) {
    const validUsernameRegex = /^[a-zA-Z][a-zA-Z0-9._]{2,19}$/;
    return validUsernameRegex.test(username);
  }

  function isValidPassword(password) {
    if (password.length < 5 || password.length > 100) {
      return false;
    }

    const validCharactersRegex = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/;

    return validCharactersRegex.test(password);
  }

  const privateKey = fs.readFileSync('key.pem', 'utf8');
  const certificate = fs.readFileSync('cert.pem', 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: process.env.CREDENTIALS_PASSPHRASE,
  };

  // Create an HTTP server using the NestExpressApplication's underlying express instance
  const httpServer = https.createServer(credentials, app.getHttpAdapter().getInstance());

  const port = 443;
  const io = require('socket.io')(httpServer);

  // Maintain a list of connected sockets
  const connectedSockets = new Set();

  // Middleware to verify WebSocket connections
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

  await httpServer.listen(port, () => {
    console.log(`Server is running on port https://jchat.com`);
  });
}

bootstrap();
