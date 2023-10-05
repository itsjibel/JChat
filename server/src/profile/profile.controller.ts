import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Param('username') username: string) {
    try {
      const userProfile = await this.profileService.getUserProfile(username);
      return userProfile;
    } catch (error) {
      console.log('An error occurred while getting user information:', error);
    }
  }
}
