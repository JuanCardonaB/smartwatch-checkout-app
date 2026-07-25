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
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionUseCase } from '../../application/use-cases/get-transaction.use-case';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { TransactionResponseDto } from '../dtos/transaction-response.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getTransaction: GetTransactionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Process a payment',
    description:
      'Orchestrates the full checkout: upserts customer, creates a PENDING transaction, ' +
      'calls the payment gateway, and — if approved — creates the delivery and decrements stock.',
  })
  @ApiCreatedResponse({
    type: TransactionResponseDto,
    description: 'Transaction processed (check status field for result)',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input, product not found, or out of stock',
  })
  async create(
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const result = await this.createTransaction.execute(dto);
    if (!result.ok)
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    const { transaction, deliveryId } = result.value;
    return TransactionResponseDto.fromEntity(transaction, deliveryId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: 'Returns the current state of a transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'Transaction UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({
    type: TransactionResponseDto,
    description: 'Transaction found',
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async findOne(@Param('id') id: string): Promise<TransactionResponseDto> {
    const result = await this.getTransaction.execute(id);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    return TransactionResponseDto.fromEntity(result.value);
  }
}
