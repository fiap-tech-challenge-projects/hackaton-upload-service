import { Injectable, Logger } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { IStorageService } from '@application/ports/storage.port'

/**
 * S3/MinIO implementation of IStorageService.
 * Configurable via environment variables:
 *   S3_ENDPOINT         - custom endpoint (MinIO local or S3 cloud)
 *   S3_REGION           - AWS region
 *   S3_BUCKET           - bucket name
 *   S3_ACCESS_KEY       - access key
 *   S3_SECRET_KEY       - secret key
 *   S3_FORCE_PATH_STYLE - set to 'true' for MinIO
 */
@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name)
  private readonly client: S3Client
  private readonly bucket: string

  constructor() {
    const endpoint = process.env.S3_ENDPOINT
    const region = process.env.S3_REGION || 'us-east-1'
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true'

    this.bucket = process.env.S3_BUCKET || 'hackaton-uploads'

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
    })
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    this.logger.log({ message: 'Uploading file to storage', key, contentType })

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await this.client.send(command)

    const fileUrl = `s3://${this.bucket}/${key}`
    this.logger.log({ message: 'File uploaded successfully', key, fileUrl })

    return fileUrl
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    const url = await getSignedUrl(this.client, command, { expiresIn })
    this.logger.log({ message: 'Generated presigned URL', key, expiresIn })

    return url
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await this.client.send(command)
    this.logger.log({ message: 'File deleted from storage', key })
  }
}
