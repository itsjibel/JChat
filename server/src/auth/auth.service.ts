import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY; // You can set this as a number or a string
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY; // You can set this as a number or a string

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, plainTextPassword: string): Promise<any> {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Hash the incoming plainTextPassword using SHA-256
    const hashedPassword = createHash('sha256')
      .update(plainTextPassword)
      .digest('hex');

    // Compare the hashed password with the stored hashed password
    if (user.password !== hashedPassword) {
      throw new UnauthorizedException();
    }

    // Create a payload object with the data you want to include in the token
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

    return {
      accessToken,
      refreshToken,
    };
  }
}
