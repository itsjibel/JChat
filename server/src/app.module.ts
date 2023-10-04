import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MysqlModule } from './mysql.module';
import { FrinedRequests } from './websocket/websocket.gateway';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';

@Module({
  imports: [AuthModule, UsersModule, MysqlModule, EmailModule],
  providers: [FrinedRequests, EmailService],
})
export class AppModule {}
