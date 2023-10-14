import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { WebsocketService } from '../websocket/websocket.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET.toString(), // Your JWT secret key
      signOptions: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY.toString(), // Your access token expiry
      },
    }),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, WebsocketService],
})
export class ContactsModule {}
