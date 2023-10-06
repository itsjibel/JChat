import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Connection } from 'mysql2/promise';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as dotenv from 'dotenv';
dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;

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
export class ProfileService {
  constructor(
    private emailService: EmailService,
    private jwtService: JwtService,
    @Inject('MYSQL_CONNECTION') private readonly connection: Connection,
  ) {}

  async getUserProfile(username: string) {
    const sql =
      'SELECT username, email, is_email_verified, pfp FROM Users WHERE BINARY username = ?';

    try {
      const [results] = await this.connection.execute(sql, [username]);

      if (results.length === 0) {
        return {
          success: false,
        };
      }

      const userData = results[0];

      return {
        success: true,
        username: userData.username,
        profilePicture: userData.pfp,
        email: userData.email,
        isEmailVerified: userData.is_email_verified,
      };
    } catch (error) {
      throw new Error('An error occurred while fetching the user profile.');
    }
  }

  async editProfile(
    username,
    old_password,
    old_username,
    old_email,
    password,
    email,
    file,
  ) {
    if (!isValidUsername(username)) {
      return {
        message: 'Invalid username.',
      };
    }

    if (!isValidPassword(password) && old_password != password) {
      return {
        message: 'Invalid password',
      };
    }

    const checkSqlDuplicate =
      'SELECT username, email FROM Users WHERE BINARY username = ? OR email = ?';
    const checkValuesDuplicate = [username, email];
    try {
      const [results] = await this.connection.execute(
        checkSqlDuplicate,
        checkValuesDuplicate,
      );

      if (
        results.length === 2 ||
        (results.length === 1 &&
          results[0].username != old_username &&
          results[0].email != old_email)
      ) {
        return {
          message: 'This email or username is already in use.',
        };
      }

      old_password = createHash('sha256').update(old_password).digest('hex');

      const checkSql =
        'SELECT * FROM Users WHERE BINARY ' +
        (results.length === 0
          ? 'username'
          : old_username != results[0].username
          ? 'email'
          : 'username') +
        ' = ? AND password = ?';

      const checkValues = [
        results.length === 0
          ? old_username
          : old_username != results[0].username
          ? old_email
          : old_username,
        old_password,
      ];

      const [results_] = await this.connection.execute(checkSql, checkValues);
      if (results_.length > 0) {
        // User with the same username or email already exists
        // Update the existing user's data
        const existingUser = results_[0];
        password = createHash('sha256').update(password).digest('hex');

        // Check if a new profile picture is provided
        let pfp = null;
        if (file) {
          pfp = file.buffer; // Set pfp to the binary data of the uploaded file
        } else {
          pfp = existingUser.pfp;
        }

        let is_email_verified = results_[0].is_email_verified;
        if (email != results_[0].email) {
          is_email_verified = 0;
        }

        const values = [
          username,
          password,
          email,
          pfp,
          is_email_verified,
          existingUser.user_id,
        ]; // Include the user's ID for updating
        const updateSql =
          'UPDATE Users SET username = ?, password = ?, email = ?, pfp = ?, is_email_verified = ? WHERE user_id = ?';

        await this.connection.execute(updateSql, values);

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

        console.log(`'${username}' updated his/her profile`);
        return {
          success: true,
          accessToken,
          refreshToken,
        };
      } else {
        return {
          message: 'The password is incorrect.',
        };
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        console.log(error);
        throw new Error('An error occurred while fetching the user profile.');
      }
    }
  }

  async editPassword(parameters: any) {
    const { token, password, username } = parameters;

    const sql =
      'SELECT email, recover_password_token FROM Users WHERE BINARY username = ?';
    const checkValue = [username];
    try {
      const [results] = await this.connection.execute(sql, checkValue);
      if (
        token === results[0].recover_password_token &&
        results[0].recover_password_token != null
      ) {
        if (!isValidPassword(password)) {
          return {
            success: false,
            message:
              'Invalid password. Only use valid characters and lengths between 5-100.',
          };
        }

        const updateSql =
          'UPDATE Users SET password = ?, recover_password_token = NULL WHERE BINARY username = ?';
        const updateValues = [
          createHash('sha256').update(password).digest('hex'),
          username,
        ];
        const email = results[0].email;
        this.emailService.sendPasswordEditedEmail(username, email);

        await this.connection.execute(updateSql, updateValues);
        console.log("'" + username + "' updated the password successfully");
        return {
          success: true,
          message: 'The password is updated successfully',
        };
      }
    } catch (error) {
      console.log('An error occurred while editing user password:', error);
      return {
        success: false,
        message: 'An error occurred while editing user password',
      };
    }
  }
}
