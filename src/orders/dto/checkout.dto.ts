import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiPropertyOptional({
    example: 'DISKON10',
    description: 'Kode promo (opsional)',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
