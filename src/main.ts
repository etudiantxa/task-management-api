import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import helmet from 'helmet';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ajout des en-têtes de sécurité
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Désactivé pour permettre les ressources externes
    crossOriginOpenerPolicy: {
      policy: process.env.NODE_ENV === 'development' ? 'unsafe-none' : 'same-origin'
    },
    crossOriginResourcePolicy: {
      policy: process.env.NODE_ENV === 'development' ? 'cross-origin' : 'same-origin'
    },
    hsts: {
      maxAge: 31536000, // 1 an en secondes
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    }
  }));
  
  // Configuration CORS selon l'environnement
  if (process.env.NODE_ENV === 'development') {
    app.enableCors({
      origin: '*', // Autoriser toutes les origines pendant le développement
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  } else {
    // Pour la production, spécifiez explicitement les origines autorisées
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
    app.enableCors({
      origin: allowedOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  }
  
  const options = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('API de gestion de tâches avec authentification')
    .setVersion('1.0')
    .addServer(process.env.API_BASE_URL || 'http://localhost:3000/', 'Serveur actuel')
    .addServer('https://staging.yourapi.com/', 'Staging')
    .addServer('https://production.yourapi.com/', 'Production')
    .addTag('Authentication')
    .addTag('Tasks')
    .addTag('Users')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();