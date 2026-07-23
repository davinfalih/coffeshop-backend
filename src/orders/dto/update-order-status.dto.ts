import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PAID,
    description: 'Status pesanan yang baru',
  })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  @IsEnum(OrderStatus, { message: 'Status tidak valid' })
  status: OrderStatus;
}
