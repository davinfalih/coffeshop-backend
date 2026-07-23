import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { PromosService } from '../promos/promos.service';
import { OrderStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private promosService: PromosService,
  ) {}

  async checkout(userId: string | number, dto: CheckoutDto) {
    const userIdNumber = Number(userId);
    const { items, subtotal } = await this.cartService.getCart(userIdNumber);

    if (items.length === 0) {
      throw new BadRequestException('Keranjang belanja kosong');
    }

    for (const item of items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Stok produk "${item.product.name}" tidak mencukupi`,
        );
      }
    }

    let discountAmount = 0;
    let promoId: number | null = null;
    let promoCodeUsed = '';

    if (dto.promoCode) {
      const promoResult = await this.promosService.validatePromo(dto.promoCode, subtotal);
      discountAmount = promoResult.discountAmount;
      promoId = promoResult.promo.id;
      promoCodeUsed = promoResult.promo.code;
    }

    const finalAmount = subtotal - discountAmount;

    const order = await this.prisma.order.create({
      data: {
        userId: userIdNumber,
        totalAmount: finalAmount,
        discountAmount: discountAmount,
        promoId: promoId,
        status: OrderStatus.PENDING,
        orderItems: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: { orderItems: { include: { product: true } } },
    });

    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await this.cartService.clearCart(userIdNumber);

    if (promoId) {
      await this.prisma.promo.update({
        where: { id: promoId },
        data: { usedCount: { increment: 1 } },
      });
    }

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        userId: userIdNumber,
        amount: finalAmount,
        paymentMethod: 'MIDTRANS',
        paymentStatus: 'PENDING',
      },
    });

    return {
      message: 'Pesanan kopi berhasil dibuat. Silakan lanjutkan pembayaran.',
      orderId: order.id,
      subtotal,
      discountAmount,
      promoCode: promoCodeUsed || null,
      totalAmount: finalAmount,
      status: 'PENDING',
      instruction: 'Gunakan endpoint POST /payment/transaction/:orderId untuk mendapatkan link pembayaran Midtrans',
    };
  }

  getMyOrders(userId: string | number) {
    const userIdNumber = Number(userId);
    return this.prisma.order.findMany({
      where: { userId: userIdNumber },
      include: {
        orderItems: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        payment: true,
        promo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(userId: string | number, role: string, orderId: string | number) {
    const orderIdNumber = Number(orderId);
    const userIdNumber = Number(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderIdNumber },
      include: {
        user: { select: { name: true, email: true } },
        orderItems: {
          include: {
            product: { select: { name: true, imageUrl: true, price: true } },
          },
        },
        payment: true,
        promo: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (role !== 'ADMIN' && order.userId !== userIdNumber) {
      throw new NotFoundException('Pesanan tidak ditemukan atau tidak ada akses');
    }

    return order;
  }

  getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        orderItems: { include: { product: { select: { name: true } } } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(orderId: string | number, dto: UpdateOrderStatusDto) {
    const orderIdNumber = Number(orderId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderIdNumber },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    return this.prisma.order.update({
      where: { id: orderIdNumber },
      data: { status: dto.status as OrderStatus },
    });
  }

  async deleteOrder(orderId: string | number, userId: string | number, role: string) {
    const id = Number(orderId);
    const userIdNumber = Number(userId);

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (role !== 'ADMIN' && order.userId !== userIdNumber) {
      throw new NotFoundException('Pesanan tidak ditemukan atau tidak ada akses');
    }

    await this.prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    return this.prisma.order.delete({
      where: { id },
    });
  }

  async generateReceiptPdf(userId: number, role: string, orderId: number): Promise<Buffer> {
    const order = await this.getOrderById(userId, role, orderId);

    const formatRupiah = (value: number) => {
      return 'Rp ' + value.toLocaleString('id-ID');
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    };

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const brandColor = '#3C2A1E';
      const accentColor = '#C8A97E';
      const textColor = '#2D3748';
      const tableHeaderBg = '#3C2A1E';

      doc.fillColor(brandColor)
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('COFFEE SHOP', { align: 'left' });

      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .fillColor('#718096')
         .text('Brewed with Love, Served with Passion', { align: 'left' });

      doc.moveDown(0.5);
      doc.strokeColor(accentColor)
         .lineWidth(2)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown(1);
      doc.fillColor(textColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('STRUK PEMBAYARAN', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Order ID: CS-${String(order.id).padStart(4, '0')}`, { align: 'left' });
      doc.text(`Tanggal: ${formatDate(order.createdAt)}`, { align: 'left' });
      doc.text(`Status: ${order.status}`, { align: 'left' });
      doc.text(`Pelanggan: ${order.user.name}`, { align: 'left' });
      doc.text(`Email: ${order.user.email}`, { align: 'left' });

      doc.moveDown(1);
      doc.strokeColor('#E2E8F0')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const leftCol = 50;
      const midCol = 300;
      const rightCol = 450;

      doc.fillColor('#FFFFFF')
         .rect(leftCol, tableTop, 495, 20)
         .fill(tableHeaderBg);

      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Produk', leftCol + 5, tableTop + 5)
         .text('Jumlah', midCol, tableTop + 5)
         .text('Subtotal', rightCol, tableTop + 5);

      let currentY = tableTop + 25;

      doc.fillColor(textColor).fontSize(10).font('Helvetica');

      for (const item of order.orderItems) {
        const productName = item.product.name.length > 30
          ? item.product.name.substring(0, 27) + '...'
          : item.product.name;
        doc.text(productName, leftCol, currentY);
        doc.text(`${item.quantity} x ${formatRupiah(item.price)}`, midCol, currentY);
        doc.text(formatRupiah(item.price * item.quantity), rightCol, currentY);
        currentY += 20;
      }

      doc.moveDown(0.5);
      doc.strokeColor('#E2E8F0')
         .lineWidth(1)
         .moveTo(50, currentY)
         .lineTo(545, currentY)
         .stroke();

      currentY += 15;

      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', leftCol, currentY);
      doc.text(formatRupiah(order.discountAmount > 0 ? order.totalAmount + order.discountAmount : order.totalAmount), rightCol, currentY);
      currentY += 20;

      if (order.discountAmount > 0) {
        doc.font('Helvetica');
        doc.fillColor('#E53E3E');
        doc.text(`Diskon (${order.promo?.code ?? ''}):`, leftCol, currentY);
        doc.text(`- ${formatRupiah(order.discountAmount)}`, rightCol, currentY);
        currentY += 20;
      }

      doc.fillColor(textColor);
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', leftCol, currentY);
      doc.text(formatRupiah(order.totalAmount), rightCol, currentY);
      currentY += 30;

      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#718096');
      doc.text('Terima kasih telah berbelanja di Coffee Shop!', 50, currentY, { align: 'center' });

      doc.end();
    });
  }
}
