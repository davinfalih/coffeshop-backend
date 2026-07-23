import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CoffeeSize, RoastLevel } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Kopi Arabika Gayo', description: 'Nama produk kopi' })
  @IsNotEmpty({ message: 'Nama produk tidak boleh kosong' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Kopi arabika premium dari dataran tinggi Gayo, Aceh',
    description: 'Deskripsi produk',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45000, description: 'Harga produk' })
  @IsNotEmpty({ message: 'Harga tidak boleh kosong' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 100, description: 'Stok produk' })
  @IsNotEmpty({ message: 'Stok tidak boleh kosong' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiPropertyOptional({ example: 'https://example.com/kopi.jpg', description: 'URL gambar produk' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 1, description: 'ID kategori' })
  @IsNotEmpty({ message: 'Kategori tidak boleh kosong' })
  @IsNumber()
  @Type(() => Number)
  categoryId: number;

  @ApiPropertyOptional({ enum: CoffeeSize, example: CoffeeSize.REGULAR, description: 'Ukuran kopi' })
  @IsOptional()
  @IsEnum(CoffeeSize)
  size?: CoffeeSize;

  @ApiPropertyOptional({ enum: RoastLevel, example: RoastLevel.MEDIUM, description: 'Level roasting' })
  @IsOptional()
  @IsEnum(RoastLevel)
  roastLevel?: RoastLevel;

  @ApiPropertyOptional({ example: true, description: 'Status ketersediaan' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isAvailable?: boolean;
}
