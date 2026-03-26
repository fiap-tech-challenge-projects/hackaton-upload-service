import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger'
import { v4 as uuidv4 } from 'uuid'
import { CreateAnalysisUseCase } from '@application/use-cases/create-analysis.use-case'
import { GetAnalysisUseCase } from '@application/use-cases/get-analysis.use-case'
import { ListAnalysesUseCase } from '@application/use-cases/list-analyses.use-case'
import { AnalysisStatus } from '@domain/value-objects'
import { AnalysisNotFoundException } from '@shared/exceptions'
import { CreateAnalysisRequest } from '../dtos/create-analysis.request'

@ApiTags('analyses')
@Controller('analyses')
export class AnalysesController {
  constructor(
    private readonly createAnalysisUseCase: CreateAnalysisUseCase,
    private readonly getAnalysisUseCase: GetAnalysisUseCase,
    private readonly listAnalysesUseCase: ListAnalysesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an architecture diagram for analysis' })
  @ApiResponse({ status: 202, description: 'File accepted and processing started' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: CreateAnalysisRequest) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    try {
      return await this.createAnalysisUseCase.execute({
        fileName: file.originalname,
        fileBuffer: file.buffer,
        fileType: file.mimetype,
        fileSize: file.size,
        correlationId: body.correlationId || uuidv4(),
      })
    } catch (error) {
      if (error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE') {
        throw new BadRequestException(error.message)
      }
      throw error
    }
  }

  @Get()
  @ApiOperation({ summary: 'List analyses with pagination and optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of analyses' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AnalysisStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: AnalysisStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.listAnalysesUseCase.execute({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      sortBy,
      sortOrder,
    })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get analysis by ID' })
  @ApiParam({ name: 'id', description: 'Analysis UUID' })
  @ApiResponse({ status: 200, description: 'Analysis found' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async findById(@Param('id') id: string) {
    try {
      return await this.getAnalysisUseCase.execute(id)
    } catch (error) {
      if (error instanceof AnalysisNotFoundException) {
        throw new NotFoundException(error.message)
      }
      throw error
    }
  }
}
