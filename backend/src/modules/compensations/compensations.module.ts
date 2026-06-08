import { Module } from '@nestjs/common';

import { CompensationsController } from './compensations.controller';
import { CompensationsService } from './compensations.service';

@Module({
  controllers: [CompensationsController],
  providers: [CompensationsService],
})
export class CompensationsModule {}
