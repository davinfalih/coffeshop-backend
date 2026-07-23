import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { CheckPromoDto } from './dto/check-promo.dto';

@Injectable()
export class PromosService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePromoDto) {
    return this.prisma.promo.create({
      data: {
        code: dto.code,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        maxDiscount: dto.maxDiscount,
        minOrderAmount: dto.minOrderAmount ?? 0,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        usageLimit: dto.usageLimit,
        isActive: dto.isActive ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.promo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string | number) {
    const promoId = Number(id);
    const promo = await this.prisma.promo.findUnique({
      where: { id: promoId },
      include: { _count: { select: { orders: true } } },
    });
    if (!promo) throw new NotFoundException('Promo tidak ditemukan');
    return promo;
  }

  async update(id: string | number, dto: UpdatePromoDto) {
    const promoId = Number(id);
    await this.findOne(promoId);

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.promo.update({
      where: { id: promoId },
      data,
    });
  }

  async remove(id: string | number) {
    const promoId = Number(id);
    await this.findOne(promoId);
    await this.prisma.promo.delete({ where: { id: promoId } });
    return { message: 'Promo berhasil dihapus' };
  }

  async checkPromo(dto: CheckPromoDto) {
    const promo = await this.prisma.promo.findUnique({
      where: { code: dto.code },
    });

    if (!promo) {
      throw new NotFoundException('Kode promo tidak ditemukan');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Kode promo sudah tidak aktif');
    }

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      throw new BadRequestException('Kode promo sudah kadaluarsa atau belum berlaku');
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Kuota penggunaan kode promo sudah habis');
    }

    const subtotal = dto.subtotal ?? 0;
    if (subtotal < promo.minOrderAmount) {
      throw new BadRequestException(
        `Minimal belanja Rp ${promo.minOrderAmount.toLocaleString('id-ID')} untuk menggunakan kode promo ini`,
      );
    }

    let discountAmount = 0;
    if (promo.type === 'PERCENTAGE') {
      discountAmount = (subtotal * promo.value) / 100;
      if (promo.maxDiscount) {
        discountAmount = Math.min(discountAmount, promo.maxDiscount);
      }
    } else {
      discountAmount = promo.value;
    }

    return {
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        maxDiscount: promo.maxDiscount,
        minOrderAmount: promo.minOrderAmount,
        description: promo.description,
      },
      discountAmount: Math.round(discountAmount),
      finalAmount: subtotal - Math.round(discountAmount),
    };
  }

  async validatePromo(code: string, subtotal: number) {
    const result = await this.checkPromo({ code, subtotal });
    return result;
  }
}
