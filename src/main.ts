import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Enable CORS
  app.enableCors()

  // API prefix
  const apiPrefix = process.env.API_PREFIX || '/api/v1'
  app.setGlobalPrefix(apiPrefix)

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Upload Service API')
    .setDescription(
      'Upload and Orchestration Service for Architecture Diagram Analysis - FIAP Hackaton',
    )
    .setVersion('1.0')
    .addTag('analyses', 'Architecture diagram analysis endpoints')
    .addTag('health', 'Health check endpoint')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)

  console.log(`Upload Service is running on: http://localhost:${port}${apiPrefix}`)
  console.log(`Swagger docs available at: http://localhost:${port}${apiPrefix}/docs`)
}

bootstrap()
