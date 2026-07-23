import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Kirim pesan kontak baru (publik)' })
  @ApiBody({ type: CreateContactDto })
  @ApiResponse({ status: 201, description: 'Pesan berhasil dikirim' })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: '[ADMIN] Lihat semua pesan kontak' })
  @ApiResponse({ status: 200, description: 'Daftar pesan berhasil diambil' })
  @ApiResponse({ status: 403, description: 'Akses ditolak' })
  findAll() {
    return this.contactsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: '[ADMIN] Lihat detail pesan kontak berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID pesan kontak', example: '1' })
  @ApiResponse({ status: 200, description: 'Detail pesan ditemukan' })
  @ApiResponse({ status: 404, description: 'Pesan tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: '[ADMIN] Update status/detail pesan kontak' })
  @ApiParam({ name: 'id', description: 'ID pesan kontak', example: '1' })
  @ApiBody({ type: UpdateContactDto })
  @ApiResponse({ status: 200, description: 'Pesan berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'Pesan tidak ditemukan' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(+id, updateContactDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: '[ADMIN] Hapus pesan kontak' })
  @ApiParam({ name: 'id', description: 'ID pesan kontak', example: '1' })
  @ApiResponse({ status: 200, description: 'Pesan berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Pesan tidak ditemukan' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id);
  }
}
