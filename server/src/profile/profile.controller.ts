import { Controller, Get, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':username')
  async getUserProfile(@Param('username') username: string) {
    try {
      const userProfile = await this.profileService.getUserProfile(username);
      return userProfile;
    } catch (error) {
      // Handle errors and return appropriate responses
    }
  }
}
