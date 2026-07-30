import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Coffee Shop API')
    .setDescription('API Documentation for Coffee Shop E-Commerce')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addTag('products')
    .addTag('categories')
    .addTag('orders')
    .addTag('carts')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.enableCors();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();