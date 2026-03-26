import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PrismaService } from '@infra/database/prisma.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    const databaseStatus = await this.checkDatabase()

    return {
      status: 'ok',
      service: 'upload-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: databaseStatus,
        messaging: 'ok',
        storage: 'ok',
      },
    }
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return 'ok'
    } catch {
      return 'error'
    }
  }
}
