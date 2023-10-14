import { Module, Global } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

@Global()
@Module({
  providers: [
    {
      provide: 'MYSQL_CONNECTION', // Provide a token for the connection
      useFactory: async () => {
        const connection = await createMySQLConnection(); // Implement createMySQLConnection function
        return connection;
      },
    },
  ],
  exports: ['MYSQL_CONNECTION'], // Export the token
})
export class MysqlModule {}

async function createMySQLConnection(): Promise<mysql.Connection> {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  return connection;
}
