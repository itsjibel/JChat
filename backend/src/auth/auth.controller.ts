import {
  Body,
  Controller,
  Post,
  Get,
  Headers,
  Res,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('signup')
  signUp(@Body() signInDto: Record<string, any>) {
    return this.authService.signUp(
      signInDto.username,
      signInDto.email,
      signInDto.password,
    );
  }

  @Get('checkLoggedIn')
  async checkLoggedIn(@Headers() refreshToken: any, @Res() res: Response) {
    this.authService
      .checkLoggedIn(refreshToken.authorization.split(' ')[1])
      .then((results) => {
        res.send(results);
      });
  }

  @Post('refreshAccessToken')
  refreshAccessToken(@Headers() refreshToken: any, @Res() res: Response) {
    this.authService
      .refreshAccessToken(refreshToken.authorization.split(' ')[1])
      .then((result) => {
        res.send({ accessToken: result });
      });
  }

  @Post('logout')
  logout(@Headers() refreshToken: any, @Res() res: Response) {
    this.authService
      .logout(refreshToken.authorization.split(' ')[1])
      .then((result) => {
        res.send({ success: result });
      });
  }

  @Get('verifyUserEmail')
  verifyUserEmail(@Query() token: any, @Res() res: Response) {
    this.authService.verifyUserEmail(token).then((result) => {
      res.redirect(
        'https://jchat.com/emailVerification.html?success=' + result,
      );
    });
  }

  @Get('isValidRecoverPasswordToken')
  isValidRecoverPasswordToken(@Query() data: any, @Res() res: Response) {
    this.authService.isValidRecoverPasswordToken(data).then((result) => {
      res.send(result);
    });
  }
}
