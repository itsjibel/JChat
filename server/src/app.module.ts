import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MysqlModule } from './mysql.module';
import { FrinedRequests } from './websocket/websocket.gateway';

@Module({
  imports: [AuthModule, UsersModule, MysqlModule],
  providers: [FrinedRequests],
})
export class AppModule {}
