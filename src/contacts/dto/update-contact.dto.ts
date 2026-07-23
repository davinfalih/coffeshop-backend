import { PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ContactStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({
    example: 'READ',
    enum: ContactStatus,
    description: 'Status pesan',
  })
  @IsEnum(ContactStatus, {
    message: 'Status tidak valid (harus UNREAD, READ, atau REPLIED)',
  })
  @IsOptional()
  status?: ContactStatus;
}
