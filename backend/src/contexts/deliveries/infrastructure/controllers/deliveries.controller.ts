import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateDeliveryUseCase } from '../../application/use-cases/create-delivery.use-case';
import { GetDeliveryUseCase } from '../../application/use-cases/get-delivery.use-case';
import { GetDeliveryByTransactionUseCase } from '../../application/use-cases/get-delivery-by-transaction.use-case';
import { CreateDeliveryDto } from '../dtos/create-delivery.dto';
import { DeliveryResponseDto } from '../dtos/delivery-response.dto';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(
    private readonly createDelivery: CreateDeliveryUseCase,
    private readonly getDelivery: GetDeliveryUseCase,
    private readonly getDeliveryByTransaction: GetDeliveryByTransactionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a delivery',
    description: 'Creates a delivery record after a successful payment. One delivery per transaction.',
  })
  @ApiCreatedResponse({ type: DeliveryResponseDto, description: 'Delivery created successfully' })
  @ApiConflictResponse({ description: 'A delivery already exists for this transaction' })
  async create(@Body() dto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    const result = await this.createDelivery.execute(dto);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.CONFLICT);
    return DeliveryResponseDto.fromEntity(result.value);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID', description: 'Returns a delivery record by its unique identifier.' })
  @ApiParam({ name: 'id', description: 'Delivery UUID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @ApiOkResponse({ type: DeliveryResponseDto, description: 'Delivery found' })
  @ApiNotFoundResponse({ description: 'Delivery not found' })
  async findOne(@Param('id') id: string): Promise<DeliveryResponseDto> {
    const result = await this.getDelivery.execute(id);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    return DeliveryResponseDto.fromEntity(result.value);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({
    summary: 'Get delivery by transaction ID',
    description: 'Returns the delivery linked to a specific transaction. Useful for showing delivery info on the final status screen.',
  })
  @ApiParam({ name: 'transactionId', description: 'Transaction UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ type: DeliveryResponseDto, description: 'Delivery found' })
  @ApiNotFoundResponse({ description: 'Delivery not found for this transaction' })
  async findByTransaction(@Param('transactionId') transactionId: string): Promise<DeliveryResponseDto> {
    const result = await this.getDeliveryByTransaction.execute(transactionId);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    return DeliveryResponseDto.fromEntity(result.value);
  }
}
