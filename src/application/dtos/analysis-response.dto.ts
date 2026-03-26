import { AnalysisStatus } from '@domain/value-objects'

/**
 * Output DTO returned from use cases for a single analysis.
 */
export interface AnalysisResponseDto {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  status: AnalysisStatus
  fileUrl?: string
  reportId?: string
  errorMessage?: string
  correlationId: string
  createdAt: string
  updatedAt: string
}

/**
 * Input for update-analysis-status use case.
 */
export interface UpdateAnalysisStatusDto {
  analysisId: string
  status: AnalysisStatus
  reportId?: string
  errorMessage?: string
}
