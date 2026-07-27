import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateDeliveryUseCase } from '../application/use-cases/create-delivery.use-case';
import { GetDeliveryUseCase } from '../application/use-cases/get-delivery.use-case';
import { GetDeliveryByTransactionUseCase } from '../application/use-cases/get-delivery-by-transaction.use-case';
import { ListDeliveriesUseCase } from '../application/use-cases/list-deliveries.use-case';
import { DeliveryRepository } from '../domain/delivery.repository';
import { DeliveriesController } from './controllers/deliveries.controller';
import { DeliveryOrmEntity } from './entities/delivery.orm-entity';
import { TypeOrmDeliveryRepository } from './repositories/typeorm-delivery.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity])],
  controllers: [DeliveriesController],
  providers: [
    CreateDeliveryUseCase,
    GetDeliveryUseCase,
    GetDeliveryByTransactionUseCase,
    ListDeliveriesUseCase,
    { provide: DeliveryRepository, useClass: TypeOrmDeliveryRepository },
  ],
  exports: [CreateDeliveryUseCase, DeliveryRepository],
})
export class DeliveriesModule {}
