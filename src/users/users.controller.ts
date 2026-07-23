import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: '[ADMIN] Lihat semua user' })
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Roles('ADMIN', 'BUYER')
  @Get('profile')
  @ApiOperation({ summary: 'Lihat profil user yang sedang login' })
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Roles('ADMIN')
  @Get(':id')
  @ApiOperation({ summary: '[ADMIN] Lihat detail user berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID user', example: '1' })
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(+id);
  }

  @Roles('ADMIN', 'BUYER')
  @Patch('profile')
  @ApiOperation({ summary: 'Update profil user yang sedang login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Budi Santoso' },
        address: { type: 'string', example: 'Jl. Sudirman No.1' },
        phone: { type: 'string', example: '081234567890' },
      },
    },
  })
  updateProfile(@Request() req: any, @Body() dto: any) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: '[ADMIN] Hapus user berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID user', example: '1' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(+id);
  }
}
