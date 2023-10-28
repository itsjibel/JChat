import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RabbitMQService } from './rabbitmq.service';

@Controller('email')
export class EmailController {
  constructor(private rabbitMQService: RabbitMQService) {}

  @Post('emailVerification')
  @UseGuards(JwtAuthGuard)
  async emailVerification(@Body() data: any, @Res() res: Response) {
    data['kind'] = 'emailVerification';
    await this.rabbitMQService.sendMessage('email_queue', JSON.stringify(data));
    res.send({ success: true });
  }

  @Post('passwordRecovery')
  async passwordRecovery(@Body() data: any, @Res() res: Response) {
    data['kind'] = 'passwordRecovery';
    await this.rabbitMQService.sendMessage('email_queue', JSON.stringify(data));
    res.send({ success: true });
  }
}
