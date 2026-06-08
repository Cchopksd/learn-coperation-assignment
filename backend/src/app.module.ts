import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ClassSessionsModule } from './modules/class-sessions/class-sessions.module';
import { CompensationsModule } from './modules/compensations/compensations.module';
import { CreditLedgersModule } from './modules/credit-ledgers/credit-ledgers.module';
import { StaffsModule } from './modules/staffs/staffs.module';
import { StudentsModule } from './modules/students/students.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    StaffsModule,
    StudentsModule,
    ClassSessionsModule,
    BookingsModule,
    CreditLedgersModule,
    CompensationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
