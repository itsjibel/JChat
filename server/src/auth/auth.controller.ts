import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() { username, password }: { username: string; password: string },
  ): Promise<{ success: boolean }> {
    const isValid = await this.authService.login(username, password);

    if (isValid) {
      return { success: true };
    } else {
      return { success: false };
    }
  }
}
