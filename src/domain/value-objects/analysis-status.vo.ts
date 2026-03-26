/**
 * Analysis status value object defining valid statuses and transitions.
 */
export enum AnalysisStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  ANALYZED = 'ANALYZED',
  ERROR = 'ERROR',
}

/**
 * Defines the allowed status transitions for the Analysis state machine.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<AnalysisStatus, AnalysisStatus[]> = {
  [AnalysisStatus.RECEIVED]: [AnalysisStatus.PROCESSING],
  [AnalysisStatus.PROCESSING]: [AnalysisStatus.ANALYZED, AnalysisStatus.ERROR],
  [AnalysisStatus.ANALYZED]: [],
  [AnalysisStatus.ERROR]: [],
}

export function isValidTransition(from: AnalysisStatus, to: AnalysisStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to)
}
