import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { DomainException } from '../exceptions/domain.exception'

/**
 * Global HTTP exception filter that standardizes error responses.
 * Handles both NestJS HttpExceptions and domain-specific exceptions.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'Internal Server Error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message
        error = (exceptionResponse as any).error || exception.name
      } else {
        message = exceptionResponse as string
        error = exception.name
      }
    } else if (exception instanceof DomainException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY
      message = exception.message
      error = exception.code
    } else if (exception instanceof Error) {
      message = exception.message
      error = exception.name
    }

    const correlationId = (request as any).correlationId

    this.logger.error({
      message: `${status} ${error}: ${message}`,
      correlationId,
      path: request.url,
      method: request.method,
    })

    response.status(status).json({
      statusCode: status,
      error,
      message,
      ...(correlationId && { correlationId }),
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
