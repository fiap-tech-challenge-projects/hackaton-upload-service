import { Analysis } from '../entities/analysis.entity'
import { AnalysisStatus } from '../value-objects/analysis-status.vo'

export interface ListAnalysesFilters {
  page?: number
  limit?: number
  status?: AnalysisStatus
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Repository interface for Analysis persistence operations.
 */
export interface IAnalysisRepository {
  /**
   * Create a new Analysis record
   */
  create(analysis: Analysis): Promise<Analysis>

  /**
   * Find an Analysis by ID, returns null if not found
   */
  findById(id: string): Promise<Analysis | null>

  /**
   * Update an existing Analysis record
   */
  update(id: string, analysis: Analysis): Promise<Analysis>

  /**
   * List analyses with pagination and optional filters
   */
  findAll(filters: ListAnalysesFilters): Promise<PaginatedResult<Analysis>>
}

export const ANALYSIS_REPOSITORY = Symbol('ANALYSIS_REPOSITORY')
