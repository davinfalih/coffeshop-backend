import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string | number) {
    const categoryId = Number(id);
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { products: true },
    });
    if (!cat) throw new NotFoundException('Kategori tidak ditemukan');
    return cat;
  }

  async update(id: string | number, dto: Partial<CreateCategoryDto>) {
    const categoryId = Number(id);
    await this.findOne(categoryId);
    return this.prisma.category.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  async remove(id: string | number) {
    const categoryId = Number(id);
    await this.findOne(categoryId);
    await this.prisma.category.delete({ where: { id: categoryId } });
    return { message: 'Kategori berhasil dihapus' };
  }
}
