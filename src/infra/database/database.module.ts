import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { PrismaAnalysisRepository } from './repositories'
import { ANALYSIS_REPOSITORY } from '@domain/repositories'

/**
 * Database module providing PrismaService and repository implementations.
 */
@Module({
  providers: [
    PrismaService,
    {
      provide: ANALYSIS_REPOSITORY,
      useClass: PrismaAnalysisRepository,
    },
  ],
  exports: [PrismaService, ANALYSIS_REPOSITORY],
})
export class DatabaseModule {}
