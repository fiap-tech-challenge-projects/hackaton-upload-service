import { Inject, Injectable, Logger } from '@nestjs/common'
import { IAnalysisRepository, ANALYSIS_REPOSITORY } from '@domain/repositories'
import { AnalysisStatus } from '@domain/value-objects'
import { UpdateAnalysisStatusDto, AnalysisResponseDto } from '../dtos/analysis-response.dto'
import { AnalysisMapper } from '../mappers/analysis.mapper'
import { AnalysisNotFoundException } from '@shared/exceptions'

/**
 * Updates analysis status. Called by RabbitMQ consumers when:
 * - analysis.failed is received -> status = ERROR
 * - report.generated is received -> status = ANALYZED, sets reportId
 */
@Injectable()
export class UpdateAnalysisStatusUseCase {
  private readonly logger = new Logger(UpdateAnalysisStatusUseCase.name)

  constructor(
    @Inject(ANALYSIS_REPOSITORY)
    private readonly analysisRepository: IAnalysisRepository,
  ) {}

  async execute(dto: UpdateAnalysisStatusDto): Promise<AnalysisResponseDto> {
    const analysis = await this.analysisRepository.findById(dto.analysisId)

    if (!analysis) {
      throw new AnalysisNotFoundException(dto.analysisId)
    }

    let updated = analysis

    if (dto.status === AnalysisStatus.ANALYZED && dto.reportId) {
      updated = analysis.markAnalyzed(dto.reportId)
    } else if (dto.status === AnalysisStatus.ERROR) {
      updated = analysis.markError(dto.errorMessage || 'Unknown error')
    } else {
      throw new Error(`Unsupported status update: ${dto.status}`)
    }

    const persisted = await this.analysisRepository.update(dto.analysisId, updated)

    this.logger.log({
      message: 'Analysis status updated',
      analysisId: dto.analysisId,
      status: dto.status,
    })

    return AnalysisMapper.toDto(persisted)
  }
}
