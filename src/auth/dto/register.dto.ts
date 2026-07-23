import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap user' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@email.com', description: 'Alamat email user' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password minimal 6 karakter',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiPropertyOptional({
    example: 'Jl. Sudirman No.1, Jakarta',
    description: 'Alamat pengiriman',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    enum: Role,
    example: Role.BUYER,
    description: 'Role user (ADMIN/BUYER)',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role harus ADMIN atau BUYER' })
  role?: Role;

  @ApiPropertyOptional({
    example: 'AdminSecret123',
    description: 'Secret key untuk register admin',
  })
  @IsOptional()
  @IsString()
  adminSecret?: string;
}
