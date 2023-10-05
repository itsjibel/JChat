import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Place your custom logic to handle JWT token validation here
    const request = context.switchToHttp().getRequest();

    // Extract the JWT token from the request (e.g., from headers, cookies, or query parameters)
    const token = request.headers.authorization.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Verify the JWT token using the JwtService
    try {
      const payload = this.jwtService.verify(token);

      // Attach the payload to the request for later use
      request.user = payload;
      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
