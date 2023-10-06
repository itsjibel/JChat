import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('emailVerification')
  @UseGuards(JwtAuthGuard)
  emailVerification(@Body() data: any, @Res() res: Response) {
    this.emailService
      .emailVerification(data.username, data.email)
      .then((result) => {
        res.send({ success: result });
      });
  }

  @Post('passwordRecovery')
  passwordRecovery(@Body() data: any, @Res() res: Response) {
    this.emailService.passwordRecovery(data.username).then((result) => {
      res.send(result);
    });
  }
}
