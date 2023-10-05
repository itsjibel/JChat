import { Injectable, Inject } from '@nestjs/common';
import { Connection } from 'mysql2/promise';

@Injectable()
export class ContactsService {
  constructor(
    @Inject('MYSQL_CONNECTION') private readonly connection: Connection,
  ) {}
  async checkIsContact(
    senderUsername: string,
    receiverUsername: string,
  ): Promise<any> {
    try {
      // Query the database to find a user by username
      const [result] = await this.connection.execute(
        'SELECT is_accepted FROM FriendRequests WHERE (BINARY sender_username = ? AND BINARY receiver_username = ?) OR (BINARY receiver_username = ? AND BINARY sender_username = ?)',
        [senderUsername, receiverUsername, senderUsername, receiverUsername],
      );

      if (result.length === 1) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error querying the database:', error);
      throw new Error('An error occurred while querying the database.');
    }
  }
}
