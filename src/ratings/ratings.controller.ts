import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Beri rating dan ulasan untuk produk kopi' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'number', example: 1 },
        score: { type: 'number', example: 5, description: 'Nilai 1-5' },
        comment: { type: 'string', example: 'Kopi enak banget!', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Rating berhasil ditambahkan' })
  create(@Request() req: any, @Body() dto: any) {
    return this.ratingsService.create(req.user.sub, dto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Lihat rating dan ulasan berdasarkan produk kopi (publik)' })
  @ApiParam({ name: 'productId', description: 'ID produk', example: '1' })
  getProductRatings(@Param('productId') productId: string) {
    return this.ratingsService.getProductRatings(productId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update rating dan ulasan' })
  @ApiParam({ name: 'id', description: 'ID rating', example: '1' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', example: 4 },
        comment: { type: 'string', example: 'Updated review' },
      },
    },
  })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.ratingsService.update(req.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BUYER')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus rating dan ulasan' })
  @ApiParam({ name: 'id', description: 'ID rating', example: '1' })
  delete(@Request() req: any, @Param('id') id: string) {
    return this.ratingsService.delete(req.user.sub, req.user.role, id);
  }
}
