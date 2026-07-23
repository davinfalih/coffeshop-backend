import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({
    example: 'APPROVED',
    description: 'Status verifikasi pembayaran',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  @IsNotEmpty()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status: any;

  @ApiPropertyOptional({
    example: 'Pembayaran telah dikonfirmasi',
    description: 'Catatan admin',
  })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
