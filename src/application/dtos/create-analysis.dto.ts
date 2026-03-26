/**
 * Input DTO for the CreateAnalysisUseCase.
 * File content comes as a buffer from multer.
 */
export interface CreateAnalysisDto {
  fileName: string
  fileBuffer: Buffer
  fileType: string
  fileSize: number
  correlationId: string
}
