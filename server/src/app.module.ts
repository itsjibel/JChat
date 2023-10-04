import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MysqlModule } from './mysql.module';
import { FrinedRequests } from './websocket/websocket.gateway';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [AuthModule, UsersModule, MysqlModule, EmailModule, ProfileModule],
  providers: [FrinedRequests, EmailService],
})
export class AppModule {}
