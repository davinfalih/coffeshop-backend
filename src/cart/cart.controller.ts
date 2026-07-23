import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('carts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'BUYER')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: 'Tambah item kopi ke keranjang belanja' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({ status: 201, description: 'Item berhasil ditambahkan ke keranjang' })
  @ApiResponse({ status: 401, description: 'Tidak terautentikasi' })
  addToCart(@Request() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat isi keranjang belanja user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Isi keranjang berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Tidak terautentikasi' })
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.sub);
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Update jumlah item kopi di keranjang' })
  @ApiParam({ name: 'itemId', description: 'ID item keranjang', example: '1' })
  @ApiBody({ type: UpdateCartDto })
  @ApiResponse({ status: 200, description: 'Item keranjang berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'Item tidak ditemukan di keranjang' })
  updateItem(@Request() req: any, @Param('itemId') itemId: string, @Body() dto: UpdateCartDto) {
    return this.cartService.updateItem(req.user.sub, itemId, dto);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Hapus item kopi dari keranjang belanja' })
  @ApiParam({ name: 'itemId', description: 'ID item keranjang', example: '1' })
  @ApiResponse({ status: 200, description: 'Item berhasil dihapus dari keranjang' })
  @ApiResponse({ status: 404, description: 'Item tidak ditemukan di keranjang' })
  removeItem(@Request() req: any, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.sub, itemId);
  }
}
