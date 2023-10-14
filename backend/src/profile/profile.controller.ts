import {
  Controller,
  Get,
  Param,
  UseGuards,
  Post,
  UseInterceptors,
  Body,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('editPassword')
  async editPassword(@Query() parameters: any) {
    const result = await this.profileService.editPassword(parameters);
    return result;
  }

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

  @Post('edit/:username')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('pfp')) // Assuming you have multer configured
  async editUserProfile(
    @Param('username') username: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const {
        old_password,
        old_username,
        old_email,
        username,
        password,
        email,
      } = body;

      const result = await this.profileService.editProfile(
        username,
        old_password,
        old_username,
        old_email,
        password != '' ? password : old_password,
        email,
        file,
      );
      return result;
    } catch (error) {
      console.log('An error occurred while editing user profile:', error);
      throw new Error('An error occurred while editing user profile.');
    }
  }
}
