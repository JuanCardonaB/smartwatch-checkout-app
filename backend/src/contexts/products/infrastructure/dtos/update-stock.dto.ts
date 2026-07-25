import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ example: 1, description: 'Units to decrement from stock' })
  @IsInt()
  @Min(1)
  quantity: number;
}
