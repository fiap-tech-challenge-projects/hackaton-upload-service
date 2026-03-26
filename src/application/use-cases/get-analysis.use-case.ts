import { Inject, Injectable, Logger } from '@nestjs/common'
import { IAnalysisRepository, ANALYSIS_REPOSITORY } from '@domain/repositories'
import { IStorageService, STORAGE_SERVICE } from '../ports/storage.port'
import { AnalysisResponseDto } from '../dtos/analysis-response.dto'
import { AnalysisMapper } from '../mappers/analysis.mapper'
import { AnalysisNotFoundException } from '@shared/exceptions'

/**
 * Retrieves a single analysis by ID.
 * Generates a presigned URL for the file when returning the response.
 */
@Injectable()
export class GetAnalysisUseCase {
  private readonly logger = new Logger(GetAnalysisUseCase.name)

  constructor(
    @Inject(ANALYSIS_REPOSITORY)
    private readonly analysisRepository: IAnalysisRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  async execute(id: string): Promise<AnalysisResponseDto> {
    const analysis = await this.analysisRepository.findById(id)

    if (!analysis) {
      throw new AnalysisNotFoundException(id)
    }

    let presignedUrl: string | undefined
    try {
      const storageKey = `analyses/${analysis.id}/${analysis.fileName}`
      presignedUrl = await this.storageService.getPresignedUrl(storageKey, 3600)
    } catch (error) {
      this.logger.warn({
        message: 'Failed to generate presigned URL',
        analysisId: id,
        error: error.message,
      })
    }

    return AnalysisMapper.toDto(analysis, presignedUrl)
  }
}
