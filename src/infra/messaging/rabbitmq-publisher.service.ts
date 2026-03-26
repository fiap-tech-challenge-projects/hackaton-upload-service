import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import * as amqp from 'amqplib'
import { IEventPublisher, AnalysisRequestedPayload } from '@application/ports/event-publisher.port'

const EXCHANGE_NAME = 'hackaton-events'
const ROUTING_KEY_ANALYSIS_REQUESTED = 'analysis.requested'

/**
 * RabbitMQ implementation of IEventPublisher.
 * Connects on module init and disconnects on module destroy.
 * Publishes events to the 'hackaton-events' fanout/topic exchange.
 */
@Injectable()
export class RabbitMQPublisherService implements IEventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQPublisherService.name)
  private connection: amqp.ChannelModel | null = null
  private channel: amqp.Channel | null = null

  async onModuleInit(): Promise<void> {
    await this.connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect()
  }

  async publishAnalysisRequested(
    correlationId: string,
    payload: AnalysisRequestedPayload,
  ): Promise<void> {
    const message = {
      eventType: 'analysis.requested',
      timestamp: new Date().toISOString(),
      correlationId,
      source: 'upload-service',
      version: '1.0',
      payload,
    }

    await this.publish(ROUTING_KEY_ANALYSIS_REQUESTED, message)

    this.logger.log({
      message: 'Published analysis.requested event',
      correlationId,
      analysisId: payload.analysisId,
    })
  }

  private async publish(routingKey: string, message: object): Promise<void> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not available, attempting reconnect')
      await this.connect()
    }

    const content = Buffer.from(JSON.stringify(message))
    this.channel!.publish(EXCHANGE_NAME, routingKey, content, {
      contentType: 'application/json',
      persistent: true,
    })
  }

  private async connect(): Promise<void> {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
    try {
      this.connection = await amqp.connect(url)
      this.channel = await this.connection.createChannel()

      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true })

      this.logger.log('RabbitMQ publisher connected')
    } catch (error) {
      this.logger.error({ message: 'Failed to connect to RabbitMQ', error: error.message })
    }
  }

  private async disconnect(): Promise<void> {
    try {
      await this.channel?.close()
      await this.connection?.close()
      this.logger.log('RabbitMQ publisher disconnected')
    } catch (error) {
      this.logger.error({ message: 'Error disconnecting from RabbitMQ', error: error.message })
    }
  }
}
