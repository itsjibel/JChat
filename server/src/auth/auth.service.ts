import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(username: string, password: string): Promise<boolean> {
    const isValid = username === 'admin' && password === 'password';
    return isValid;
  }
}
