import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama pengirim pesan' })
  @IsString({ message: 'Nama harus berupa text' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @ApiProperty({ example: 'budi@email.com', description: 'Email pengirim pesan' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor HP pengirim pesan (opsional)' })
  @IsString({ message: 'Nomor HP harus berupa text' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Halo, saya tertarik dengan produk kopi organik.', description: 'Isi pesan' })
  @IsString({ message: 'Pesan harus berupa text' })
  @IsNotEmpty({ message: 'Pesan tidak boleh kosong' })
  message: string;
}
