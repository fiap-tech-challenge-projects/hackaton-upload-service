import { Inject, Injectable } from '@nestjs/common'
import { IAnalysisRepository, ANALYSIS_REPOSITORY } from '@domain/repositories'
import { AnalysisMapper } from '../mappers/analysis.mapper'
import { ListAnalysesQueryDto, ListAnalysesResponseDto } from '../dtos/list-analyses.dto'

/**
 * Lists analyses with pagination and optional status filter.
 */
@Injectable()
export class ListAnalysesUseCase {
  constructor(
    @Inject(ANALYSIS_REPOSITORY)
    private readonly analysisRepository: IAnalysisRepository,
  ) {}

  async execute(query: ListAnalysesQueryDto): Promise<ListAnalysesResponseDto> {
    const page = query.page || 1
    const limit = Math.min(query.limit || 10, 100)

    const result = await this.analysisRepository.findAll({
      page,
      limit,
      status: query.status,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    })

    return {
      data: result.data.map((analysis) => AnalysisMapper.toDto(analysis)),
      meta: result.meta,
    }
  }
}
