import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    return await this.prisma.contact.create({
      data: createContactDto,
    });
  }

  async findAll() {
    return await this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: Number(id) },
    });

    if (!contact) {
      throw new NotFoundException(`Pesan dengan ID ${id} tidak ditemukan`);
    }
    return contact;
  }

  async update(id: number, updateContactDto: UpdateContactDto) {
    await this.findOne(id);

    return await this.prisma.contact.update({
      where: { id: Number(id) },
      data: updateContactDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.contact.delete({
      where: { id: Number(id) },
    });
  }
}
