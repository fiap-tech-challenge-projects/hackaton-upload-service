import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { AnalysesController } from '../analyses.controller'
import { CreateAnalysisUseCase } from '@application/use-cases/create-analysis.use-case'
import { GetAnalysisUseCase } from '@application/use-cases/get-analysis.use-case'
import { ListAnalysesUseCase } from '@application/use-cases/list-analyses.use-case'
import { AnalysisStatus } from '@domain/value-objects'
import { AnalysisNotFoundException } from '@shared/exceptions'

const mockAnalysisDto = {
  id: 'analysis-1',
  fileName: 'diagram.png',
  fileType: 'image/png',
  fileSize: 1024,
  status: AnalysisStatus.PROCESSING,
  correlationId: 'corr-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('AnalysesController', () => {
  let controller: AnalysesController
  let createUseCase: jest.Mocked<CreateAnalysisUseCase>
  let getUseCase: jest.Mocked<GetAnalysisUseCase>
  let listUseCase: jest.Mocked<ListAnalysesUseCase>

  beforeEach(async () => {
    const mockCreate = { execute: jest.fn() } as unknown as jest.Mocked<CreateAnalysisUseCase>
    const mockGet = { execute: jest.fn() } as unknown as jest.Mocked<GetAnalysisUseCase>
    const mockList = { execute: jest.fn() } as unknown as jest.Mocked<ListAnalysesUseCase>

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysesController],
      providers: [
        { provide: CreateAnalysisUseCase, useValue: mockCreate },
        { provide: GetAnalysisUseCase, useValue: mockGet },
        { provide: ListAnalysesUseCase, useValue: mockList },
      ],
    }).compile()

    controller = module.get<AnalysesController>(AnalysesController)
    createUseCase = mockCreate
    getUseCase = mockGet
    listUseCase = mockList
  })

  describe('POST /analyses', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'diagram.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('data'),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    }

    it('should accept a file upload and return 202 with analysis DTO', async () => {
      createUseCase.execute.mockResolvedValue(mockAnalysisDto)

      const result = await controller.create(mockFile, { correlationId: 'corr-1' })

      expect(createUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'diagram.png',
          fileType: 'image/png',
          fileSize: 1024,
          correlationId: 'corr-1',
        }),
      )
      expect(result).toEqual(mockAnalysisDto)
    })

    it('should auto-generate correlationId when not provided', async () => {
      createUseCase.execute.mockResolvedValue(mockAnalysisDto)

      await controller.create(mockFile, {})

      const callArg = createUseCase.execute.mock.calls[0][0]
      expect(callArg.correlationId).toBeDefined()
      expect(callArg.correlationId.length).toBeGreaterThan(0)
    })

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.create(undefined as any, {})).rejects.toThrow(BadRequestException)
      expect(createUseCase.execute).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException for invalid file type errors', async () => {
      const domainError = new Error('File type not allowed')
      ;(domainError as any).code = 'INVALID_FILE_TYPE'
      createUseCase.execute.mockRejectedValue(domainError)

      await expect(controller.create(mockFile, {})).rejects.toThrow(BadRequestException)
    })
  })

  describe('GET /analyses', () => {
    it('should return a paginated list of analyses', async () => {
      const paginatedResult = {
        data: [mockAnalysisDto],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }
      listUseCase.execute.mockResolvedValue(paginatedResult)

      const result = await controller.findAll('1', '10', undefined, 'createdAt', 'desc')

      expect(listUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      expect(result).toEqual(paginatedResult)
    })

    it('should pass status filter to use case', async () => {
      const paginatedResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
      listUseCase.execute.mockResolvedValue(paginatedResult)

      await controller.findAll(undefined, undefined, AnalysisStatus.PROCESSING, undefined, undefined)

      expect(listUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ status: AnalysisStatus.PROCESSING }),
      )
    })
  })

  describe('GET /analyses/:id', () => {
    it('should return an analysis by ID', async () => {
      getUseCase.execute.mockResolvedValue(mockAnalysisDto)

      const result = await controller.findById('analysis-1')

      expect(getUseCase.execute).toHaveBeenCalledWith('analysis-1')
      expect(result).toEqual(mockAnalysisDto)
    })

    it('should throw NotFoundException when analysis is not found', async () => {
      getUseCase.execute.mockRejectedValue(new AnalysisNotFoundException('missing-id'))

      await expect(controller.findById('missing-id')).rejects.toThrow(NotFoundException)
    })
  })
})
