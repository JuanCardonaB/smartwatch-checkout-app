import { Module } from '@nestjs/common';
import { CustomersModule } from './contexts/customers/infrastructure/customers.module';

@Module({
  imports: [CustomersModule],
})
export class AppModule {}
