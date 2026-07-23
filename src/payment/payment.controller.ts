import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Post('transaction/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat transaksi Midtrans untuk pesanan' })
  @ApiParam({ name: 'orderId', description: 'ID pesanan', example: '1' })
  @ApiResponse({ status: 201, description: 'Transaksi Midtrans berhasil dibuat' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  createTransaction(@Request() req: any, @Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.createTransaction(req.user.sub, orderId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Get('transaction/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cek status transaksi Midtrans' })
  @ApiParam({ name: 'orderId', description: 'ID pesanan', example: '1' })
  @ApiResponse({ status: 200, description: 'Status transaksi ditemukan' })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  getTransactionStatus(@Request() req: any, @Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.getTransactionStatus(req.user.sub, req.user.role, orderId);
  }

  @Post('midtrans-notification')
  @ApiOperation({ summary: 'Webhook notifikasi dari Midtrans' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transaction_status: { type: 'string' },
        order_id: { type: 'string' },
        transaction_id: { type: 'string' },
        status_code: { type: 'string' },
        gross_amount: { type: 'string' },
        payment_type: { type: 'string' },
        fraud_status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Notifikasi diproses' })
  handleMidtransNotification(@Body() notification: any) {
    return this.paymentService.handleMidtransNotification(notification);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Lihat semua transaksi pembayaran' })
  getAllPayments() {
    return this.paymentService.getAllPayments();
  }
}
