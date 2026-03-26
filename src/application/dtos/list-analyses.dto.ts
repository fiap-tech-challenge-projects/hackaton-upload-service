import { AnalysisStatus } from '@domain/value-objects'
import { AnalysisResponseDto } from './analysis-response.dto'

export interface ListAnalysesQueryDto {
  page?: number
  limit?: number
  status?: AnalysisStatus
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ListAnalysesResponseDto = PaginatedResponse<AnalysisResponseDto>
