import { Module } from '@nestjs/common';

import { CreditLedgersController } from './credit-ledgers.controller';
import { CreditLedgersService } from './credit-ledgers.service';

@Module({
  controllers: [CreditLedgersController],
  providers: [CreditLedgersService],
})
export class CreditLedgersModule {}
