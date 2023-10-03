import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { createHash } from 'crypto'; // Import the crypto library for hashing

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signIn(username: string, plainTextPassword: string): Promise<any> {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Hash the incoming plainTextPassword using SHA-256
    const hashedPassword = createHash('sha256').update(plainTextPassword).digest('hex');

    // Compare the hashed password with the stored hashed password
    if (user.password !== hashedPassword) {
      throw new UnauthorizedException();
    }

    // If passwords match, return user data without the password
    const { password, ...result } = user;
    return result;
  }
}
