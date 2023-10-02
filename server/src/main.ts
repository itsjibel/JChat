import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as mysql from 'mysql2';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as https from 'https';
import * as cookieParser from 'cookie-parser';
import * as multer from 'multer';
import * as nodemailer from 'nodemailer';
import * as cors from 'cors';
import * as dotenv from 'dotenv';

const app = express();
app.use(express.static('../public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
dotenv.config();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const jwtSecretKey = process.env.JWT_SECRET;
const accessTokenExpiry = '15m';
const refreshTokenExpiry = '15d';

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.post('/api/signup', (req, res) => {
});

app.post('/api/login', (req, res) => {
});

function verifyRefreshToken(req, res, next) {
  const refreshToken = req.headers.authorization?.split(' ')[1];
  if (refreshToken) {
      jwt.verify(refreshToken, jwtSecretKey, (err, decoded) => {
          if (err) {
              return res.status(403).json({ message: 'Invalid refresh token' });
          }
          req.user = decoded;
          next();
      });
  } else {
      return res.status(403).json({ message: 'Refresh token not provided' });
  }
}

app.get('/api/checkLoggedIn', verifyRefreshToken, (req, res) => {
});

function verifyAccessToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
      return res.status(403).json({ message: 'Access token not provided' });
  }

  jwt.verify(token, jwtSecretKey, (err, decoded) => {
      if (err) {
          return res.status(403).json({ message: 'Invalid access token' + token });
      }

      req.user = decoded; // Attach the user information to the request object
      next(); // Continue to the next middleware or route handler
  });
}

app.get('/api/profile/:username', verifyAccessToken, (req, res) => {
});

app.post('/api/refreshAccessToken', (req, res) => {
});

const revokedTokens = [];

app.post('/api/logout', (req, res) => {
});

app.post('/api/editProfile/:username', verifyAccessToken, upload.single('pfp'), (req, res) => {
});

app.post('/api/sendVerificationEmail', verifyAccessToken, (req, res) => {
});

app.get('/api/verifyUserEmail', (req, res) => {
});

app.post('/api/sendPasswordRecoveryEmail', (req, res) => {
});

app.get('/api/isValidRecoverPasswordToken', (req, res) => {
});

app.get('/api/recoverUserPassword', (req, res) => {
});

const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  passphrase: process.env.CREDENTIALS_PASSPHRASE,
};

const httpsServer = https.createServer(credentials, app);
const port = 443;

// WebSocket and other server setup here

httpsServer.listen(port, () => {
  console.log(`Server is running on port https://jchat.com`);
});