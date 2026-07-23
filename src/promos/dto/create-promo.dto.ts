import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PromoType } from '@prisma/client';

export class CreatePromoDto {
  @ApiProperty({ example: 'DISKON10', description: 'Kode promo unik' })
  @IsNotEmpty({ message: 'Kode promo tidak boleh kosong' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Diskon 10% untuk semua produk kopi', description: 'Deskripsi promo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PromoType, example: PromoType.PERCENTAGE, description: 'Tipe promo (PERCENTAGE/FIXED)' })
  @IsNotEmpty({ message: 'Tipe promo tidak boleh kosong' })
  @IsEnum(PromoType)
  type: PromoType;

  @ApiProperty({ example: 10, description: 'Nilai promo (persentase atau nominal)' })
  @IsNotEmpty({ message: 'Nilai promo tidak boleh kosong' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ example: 50000, description: 'Maksimal diskon (untuk tipe PERCENTAGE)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscount?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Minimal belanja' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderAmount?: number;

  @ApiProperty({ example: '2026-01-01', description: 'Tanggal mulai promo' })
  @IsNotEmpty({ message: 'Tanggal mulai tidak boleh kosong' })
  startDate: string;

  @ApiProperty({ example: '2026-12-31', description: 'Tanggal berakhir promo' })
  @IsNotEmpty({ message: 'Tanggal berakhir tidak boleh kosong' })
  endDate: string;

  @ApiPropertyOptional({ example: 100, description: 'Batas penggunaan promo' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number;

  @ApiPropertyOptional({ example: true, description: 'Status aktif promo' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
