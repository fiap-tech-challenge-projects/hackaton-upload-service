import { BaseEntity } from '@shared/base'
import {
  AnalysisStatus,
  ALLOWED_STATUS_TRANSITIONS,
  isValidTransition,
} from '../value-objects/analysis-status.vo'
import { InvalidAnalysisStatusTransitionException } from '@shared/exceptions'

/**
 * Analysis aggregate root.
 * Represents an architecture diagram analysis request.
 * Owns the status state machine: RECEIVED -> PROCESSING -> ANALYZED | ERROR
 */
export class Analysis extends BaseEntity {
  public readonly fileName: string
  public readonly fileUrl: string
  public readonly fileType: string
  public readonly fileSize: number
  public readonly status: AnalysisStatus
  public readonly reportId: string | undefined
  public readonly errorMessage: string | undefined
  public readonly correlationId: string

  constructor(
    id: string,
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number,
    status: AnalysisStatus,
    correlationId: string,
    reportId: string | undefined,
    errorMessage: string | undefined,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    super(id, createdAt, updatedAt)
    this.fileName = fileName
    this.fileUrl = fileUrl
    this.fileType = fileType
    this.fileSize = fileSize
    this.status = status
    this.correlationId = correlationId
    this.reportId = reportId
    this.errorMessage = errorMessage
  }

  /**
   * Factory method to create a new Analysis in RECEIVED status.
   */
  public static create(
    fileName: string,
    fileUrl: string,
    fileType: string,
    fileSize: number,
    correlationId: string,
  ): Analysis {
    const now = new Date()
    return new Analysis(
      '',
      fileName,
      fileUrl,
      fileType,
      fileSize,
      AnalysisStatus.RECEIVED,
      correlationId,
      undefined,
      undefined,
      now,
      now,
    )
  }

  /**
   * Validates and performs a status transition.
   */
  private validateTransition(newStatus: AnalysisStatus): void {
    if (!isValidTransition(this.status, newStatus)) {
      const allowed = (ALLOWED_STATUS_TRANSITIONS[this.status] ?? []) as AnalysisStatus[]
      throw new InvalidAnalysisStatusTransitionException(this.status, newStatus, allowed)
    }
  }

  /**
   * Transitions status to PROCESSING.
   */
  public startProcessing(): Analysis {
    this.validateTransition(AnalysisStatus.PROCESSING)
    return new Analysis(
      this.id,
      this.fileName,
      this.fileUrl,
      this.fileType,
      this.fileSize,
      AnalysisStatus.PROCESSING,
      this.correlationId,
      this.reportId,
      this.errorMessage,
      this.createdAt,
      new Date(),
    )
  }

  /**
   * Transitions status to ANALYZED and sets the reportId.
   */
  public markAnalyzed(reportId: string): Analysis {
    this.validateTransition(AnalysisStatus.ANALYZED)
    return new Analysis(
      this.id,
      this.fileName,
      this.fileUrl,
      this.fileType,
      this.fileSize,
      AnalysisStatus.ANALYZED,
      this.correlationId,
      reportId,
      this.errorMessage,
      this.createdAt,
      new Date(),
    )
  }

  /**
   * Transitions status to ERROR and records the error message.
   */
  public markError(errorMessage: string): Analysis {
    this.validateTransition(AnalysisStatus.ERROR)
    return new Analysis(
      this.id,
      this.fileName,
      this.fileUrl,
      this.fileType,
      this.fileSize,
      AnalysisStatus.ERROR,
      this.correlationId,
      this.reportId,
      errorMessage,
      this.createdAt,
      new Date(),
    )
  }

  /**
   * Returns whether the analysis is in a terminal state.
   */
  public isTerminal(): boolean {
    return this.status === AnalysisStatus.ANALYZED || this.status === AnalysisStatus.ERROR
  }
}
