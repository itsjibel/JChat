import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private authService: ContactsService) {}

  @Post('checkIsContact')
  @UseGuards(JwtAuthGuard)
  checkIsContact(@Body() usernames: any, @Res() res: Response) {
    this.authService
      .checkIsContact(usernames.sender_username, usernames.receiver_username)
      .then((result) => {
        res.send({ success: result });
      });
  }

  @Post('sendFriendRequest')
  @UseGuards(JwtAuthGuard)
  sendFriendRequest(@Body() usernames: any, @Res() res: Response) {
    this.authService
      .sendFriendRequest(usernames.sender_username, usernames.receiver_username)
      .then((result) => {
        res.send({ success: result });
      });
  }

  @Post('acceptFriendRequest')
  @UseGuards(JwtAuthGuard)
  acceptFriendRequest(@Body() usernames: any, @Res() res: Response) {
    this.authService
      .acceptFriendRequest(
        usernames.sender_username,
        usernames.receiver_username,
      )
      .then((result) => {
        res.send({ success: result });
      });
  }
}
