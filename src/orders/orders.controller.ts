import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  Delete,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Post('checkout')
  @ApiOperation({ summary: 'Checkout - buat pesanan kopi dari keranjang belanja' })
  @ApiBody({ type: CheckoutDto })
  @ApiResponse({ status: 201, description: 'Pesanan berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Keranjang kosong atau stok habis' })
  @ApiResponse({ status: 401, description: 'Tidak terautentikasi' })
  checkout(@Request() req: any, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Get('my-orders')
  @ApiOperation({ summary: 'Lihat semua pesanan kopi milik user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Daftar pesanan berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Tidak terautentikasi' })
  getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Get(':id')
  @ApiOperation({ summary: 'Lihat pesanan kopi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID pesanan', example: '1' })
  @ApiResponse({ status: 200, description: 'Pesanan berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  getOrderById(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.user.sub, req.user.role, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: '[ADMIN] Lihat semua pesanan kopi' })
  @ApiResponse({ status: 200, description: 'Daftar semua pesanan' })
  @ApiResponse({ status: 403, description: 'Akses ditolak - bukan admin' })
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  @ApiOperation({ summary: '[ADMIN] Update status pesanan kopi' })
  @ApiParam({ name: 'id', description: 'ID pesanan', example: '1' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Status pesanan berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus pesanan kopi' })
  @ApiParam({ name: 'id', description: 'ID pesanan', example: '1' })
  @ApiResponse({ status: 200, description: 'Pesanan berhasil dihapus' })
  @ApiResponse({ status: 403, description: 'Akses ditolak' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  deleteOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.deleteOrder(id, req.user.sub, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Get(':id/receipt')
  @ApiOperation({ summary: 'Cetak/Download Struk Pembayaran format PDF' })
  @ApiParam({ name: 'id', description: 'ID pesanan', example: '1' })
  @ApiResponse({ status: 200, description: 'File PDF berhasil di-generate' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  async getReceipt(@Request() req: any, @Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.ordersService.generateReceiptPdf(
      req.user.sub,
      req.user.role,
      Number(id),
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="struk-pembayaran-CS-${id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.end(pdfBuffer);
  }
}
