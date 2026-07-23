import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(userId: string | number, dto: AddToCartDto) {
    const userIdNumber = Number(userId);
    const productId = Number(dto.productId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Produk kopi tidak ditemukan');
    if (!product.isAvailable) throw new BadRequestException('Produk kopi sedang tidak tersedia');
    if (product.stock < dto.quantity)
      throw new BadRequestException('Stok produk kopi tidak mencukupi');

    const existing = await this.prisma.cartItem.findFirst({
      where: { userId: userIdNumber, productId },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: { userId: userIdNumber, productId, quantity: dto.quantity },
      include: { product: true },
    });
  }

  async getCart(userId: string | number) {
    const userIdNumber = Number(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { userId: userIdNumber },
      include: {
        product: { include: { category: { select: { name: true } } } },
      },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    return { items, subtotal };
  }

  async updateItem(userId: string | number, itemId: string | number, dto: UpdateCartDto) {
    const userIdNumber = Number(userId);
    const itemIdNumber = Number(itemId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemIdNumber, userId: userIdNumber },
    });
    if (!item) throw new NotFoundException('Item keranjang tidak ditemukan');

    return this.prisma.cartItem.update({
      where: { id: itemIdNumber },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string | number, itemId: string | number) {
    const userIdNumber = Number(userId);
    const itemIdNumber = Number(itemId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemIdNumber, userId: userIdNumber },
    });
    if (!item) throw new NotFoundException('Item keranjang tidak ditemukan');

    await this.prisma.cartItem.delete({ where: { id: itemIdNumber } });
    return { message: 'Item berhasil dihapus dari keranjang' };
  }

  async clearCart(userId: string | number) {
    const userIdNumber = Number(userId);
    await this.prisma.cartItem.deleteMany({ where: { userId: userIdNumber } });
  }
}
