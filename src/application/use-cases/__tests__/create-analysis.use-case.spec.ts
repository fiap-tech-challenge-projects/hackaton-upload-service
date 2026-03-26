import { CreateAnalysisUseCase } from '../create-analysis.use-case'
import { Analysis } from '@domain/entities'
import { AnalysisStatus } from '@domain/value-objects'
import { IAnalysisRepository, ANALYSIS_REPOSITORY } from '@domain/repositories'
import { IStorageService, STORAGE_SERVICE } from '../../ports/storage.port'
import { IEventPublisher, EVENT_PUBLISHER } from '../../ports/event-publisher.port'
import { InvalidFileTypeException, FileTooLargeException } from '@shared/exceptions'
import { Test, TestingModule } from '@nestjs/testing'

const makeAnalysis = (id: string, status: AnalysisStatus = AnalysisStatus.RECEIVED): Analysis =>
  new Analysis(
    id,
    'diagram.png',
    's3://bucket/analyses/id/diagram.png',
    'image/png',
    1024,
    status,
    'corr-id-1',
    undefined,
    undefined,
    new Date(),
    new Date(),
  )

describe('CreateAnalysisUseCase', () => {
  let useCase: CreateAnalysisUseCase
  let analysisRepository: jest.Mocked<IAnalysisRepository>
  let storageService: jest.Mocked<IStorageService>
  let eventPublisher: jest.Mocked<IEventPublisher>

  beforeEach(async () => {
    const mockRepository: jest.Mocked<IAnalysisRepository> = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
    }

    const mockStorage: jest.Mocked<IStorageService> = {
      uploadFile: jest.fn(),
      getPresignedUrl: jest.fn(),
      deleteFile: jest.fn(),
    }

    const mockPublisher: jest.Mocked<IEventPublisher> = {
      publishAnalysisRequested: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAnalysisUseCase,
        { provide: ANALYSIS_REPOSITORY, useValue: mockRepository },
        { provide: STORAGE_SERVICE, useValue: mockStorage },
        { provide: EVENT_PUBLISHER, useValue: mockPublisher },
      ],
    }).compile()

    useCase = module.get<CreateAnalysisUseCase>(CreateAnalysisUseCase)
    analysisRepository = mockRepository
    storageService = mockStorage
    eventPublisher = mockPublisher
  })

  describe('execute - success path', () => {
    it('should upload file, create analysis in PROCESSING status, and publish event', async () => {
      const receivedAnalysis = makeAnalysis('new-id', AnalysisStatus.RECEIVED)
      const processingAnalysis = makeAnalysis('new-id', AnalysisStatus.PROCESSING)

      storageService.uploadFile.mockResolvedValue('s3://bucket/analyses/new-id/diagram.png')
      analysisRepository.create.mockResolvedValue(receivedAnalysis)
      analysisRepository.update.mockResolvedValue(processingAnalysis)
      eventPublisher.publishAnalysisRequested.mockResolvedValue()

      const result = await useCase.execute({
        fileName: 'diagram.png',
        fileBuffer: Buffer.from('data'),
        fileType: 'image/png',
        fileSize: 1024,
        correlationId: 'corr-id-1',
      })

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining('analyses/'),
        expect.any(Buffer),
        'image/png',
      )
      expect(analysisRepository.create).toHaveBeenCalledTimes(1)
      expect(analysisRepository.update).toHaveBeenCalledTimes(1)
      expect(eventPublisher.publishAnalysisRequested).toHaveBeenCalledWith(
        'corr-id-1',
        expect.objectContaining({ analysisId: 'new-id' }),
      )
      expect(result.status).toBe(AnalysisStatus.PROCESSING)
    })
  })

  describe('execute - validation failures', () => {
    it('should throw InvalidFileTypeException for unsupported file type', async () => {
      await expect(
        useCase.execute({
          fileName: 'virus.exe',
          fileBuffer: Buffer.from('data'),
          fileType: 'application/x-msdownload',
          fileSize: 1024,
          correlationId: 'corr-id-1',
        }),
      ).rejects.toThrow(InvalidFileTypeException)

      expect(storageService.uploadFile).not.toHaveBeenCalled()
      expect(analysisRepository.create).not.toHaveBeenCalled()
    })

    it('should throw FileTooLargeException when file exceeds 10MB', async () => {
      const elevenMb = 11 * 1024 * 1024

      await expect(
        useCase.execute({
          fileName: 'large.png',
          fileBuffer: Buffer.alloc(elevenMb),
          fileType: 'image/png',
          fileSize: elevenMb,
          correlationId: 'corr-id-1',
        }),
      ).rejects.toThrow(FileTooLargeException)

      expect(storageService.uploadFile).not.toHaveBeenCalled()
    })

    it('should accept PDF files', async () => {
      const receivedAnalysis = makeAnalysis('pdf-id', AnalysisStatus.RECEIVED)
      const processingAnalysis = makeAnalysis('pdf-id', AnalysisStatus.PROCESSING)

      storageService.uploadFile.mockResolvedValue('s3://bucket/analyses/pdf-id/doc.pdf')
      analysisRepository.create.mockResolvedValue(receivedAnalysis)
      analysisRepository.update.mockResolvedValue(processingAnalysis)
      eventPublisher.publishAnalysisRequested.mockResolvedValue()

      const result = await useCase.execute({
        fileName: 'doc.pdf',
        fileBuffer: Buffer.from('pdf-data'),
        fileType: 'application/pdf',
        fileSize: 2048,
        correlationId: 'corr-id-2',
      })

      expect(result.status).toBe(AnalysisStatus.PROCESSING)
    })
  })
})
