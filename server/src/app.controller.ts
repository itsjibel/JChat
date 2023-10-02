import { Controller, Get } from '@nestjs/common';

@Controller('/sas')
export class AppController {
  @Get()
  getUser() {
    return 'I am a great person';
  }
}
