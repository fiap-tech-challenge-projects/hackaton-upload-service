import { Module } from '@nestjs/common'
import { RabbitMQPublisherService } from './rabbitmq-publisher.service'
import { RabbitMQConsumerService } from './rabbitmq-consumer.service'
import { EVENT_PUBLISHER } from '@application/ports/event-publisher.port'
import { UpdateAnalysisStatusUseCase } from '@application/use-cases'
import { DatabaseModule } from '../database/database.module'

/**
 * Messaging module providing RabbitMQ publisher and consumer services.
 * The consumer depends on UpdateAnalysisStatusUseCase which needs the repository,
 * so DatabaseModule is imported here.
 */
@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: EVENT_PUBLISHER,
      useClass: RabbitMQPublisherService,
    },
    RabbitMQConsumerService,
    UpdateAnalysisStatusUseCase,
  ],
  exports: [EVENT_PUBLISHER],
})
export class MessagingModule {}
