import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smartwatch Checkout API')
    .setDescription(
      `REST API for the smartwatch checkout process.\n\n` +
      `## Modules\n` +
      `- **products** – Product catalog and stock management\n` +
      `- **customers** – Customer registration\n` +
      `- **transactions** – Payment transactions via payment gateway\n` +
      `- **deliveries** – Delivery information per transaction\n\n` +
      `## Price format\n` +
      `All prices are expressed in **cents (COP)**. Example: \`29900000\` = $299,000 COP`,
    )
    .setVersion('1.0')
    .addTag('products', 'Product catalog and stock operations')
    .addTag('customers', 'Customer registration and lookup')
    .addTag('transactions', 'Payment transaction lifecycle')
    .addTag('deliveries', 'Delivery information management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
