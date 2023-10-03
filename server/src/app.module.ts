import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MysqlModule } from './mysql.module';

@Module({
  imports: [AuthModule, UsersModule, MysqlModule],
})
export class AppModule {}
