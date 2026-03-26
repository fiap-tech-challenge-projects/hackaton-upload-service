/**
 * Payload for the analysis.requested event.
 */
export interface AnalysisRequestedPayload {
  analysisId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
}

/**
 * Port interface for publishing domain events.
 * Concrete implementations: RabbitMQ (local), SQS+EventBridge (cloud).
 */
export interface IEventPublisher {
  publishAnalysisRequested(correlationId: string, payload: AnalysisRequestedPayload): Promise<void>
}

export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER')
