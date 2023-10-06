import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MysqlModule } from './mysql.module';
import { FrinedRequests } from './websocket/websocket.gateway';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { ProfileModule } from './profile/profile.module';
import { ContactsModule } from './contacts/contacts.module';
import { WebsocketService } from './websocket/websocket.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MysqlModule,
    EmailModule,
    ProfileModule,
    ContactsModule,
  ],
  providers: [FrinedRequests, EmailService, WebsocketService],
})
export class AppModule {}
