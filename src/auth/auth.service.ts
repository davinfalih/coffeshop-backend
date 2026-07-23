import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const role = data.role ?? 'BUYER';
    if (role === 'ADMIN') {
      const secret = process.env.ADMIN_SECRET;
      if (!data.adminSecret || data.adminSecret !== secret) {
        throw new BadRequestException('adminSecret tidak valid');
      }
    }
    return this.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      address: data.address,
      role: role as 'ADMIN' | 'BUYER',
    });
  }

  async registerAdmin(data: RegisterAdminDto) {
    if (data.adminSecret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Admin secret tidak valid. Pembuatan akun admin ditolak.',
        error: 'UNAUTHORIZED',
      });
    }

    return this.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      address: data.address,
      role: 'ADMIN',
    });
  }

  private async createUser({
    name,
    email,
    password,
    address,
    role,
  }: {
    name: string;
    email: string;
    password: string;
    address?: string;
    role: 'ADMIN' | 'BUYER';
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Email sudah terdaftar!',
        error: 'BAD_REQUEST',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address: address || null,
        role,
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      statusCode: 201,
      message:
        role === 'ADMIN'
          ? 'Registrasi admin berhasil! Akun administrator telah dibuat.'
          : 'Registrasi berhasil! Akun Anda telah dibuat.',
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          createdAt: user.createdAt,
        },
      },
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Email atau password salah. Silakan periksa kembali.',
        error: 'UNAUTHORIZED',
      });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Email atau password salah. Silakan periksa kembali.',
        error: 'UNAUTHORIZED',
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      statusCode: 200,
      message: `Selamat datang, ${user.name}! Login berhasil.`,
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          createdAt: user.createdAt,
        },
        access_token: accessToken,
      },
    };
  }
}
