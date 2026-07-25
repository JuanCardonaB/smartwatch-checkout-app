import { Module } from '@nestjs/common';
import { CreateDeliveryUseCase } from '../application/use-cases/create-delivery.use-case';
import { GetDeliveryUseCase } from '../application/use-cases/get-delivery.use-case';
import { GetDeliveryByTransactionUseCase } from '../application/use-cases/get-delivery-by-transaction.use-case';
import { DeliveryRepository } from '../domain/delivery.repository';
import { DeliveriesController } from './controllers/deliveries.controller';
import { JsonDeliveryRepository } from './repositories/json-delivery.repository';

@Module({
  controllers: [DeliveriesController],
  providers: [
    CreateDeliveryUseCase,
    GetDeliveryUseCase,
    GetDeliveryByTransactionUseCase,
    { provide: DeliveryRepository, useClass: JsonDeliveryRepository },
  ],
  exports: [CreateDeliveryUseCase, DeliveryRepository],
})
export class DeliveriesModule {}
