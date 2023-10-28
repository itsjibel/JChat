import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { RabbitMQService } from '../email/rabbitmq.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [UsersModule, EmailModule],
  providers: [AuthService, JwtService, RabbitMQService],
  controllers: [AuthController],
})
export class AuthModule {}
