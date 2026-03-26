import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import * as amqp from 'amqplib'
import { UpdateAnalysisStatusUseCase } from '@application/use-cases'
import { AnalysisStatus } from '@domain/value-objects'

const EXCHANGE_NAME = 'hackaton-events'
const QUEUE_ANALYSIS_FAILED = 'analysis.failed'
const QUEUE_REPORT_GENERATED = 'report.generated'

/**
 * RabbitMQ consumer service.
 * Listens to:
 *   - 'analysis.failed' -> updates analysis to ERROR status
 *   - 'report.generated' -> updates analysis to ANALYZED status with reportId
 */
const RECONNECT_DELAY_MS = 5000

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumerService.name)
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private isDestroyed = false

  constructor(private readonly updateAnalysisStatusUseCase: UpdateAnalysisStatusUseCase) {}

  async onModuleInit(): Promise<void> {
    await this.connect()
  }

  async onModuleDestroy(): Promise<void> {
    this.isDestroyed = true
    await this.disconnect()
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed) return
    this.logger.log(`Scheduling RabbitMQ reconnect in ${RECONNECT_DELAY_MS}ms`)
    setTimeout(() => this.connect(), RECONNECT_DELAY_MS)
  }

  private async connect(): Promise<void> {
    if (this.isDestroyed) return
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
    try {
      this.connection = await amqp.connect(url)
      this.channel = await this.connection.createChannel()

      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true })

      await this.setupAnalysisFailedConsumer()
      await this.setupReportGeneratedConsumer()

      this.connection.on('error', (err) => {
        this.logger.error({ message: 'RabbitMQ connection error', error: err.message })
        this.connection = null
        this.channel = null
        this.scheduleReconnect()
      })

      this.connection.on('close', () => {
        if (!this.isDestroyed) {
          this.logger.warn('RabbitMQ connection closed unexpectedly')
          this.connection = null
          this.channel = null
          this.scheduleReconnect()
        }
      })

      this.logger.log('RabbitMQ consumer connected and listening')
    } catch (error) {
      this.logger.error({ message: 'Failed to connect RabbitMQ consumer', error: error.message })
      this.scheduleReconnect()
    }
  }

  private async setupAnalysisFailedConsumer(): Promise<void> {
    const q = await this.channel!.assertQueue(QUEUE_ANALYSIS_FAILED, { durable: true })
    await this.channel!.bindQueue(q.queue, EXCHANGE_NAME, QUEUE_ANALYSIS_FAILED)

    this.channel!.consume(q.queue, async (msg) => {
      if (!msg) return

      try {
        const content = JSON.parse(msg.content.toString())
        const { analysisId, message: errorMessage } = content.payload ?? content

        this.logger.log({ message: 'Received analysis.failed event', analysisId })

        await this.updateAnalysisStatusUseCase.execute({
          analysisId,
          status: AnalysisStatus.ERROR,
          errorMessage: errorMessage || 'Analysis processing failed',
        })

        this.channel!.ack(msg)
      } catch (error) {
        this.logger.error({
          message: 'Error processing analysis.failed message',
          error: error.message,
        })
        this.channel!.nack(msg, false, false)
      }
    })
  }

  private async setupReportGeneratedConsumer(): Promise<void> {
    const q = await this.channel!.assertQueue(QUEUE_REPORT_GENERATED, { durable: true })
    await this.channel!.bindQueue(q.queue, EXCHANGE_NAME, QUEUE_REPORT_GENERATED)

    this.channel!.consume(q.queue, async (msg) => {
      if (!msg) return

      try {
        const content = JSON.parse(msg.content.toString())
        const { analysisId, reportId } = content.payload ?? content

        this.logger.log({ message: 'Received report.generated event', analysisId, reportId })

        await this.updateAnalysisStatusUseCase.execute({
          analysisId,
          status: AnalysisStatus.ANALYZED,
          reportId,
        })

        this.channel!.ack(msg)
      } catch (error) {
        this.logger.error({
          message: 'Error processing report.generated message',
          error: error.message,
        })
        this.channel!.nack(msg, false, false)
      }
    })
  }

  private async disconnect(): Promise<void> {
    try {
      await this.channel?.close()
      await this.connection?.close()
      this.logger.log('RabbitMQ consumer disconnected')
    } catch (error) {
      this.logger.error({ message: 'Error disconnecting RabbitMQ consumer', error: error.message })
    }
  }
}
