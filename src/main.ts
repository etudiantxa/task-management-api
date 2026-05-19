import './polyfills'; // Importer les polyfills avant tout le reste
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurer express pour gérer les grandes charges utiles
  app.use(express.json({ limit: process.env.BODY_LIMIT || '10mb' }));
  app.use(
    express.urlencoded({ 
      limit: process.env.BODY_LIMIT || '10mb', 
      extended: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*', // Lisez depuis les variables d'environnement
    credentials: true,
  });

  // Use global prefix
  app.setGlobalPrefix('api');

  // Use validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('The Task Management API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();