import {
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Connection } from 'mysql2/promise';
import { promisify } from 'util';
import { readFile } from 'fs';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
const revokedTokens = [];

function isTokenValid(token) {
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    return decoded.username;
  } catch (error) {
    return undefined;
  }
}

function isValidUsername(username) {
  const validUsernameRegex = /^[a-zA-Z][a-zA-Z0-9._]{2,19}$/;
  return validUsernameRegex.test(username);
}

function isValidPassword(password) {
  if (password.length < 5 || password.length > 100) return false;

  const validCharactersRegex = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/;

  return validCharactersRegex.test(password);
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @Inject('MYSQL_CONNECTION') private readonly connection: Connection,
  ) {}

  async signIn(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Hash the incoming password using SHA-256
    password = createHash('sha256').update(password).digest('hex');

    // Compare the hashed password with the stored hashed password
    if (user.password !== password) {
      throw new UnauthorizedException();
    }

    // Create a payload object
    const payload = { username, jwtSecretKey };

    // Generate access and refresh tokens using the payload and set expiry times
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: accessTokenExpiry,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: refreshTokenExpiry,
    });

    console.log(`'${username}' successfully logged in!`);

    return {
      accessToken,
      refreshToken,
    };
  }

  async signUp(
    username: string,
    email: string,
    password: string,
  ): Promise<any> {
    if (!isValidUsername(username)) {
      throw new BadRequestException(
        "Invalid username. A username must start with a letter, be between 3 and 20 characters long, and can contain letters, numbers, '.', '_', and no spaces.",
      );
    }

    if (!isValidPassword(password)) {
      throw new BadRequestException(
        'Invalid password. Only use valid characters and lengths between 5-100.',
      );
    }

    try {
      // Query the database to find a user by username
      const [rows] = await this.connection.execute(
        'SELECT * FROM Users WHERE BINARY username = ? OR email = ?',
        [username, email],
      );

      // Check if a username or email is already in use
      if (rows[0] != undefined) {
        throw new ConflictException('Username or email already in use.');
      } else {
        password = createHash('sha256').update(password).digest('hex');
        const defaultProfilePicturePath =
          '../public/assets/images/new_user_pfp.jpg';
        const readFileAsync = promisify(readFile);
        const imageBinaryData = await readFileAsync(defaultProfilePicturePath);

        await this.connection.execute(
          'INSERT INTO Users (username, password, email, pfp) VALUES (?, ?, ?, ?)',
          [username, password, email, imageBinaryData],
        );

        // Create a payload object
        const payload = { username, jwtSecretKey };

        // Generate access and refresh tokens using the payload and set expiry times
        const accessToken = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: accessTokenExpiry,
        });

        const refreshToken = this.jwtService.sign(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: refreshTokenExpiry,
        });

        console.log(`'${username}' successfully signed up!`);
        await this.emailService.sendWelcomeEmail(username, email);

        return {
          success: true,
          accessToken,
          refreshToken,
        };
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        // Handle ConflictException here
        throw error; // Re-throw the ConflictException to propagate it
      } else {
        console.error('Error querying the database:', error);
        throw new Error('An error occurred while querying the database.');
      }
    }
  }

  async checkLoggedIn(refreshToken: string): Promise<any> {
    const username = isTokenValid(refreshToken);
    const user = await this.usersService.findOne(username);

    if (!user) {
      return {
        success: false,
      };
    }

    return {
      success: true,
      username,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    const username = isTokenValid(refreshToken);
    if (username != undefined) {
      const payload = { username, jwtSecretKey };

      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: accessTokenExpiry,
      });
      return accessToken;
    }

    return undefined;
  }

  async logout(token: any): Promise<any> {
    if (token && !revokedTokens.includes(token)) {
      revokedTokens.push(token);
      const username = jwt.decode(token).username; // Decode the token to get the username
      console.log(`'${username}' successfully logged out!`);
      return true;
    } else {
      return false;
    }
  }
}
