import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { appConfig, s3Config, rabbitMQConfig } from '@config/app.config'
import { DatabaseModule } from '@infra/database/database.module'
import { StorageModule } from '@infra/storage/storage.module'
import { MessagingModule } from '@infra/messaging/messaging.module'
import { AnalysesController, HealthController } from './interfaces/rest/controllers'
import {
  CreateAnalysisUseCase,
  GetAnalysisUseCase,
  ListAnalysesUseCase,
} from '@application/use-cases'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, s3Config, rabbitMQConfig],
    }),
    DatabaseModule,
    StorageModule,
    MessagingModule,
  ],
  controllers: [AnalysesController, HealthController],
  providers: [
    CreateAnalysisUseCase,
    GetAnalysisUseCase,
    ListAnalysesUseCase,
  ],
})
export class AppModule {}
