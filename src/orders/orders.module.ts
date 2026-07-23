import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CartModule } from '../cart/cart.module';
import { PromosModule } from '../promos/promos.module';

@Module({
  imports: [CartModule, PromosModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
