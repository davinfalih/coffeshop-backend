import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: { productId: number; score: number; comment?: string }) {
    const productId = Number(dto.productId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Produk kopi tidak ditemukan');

    if (dto.score < 1 || dto.score > 5) {
      throw new BadRequestException('Score harus antara 1-5');
    }

    const existing = await this.prisma.rating.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) throw new BadRequestException('Anda sudah memberikan rating untuk produk ini');

    const rating = await this.prisma.rating.create({
      data: {
        productId,
        userId,
        score: dto.score,
        comment: dto.comment || null,
      },
      include: { user: { select: { name: true } } },
    });

    await this.updateProductRating(productId);

    return rating;
  }

  async getProductRatings(productId: string) {
    const productIdNumber = Number(productId);
    const product = await this.prisma.product.findUnique({
      where: { id: productIdNumber },
    });
    if (!product) throw new NotFoundException('Produk kopi tidak ditemukan');

    return this.prisma.rating.findMany({
      where: { productId: productIdNumber },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: number, id: string, dto: { score?: number; comment?: string }) {
    const ratingId = Number(id);

    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });
    if (!rating) throw new NotFoundException('Rating tidak ditemukan');
    if (rating.userId !== userId) throw new ForbiddenException('Anda tidak memiliki akses');

    if (dto.score && (dto.score < 1 || dto.score > 5)) {
      throw new BadRequestException('Score harus antara 1-5');
    }

    const updated = await this.prisma.rating.update({
      where: { id: ratingId },
      data: {
        score: dto.score ?? rating.score,
        comment: dto.comment ?? rating.comment,
      },
    });

    await this.updateProductRating(rating.productId);

    return updated;
  }

  async delete(userId: number, role: string, id: string) {
    const ratingId = Number(id);

    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
    });
    if (!rating) throw new NotFoundException('Rating tidak ditemukan');
    if (role !== 'ADMIN' && rating.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }

    await this.prisma.rating.delete({ where: { id: ratingId } });

    await this.updateProductRating(rating.productId);

    return { message: 'Rating berhasil dihapus' };
  }

  private async updateProductRating(productId: number) {
    const ratings = await this.prisma.rating.findMany({
      where: { productId },
      select: { score: true },
    });

    const totalReviews = ratings.length;
    const averageRating =
      totalReviews > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / totalReviews
        : 0;

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
      },
    });
  }
}
