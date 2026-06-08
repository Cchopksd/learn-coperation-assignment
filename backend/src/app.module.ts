import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '.env'),
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    BranchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
