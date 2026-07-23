import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CheckPromoDto {
  @ApiProperty({ example: 'DISKON10', description: 'Kode promo yang akan dicek' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 150000, description: 'Total belanja untuk menghitung diskon' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal?: number;
}
