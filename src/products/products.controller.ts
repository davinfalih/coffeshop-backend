import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Tambah produk kopi baru' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Produk berhasil dibuat' })
  @ApiResponse({ status: 403, description: 'Akses ditolak - bukan admin' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat semua produk kopi (publik)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by kategori' })
  @ApiQuery({ name: 'search', required: false, description: 'Cari produk' })
  @ApiResponse({ status: 200, description: 'Daftar produk berhasil diambil' })
  findAll(@Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    return this.productsService.findAll(categoryId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lihat detail produk kopi berdasarkan ID (publik)' })
  @ApiParam({ name: 'id', description: 'ID produk', example: '1' })
  @ApiResponse({ status: 200, description: 'Detail produk ditemukan' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Update produk kopi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID produk', example: '1' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Produk berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Hapus produk kopi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID produk', example: '1' })
  @ApiResponse({ status: 200, description: 'Produk berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
