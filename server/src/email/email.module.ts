import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { JwtModule } from '@nestjs/jwt';
import { RabbitMQService } from './rabbitmq.service';
import { EmailConsumer } from './email.consumer';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET.toString(), // Your JWT secret key
      signOptions: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY.toString(), // Your access token expiry
      },
    }),
  ],
  providers: [EmailService, RabbitMQService, EmailConsumer],
  exports: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
