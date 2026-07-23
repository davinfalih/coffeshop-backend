import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const midtransClient = require('midtrans-client');

@Injectable()
export class PaymentService {
  private snap: any;
  private core: any;

  constructor(private prisma: PrismaService) {
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    this.snap = new midtransClient.Snap({
      isProduction,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    this.core = new midtransClient.CoreApi({
      isProduction,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  async createTransaction(userId: number, orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        orderItems: {
          include: { product: { select: { name: true } } },
        },
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.userId !== userId) throw new ForbiddenException('Akses ditolak');

    const payment = order.payment;
    if (!payment) throw new NotFoundException('Data pembayaran tidak ditemukan');

    if (payment.paymentStatus !== 'PENDING') {
      throw new BadRequestException('Pembayaran sudah diproses');
    }

    if (payment.midtransToken) {
      return {
        token: payment.midtransToken,
        redirectUrl: payment.midtransRedirectUrl,
        message: 'Transaksi sudah tersedia',
      };
    }

    const transactionDetails = {
      transaction_details: {
        order_id: `CS-${order.id}-${Date.now()}`,
        gross_amount: Math.round(order.totalAmount),
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: order.user.name,
        email: order.user.email,
      },
      item_details: order.orderItems.map((item) => ({
        id: item.productId.toString(),
        price: Math.round(item.price),
        quantity: item.quantity,
        name: item.product.name.substring(0, 50),
      })),
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/finish`,
        error: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/error`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/pending`,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(transactionDetails);

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          midtransToken: transaction.token,
          midtransRedirectUrl: transaction.redirect_url,
          transactionId: transactionDetails.transaction_details.order_id,
        },
      });

      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        message: 'Silakan lanjutkan pembayaran melalui Midtrans',
      };
    } catch (error) {
      throw new BadRequestException(`Gagal membuat transaksi Midtrans: ${error.message}`);
    }
  }

  async getTransactionStatus(userId: number, role: string, orderId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    if (role !== 'ADMIN' && payment.order.userId !== userId) {
      throw new ForbiddenException('Akses ditolak');
    }

    if (payment.transactionId) {
      try {
        const status = await this.snap.transaction.status(payment.transactionId);
        return {
          payment,
          midtransStatus: status,
        };
      } catch {
        return { payment, midtransStatus: null };
      }
    }

    return { payment, midtransStatus: null };
  }

  async handleMidtransNotification(notification: any) {
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const transactionId = notification.transaction_id;

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: orderId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');

    let paymentStatus = payment.paymentStatus;
    let orderStatus = payment.order.status;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept') {
        paymentStatus = 'PAID';
        orderStatus = 'PAID';
      }
    } else if (
      transactionStatus === 'pending'
    ) {
      paymentStatus = 'PENDING';
      orderStatus = 'PENDING';
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'expire'
    ) {
      paymentStatus = 'FAILED';
      orderStatus = 'FAILED';
    } else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
      paymentStatus = 'PAID';
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: paymentStatus as any,
        transactionId: transactionId || payment.transactionId,
        paidAt: paymentStatus === 'PAID' ? new Date() : payment.paidAt,
        failureReason:
          paymentStatus === 'FAILED' ? `Midtrans: ${transactionStatus}` : null,
      },
    });

    if (orderStatus !== payment.order.status) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: orderStatus as any },
      });
    }

    return {
      message: 'Notifikasi diproses',
      orderId: payment.orderId,
      transactionStatus,
      paymentStatus,
    };
  }

  async getAllPayments() {
    return this.prisma.payment.findMany({
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
