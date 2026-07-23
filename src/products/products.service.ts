import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        size: dto.size ?? 'REGULAR',
        roastLevel: dto.roastLevel ?? 'MEDIUM',
        isAvailable: dto.isAvailable ?? true,
      },
      include: { category: true },
    });
  }

  findAll(categoryId?: string, search?: string) {
    const where: any = {};

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: { category: true, _count: { select: { ratings: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string | number) {
    const productId = Number(id);
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        ratings: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  async update(id: string | number, dto: UpdateProductDto) {
    const productId = Number(id);
    await this.findOne(productId);

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string | number) {
    const productId = Number(id);
    await this.findOne(productId);
    await this.prisma.product.delete({ where: { id: productId } });
    return { message: 'Produk berhasil dihapus' };
  }
}
