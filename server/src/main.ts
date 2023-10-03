import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as fs from 'fs';
import * as https from 'https';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

async function bootstrap() {
  const server = express();
  server.use(express.static('../public'));
  server.use(express.json());
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );
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

  httpsServer.listen(port, () => {
      console.log(`Server is running on port https://jchat.com`);
  });
}

bootstrap();
