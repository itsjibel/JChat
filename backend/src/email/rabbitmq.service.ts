import { Injectable } from '@nestjs/common';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQService {
  private connection: amqplib.Connection;
  private channel: amqplib.Channel;

  async connect() {
    try {
      this.connection = await amqplib.connect('amqp://jchat.com'); // Adjust the URL as needed.
      this.channel = await this.connection.createChannel();
    } catch (error) {
      console.error(`Error connecting to RabbitMQ: ${error}`);
    }
  }

  async sendMessage(queue: string, message: string) {
    this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
  }
}
