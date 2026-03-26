/**
 * Port interface for object storage operations.
 * Concrete implementations: MinIO (local), S3 (cloud).
 */
export interface IStorageService {
  /**
   * Upload a file buffer and return the S3 URI (s3://bucket/key).
   */
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>

  /**
   * Generate a presigned HTTPS URL for client-side access.
   */
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>

  /**
   * Delete a file from storage.
   */
  deleteFile(key: string): Promise<void>
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE')
