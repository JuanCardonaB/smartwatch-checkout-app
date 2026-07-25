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
  @ApiOperation({ summary: 'Create a customer', description: 'Registers a new customer during the checkout process. Email must be unique.' })
  @ApiCreatedResponse({ type: CustomerResponseDto, description: 'Customer created successfully' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const result = await this.createCustomer.execute(dto);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.CONFLICT);
    return CustomerResponseDto.fromEntity(result.value);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID', description: 'Retrieves a customer by their unique identifier.' })
  @ApiParam({ name: 'id', description: 'Customer UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiOkResponse({ type: CustomerResponseDto, description: 'Customer found' })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  async findOne(@Param('id') id: string): Promise<CustomerResponseDto> {
    const result = await this.getCustomer.execute(id);
    if (!result.ok) throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    return CustomerResponseDto.fromEntity(result.value);
  }
}
