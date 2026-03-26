import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

/**
 * Request DTO for POST /analyses (multipart/form-data).
 * The 'file' field is handled by multer FileInterceptor.
 */
export class CreateAnalysisRequest {
  @ApiPropertyOptional({
    description: 'Optional correlation ID for request tracing. Auto-generated if not provided.',
    example: 'req-abc-123',
  })
  @IsOptional()
  @IsString()
  correlationId?: string
}

/**
 * Swagger file upload property helper used in controller decorators.
 */
export const FileUploadApiBody = () =>
  ApiProperty({
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'Architecture diagram file (PNG, JPG, JPEG, PDF). Max 10MB.',
      },
      correlationId: {
        type: 'string',
        description: 'Optional correlation ID for request tracing.',
      },
    },
  })
