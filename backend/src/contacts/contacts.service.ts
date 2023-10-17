import { Injectable, Inject } from '@nestjs/common';
import { Connection } from 'mysql2/promise';
import { WebsocketService } from '../websocket/websocket.service';

@Injectable()
export class ContactsService {
  constructor(
    @Inject('MYSQL_CONNECTION') private readonly connection: Connection,
    private readonly websocketService: WebsocketService,
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

  async sendFriendRequest(
    senderUsername: string,
    receiverUsername: string,
  ): Promise<any> {
    const sql =
      'INSERT INTO FriendRequests (sender_username, receiver_username, is_accepted) VALUES (?, ?, false)';
    const values = [senderUsername, receiverUsername];
    try {
      await this.connection.execute(sql, values);
      console.log(
        `'${senderUsername}' sent a friend request to '${receiverUsername}'`,
      );
      const countFriendRequestsSql =
        'SELECT sender_username, receiver_username, is_accepted FROM FriendRequests WHERE BINARY receiver_username = ? OR BINARY sender_username = ?';
      const countFriendRequestsValues = [receiverUsername, receiverUsername]; // Include the image binary data in values
      const [results] = await this.connection.execute(
        countFriendRequestsSql,
        countFriendRequestsValues,
      );

      this.websocketService.emitToUser(
        receiverUsername,
        'friendRequest',
        results,
      );
      return true;
    } catch (error) {
      console.log('An error occurred while sending friend request:', error);
      return false;
    }
  }

  async acceptFriendRequest(
    senderUsername: string,
    receiverUsername: string,
  ): Promise<any> {
    const values = [receiverUsername, senderUsername];
    const updateSql =
      'UPDATE FriendRequests SET is_accepted = true WHERE BINARY sender_username = ? AND BINARY receiver_username = ?';
    try {
      await this.connection.execute(updateSql, values);
      console.log(
        `'${senderUsername}' accepted a friend request from '${receiverUsername}'`,
      );
      return true;
    } catch (error) {
      console.log('An error occurred while accepting friend request:', error);
      return false;
    }
  }
}
