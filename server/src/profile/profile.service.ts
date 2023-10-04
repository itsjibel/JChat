import { Injectable, Inject } from '@nestjs/common';
import { Connection } from 'mysql2/promise';

@Injectable()
export class ProfileService {
  constructor(
    @Inject('MYSQL_CONNECTION') private readonly connection: Connection,
  ) {}

  async getUserProfile(username: string) {
    const sql =
      'SELECT username, email, is_email_verified, pfp FROM Users WHERE BINARY username = ?';

    try {
      const [results] = await this.connection.execute(sql, [username]);

      if (results.length === 0) {
        throw new Error('User not found.');
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
}
