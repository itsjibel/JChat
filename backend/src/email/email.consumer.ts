import { Injectable } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { EmailService } from './email.service';

@Injectable()
export class EmailConsumer {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService,
  ) {}

  async start() {
    await this.rabbitMQService.connect();
    const queueName = 'email_queue';

    this.rabbitMQService.channel.assertQueue(queueName, { durable: true });
    this.rabbitMQService.channel.prefetch(1);

    console.log(`Email consumer waiting for messages in ${queueName}`);

    this.rabbitMQService.channel.consume(queueName, async (message) => {
      if (message !== null) {
        try {
          const messageContent = JSON.parse(message.content.toString());

          // Extract email information
          const { username, email } = messageContent;
          if (email) {
            // Send the email using EmailService
            await this.emailService.emailVerification(username, email);
          } else {
            await this.emailService.passwordRecovery(username);
          }

          this.rabbitMQService.channel.ack(message);
          console.log(`Email sent to '${username}' user`);
        } catch (error) {
          console.error(`Error processing message: ${error}`);
        }
      }
    });
  }
}
