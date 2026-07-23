import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Kopi Arabika', description: 'Nama kategori produk kopi' })
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Kopi arabika dari berbagai daerah di Indonesia',
    description: 'Deskripsi kategori',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
