import { Injectable, Inject } from '@nestjs/common';
import { Connection } from 'mysql2/promise';
import { User } from './user.interface'; // Create a User interface for better type safety

@Injectable()
export class UsersService {
  constructor(
    @Inject('MYSQL_CONNECTION') private readonly connection: Connection,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    try {
      // Query the database to find a user by username
      const [rows] = await this.connection.execute(
        'SELECT * FROM Users WHERE username = ?',
        [username],
      );

      // Check if a user was found
      if (rows[0] != undefined) {
        // Map the database result to your User interface
        const user: User = {
          userId: rows[0].userId,
          username: rows[0].username,
          password: rows[0].password,
        };
        return user;
      } else {
        return undefined; // No user found with the given username
      }
    } catch (error) {
      console.error('Error querying the database:', error);
      throw new Error('An error occurred while querying the database.');
    }
  }
}
