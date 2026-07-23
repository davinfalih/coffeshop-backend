import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class RegisterAdminDto extends RegisterDto {
  @ApiProperty({
    example: 'AdminSecret123',
    description: 'Secret key khusus untuk mendaftarkan admin',
  })
  @IsNotEmpty({ message: 'Admin secret tidak boleh kosong' })
  @IsString()
  declare adminSecret: string;
}
