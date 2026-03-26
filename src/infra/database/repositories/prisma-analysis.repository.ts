import { Injectable } from '@nestjs/common'
import { AnalysisStatus as PrismaAnalysisStatus } from '@prisma/client'
import { Analysis } from '@domain/entities'
import {
  IAnalysisRepository,
  ListAnalysesFilters,
  PaginatedResult,
} from '@domain/repositories'
import { AnalysisStatus } from '@domain/value-objects'
import { PrismaService } from '../prisma.service'

/**
 * Prisma implementation of IAnalysisRepository.
 * Maps between Prisma models and domain entities.
 */
@Injectable()
export class PrismaAnalysisRepository implements IAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(analysis: Analysis): Promise<Analysis> {
    const created = await this.prisma.analysis.create({
      data: {
        id: analysis.id || undefined,
        fileName: analysis.fileName,
        fileUrl: analysis.fileUrl,
        fileType: analysis.fileType,
        fileSize: analysis.fileSize,
        status: analysis.status as PrismaAnalysisStatus,
        correlationId: analysis.correlationId,
        reportId: analysis.reportId,
        errorMessage: analysis.errorMessage,
      },
    })

    return this.toDomain(created)
  }

  async findById(id: string): Promise<Analysis | null> {
    const found = await this.prisma.analysis.findUnique({
      where: { id },
    })

    return found ? this.toDomain(found) : null
  }

  async update(id: string, analysis: Analysis): Promise<Analysis> {
    const updated = await this.prisma.analysis.update({
      where: { id },
      data: {
        status: analysis.status as PrismaAnalysisStatus,
        reportId: analysis.reportId,
        errorMessage: analysis.errorMessage,
        updatedAt: analysis.updatedAt,
      },
    })

    return this.toDomain(updated)
  }

  async findAll(filters: ListAnalysesFilters): Promise<PaginatedResult<Analysis>> {
    const page = filters.page || 1
    const limit = filters.limit || 10
    const skip = (page - 1) * limit

    const where = filters.status ? { status: filters.status as PrismaAnalysisStatus } : {}

    const orderByField = filters.sortBy || 'createdAt'
    const orderByDirection = filters.sortOrder || 'desc'

    const [data, total] = await Promise.all([
      this.prisma.analysis.findMany({
        where,
        orderBy: { [orderByField]: orderByDirection },
        skip,
        take: limit,
      }),
      this.prisma.analysis.count({ where }),
    ])

    return {
      data: data.map((item) => this.toDomain(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  private toDomain(model: any): Analysis {
    return new Analysis(
      model.id,
      model.fileName,
      model.fileUrl,
      model.fileType,
      model.fileSize,
      model.status as AnalysisStatus,
      model.correlationId,
      model.reportId ?? undefined,
      model.errorMessage ?? undefined,
      model.createdAt,
      model.updatedAt,
    )
  }
}
