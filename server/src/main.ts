import * as express from 'express';
import * as fs from 'fs';
import * as https from 'https';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';

async function bootstrap() {
  const app = express();

  // Load SSL certificate and private key
  const privateKey = fs.readFileSync('key.pem', 'utf8');
  const certificate = fs.readFileSync('cert.pem', 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: process.env.CREDENTIALS_PASSPHRASE,
  };

  // Create an HTTPS server
  const httpsServer = https.createServer(credentials, app);

  // Middleware
  app.use(express.static('../public'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors());

  const port = 443;
  httpsServer.listen(port, () => {
    console.log(`Server is running on port https://jchat.com`);
  });
}

bootstrap();
