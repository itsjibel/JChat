import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET.toString(), // Your JWT secret key
      signOptions: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY.toString(), // Your access token expiry
      },
    }),
  ],
  providers: [ProfileService, EmailService],
  controllers: [ProfileController],
})
export class ProfileModule {}
