import { Inject, Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Analysis } from '@domain/entities'
import { IAnalysisRepository, ANALYSIS_REPOSITORY } from '@domain/repositories'
import { IEventPublisher, EVENT_PUBLISHER } from '../ports/event-publisher.port'
import { IStorageService, STORAGE_SERVICE } from '../ports/storage.port'
import { CreateAnalysisDto } from '../dtos/create-analysis.dto'
import { AnalysisResponseDto } from '../dtos/analysis-response.dto'
import { AnalysisMapper } from '../mappers/analysis.mapper'
import { InvalidFileTypeException, FileTooLargeException } from '@shared/exceptions'

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Creates a new analysis:
 * 1. Validates file type and size
 * 2. Uploads file to S3/MinIO
 * 3. Creates Analysis record with RECEIVED status
 * 4. Transitions status to PROCESSING
 * 5. Persists the PROCESSING record
 * 6. Publishes analysis.requested event
 * 7. Returns 202 response with PROCESSING status
 */
@Injectable()
export class CreateAnalysisUseCase {
  private readonly logger = new Logger(CreateAnalysisUseCase.name)

  constructor(
    @Inject(ANALYSIS_REPOSITORY)
    private readonly analysisRepository: IAnalysisRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreateAnalysisDto): Promise<AnalysisResponseDto> {
    this.validateFile(dto.fileType, dto.fileSize)

    const analysisId = uuidv4()
    const storageKey = `analyses/${analysisId}/${dto.fileName}`

    this.logger.log({
      message: 'Uploading file to storage',
      correlationId: dto.correlationId,
      analysisId,
      fileName: dto.fileName,
    })

    const fileUrl = await this.storageService.uploadFile(storageKey, dto.fileBuffer, dto.fileType)

    const analysis = Analysis.create(
      dto.fileName,
      fileUrl,
      dto.fileType,
      dto.fileSize,
      dto.correlationId,
    )

    const created = await this.analysisRepository.create(
      new Analysis(
        analysisId,
        analysis.fileName,
        analysis.fileUrl,
        analysis.fileType,
        analysis.fileSize,
        analysis.status,
        analysis.correlationId,
        analysis.reportId,
        analysis.errorMessage,
        analysis.createdAt,
        analysis.updatedAt,
      ),
    )

    const processing = created.startProcessing()
    const updated = await this.analysisRepository.update(created.id, processing)

    this.logger.log({
      message: 'Publishing analysis.requested event',
      correlationId: dto.correlationId,
      analysisId: updated.id,
    })

    await this.eventPublisher.publishAnalysisRequested(dto.correlationId, {
      analysisId: updated.id,
      fileName: updated.fileName,
      fileUrl: updated.fileUrl,
      fileType: updated.fileType,
      fileSize: updated.fileSize,
    })

    return AnalysisMapper.toDto(updated)
  }

  private validateFile(fileType: string, fileSize: number): void {
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new InvalidFileTypeException(fileType, ['PNG', 'JPG', 'JPEG', 'PDF'])
    }
    if (fileSize > MAX_FILE_SIZE) {
      throw new FileTooLargeException(fileSize, MAX_FILE_SIZE)
    }
  }
}
