/**
 * Base class for domain-specific exceptions
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainException'
  }
}

export class InvalidAnalysisStatusTransitionException extends DomainException {
  constructor(from: string, to: string, allowed: string[]) {
    super(
      `Invalid status transition from ${from} to ${to}. Allowed: ${allowed.join(', ')}`,
      'INVALID_STATUS_TRANSITION',
    )
    this.name = 'InvalidAnalysisStatusTransitionException'
  }
}

export class AnalysisNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Analysis with ID ${id} not found`, 'ANALYSIS_NOT_FOUND')
    this.name = 'AnalysisNotFoundException'
  }
}

export class InvalidFileTypeException extends DomainException {
  constructor(fileType: string, allowed: string[]) {
    super(
      `File type '${fileType}' not allowed. Allowed: ${allowed.join(', ')}`,
      'INVALID_FILE_TYPE',
    )
    this.name = 'InvalidFileTypeException'
  }
}

export class FileTooLargeException extends DomainException {
  constructor(size: number, maxSize: number) {
    super(`File size ${size} bytes exceeds maximum of ${maxSize} bytes`, 'FILE_TOO_LARGE')
    this.name = 'FileTooLargeException'
  }
}
