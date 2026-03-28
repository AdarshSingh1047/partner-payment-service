import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // ✅ Get ConfigService from Nest container
  const configService = app.get(ConfigService);

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Partner Payment Service')
    .setDescription('The API description for Partner Payment and Credit Pricing')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;

  console.log('PORT:', port);
  console.log(`Swagger UI available at: http://localhost:${port}/api/docs`);

  await app.listen(port);
}
bootstrap();