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
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '../../application/use-cases/get-customer.use-case';
import { CreateCustomerDto } from '../dtos/create-customer.dto';
import { CustomerResponseDto } from '../dtos/customer-response.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly getCustomer: GetCustomerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CustomerResponseDto })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const result = await this.createCustomer.execute(dto);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.CONFLICT);
    return CustomerResponseDto.fromEntity(result.value);
  }

  @Get(':id')
  @ApiOkResponse({ type: CustomerResponseDto })
  async findOne(@Param('id') id: string): Promise<CustomerResponseDto> {
    const result = await this.getCustomer.execute(id);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    return CustomerResponseDto.fromEntity(result.value);
  }
}
