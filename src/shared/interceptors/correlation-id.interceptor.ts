import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'

export const CORRELATION_ID_HEADER = 'x-correlation-id'

/**
 * Interceptor that ensures every request has a correlation ID.
 * If X-Correlation-ID header is not present, generates a new UUID v4.
 * The correlation ID is attached to the request for downstream use.
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()

    const correlationId =
      request.headers[CORRELATION_ID_HEADER] || uuidv4()

    request.correlationId = correlationId
    response.setHeader(CORRELATION_ID_HEADER, correlationId)

    return next.handle()
  }
}
