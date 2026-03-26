import { Analysis } from '@domain/entities'
import { AnalysisResponseDto } from '../dtos/analysis-response.dto'

/**
 * Maps between the Analysis domain entity and response DTOs.
 */
export class AnalysisMapper {
  static toDto(analysis: Analysis, presignedUrl?: string): AnalysisResponseDto {
    return {
      id: analysis.id,
      fileName: analysis.fileName,
      fileType: analysis.fileType,
      fileSize: analysis.fileSize,
      status: analysis.status,
      fileUrl: presignedUrl,
      reportId: analysis.reportId,
      errorMessage: analysis.errorMessage,
      correlationId: analysis.correlationId,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
    }
  }
}
