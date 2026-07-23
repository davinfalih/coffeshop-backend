import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { CheckPromoDto } from './dto/check-promo.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('promos')
@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Tambah promo baru' })
  @ApiBody({ type: CreatePromoDto })
  create(@Body() dto: CreatePromoDto) {
    return this.promosService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Lihat semua promo' })
  findAll() {
    return this.promosService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Lihat detail promo' })
  @ApiParam({ name: 'id', description: 'ID promo', example: '1' })
  findOne(@Param('id') id: string) {
    return this.promosService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Update promo' })
  @ApiParam({ name: 'id', description: 'ID promo', example: '1' })
  @ApiBody({ type: UpdatePromoDto })
  update(@Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promosService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Hapus promo' })
  @ApiParam({ name: 'id', description: 'ID promo', example: '1' })
  remove(@Param('id') id: string) {
    return this.promosService.remove(id);
  }

  @Post('check')
  @ApiOperation({ summary: 'Cek kode promo (publik untuk user yang login)' })
  @ApiBody({ type: CheckPromoDto })
  checkPromo(@Body() dto: CheckPromoDto) {
    return this.promosService.checkPromo(dto);
  }
}
