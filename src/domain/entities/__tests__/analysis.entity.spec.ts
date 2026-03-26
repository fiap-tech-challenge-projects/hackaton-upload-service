import { Analysis } from '../analysis.entity'
import { AnalysisStatus } from '../../value-objects/analysis-status.vo'
import { InvalidAnalysisStatusTransitionException } from '@shared/exceptions'

describe('Analysis Entity', () => {
  const makeAnalysis = (status: AnalysisStatus = AnalysisStatus.RECEIVED) =>
    new Analysis(
      'analysis-id-1',
      'diagram.png',
      's3://bucket/key',
      'image/png',
      1024,
      status,
      'corr-id-1',
      undefined,
      undefined,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
    )

  describe('create', () => {
    it('should create an analysis with RECEIVED status', () => {
      const analysis = Analysis.create(
        'diagram.png',
        's3://bucket/key',
        'image/png',
        1024,
        'corr-id-1',
      )

      expect(analysis.fileName).toBe('diagram.png')
      expect(analysis.fileUrl).toBe('s3://bucket/key')
      expect(analysis.fileType).toBe('image/png')
      expect(analysis.fileSize).toBe(1024)
      expect(analysis.status).toBe(AnalysisStatus.RECEIVED)
      expect(analysis.correlationId).toBe('corr-id-1')
      expect(analysis.reportId).toBeUndefined()
      expect(analysis.errorMessage).toBeUndefined()
    })

    it('should create analysis with empty id (to be assigned by repository)', () => {
      const analysis = Analysis.create('test.png', 's3://b/k', 'image/png', 512, 'corr')
      expect(analysis.id).toBe('')
    })
  })

  describe('startProcessing', () => {
    it('should transition from RECEIVED to PROCESSING', () => {
      const analysis = makeAnalysis(AnalysisStatus.RECEIVED)
      const processing = analysis.startProcessing()

      expect(processing.status).toBe(AnalysisStatus.PROCESSING)
      expect(processing.id).toBe(analysis.id)
    })

    it('should return a new immutable instance on transition', () => {
      const analysis = makeAnalysis(AnalysisStatus.RECEIVED)
      const processing = analysis.startProcessing()

      expect(processing).not.toBe(analysis)
      expect(analysis.status).toBe(AnalysisStatus.RECEIVED)
    })

    it('should throw when transitioning from PROCESSING to PROCESSING', () => {
      const analysis = makeAnalysis(AnalysisStatus.PROCESSING)
      expect(() => analysis.startProcessing()).toThrow(InvalidAnalysisStatusTransitionException)
    })
  })

  describe('markAnalyzed', () => {
    it('should transition from PROCESSING to ANALYZED with reportId', () => {
      const analysis = makeAnalysis(AnalysisStatus.PROCESSING)
      const analyzed = analysis.markAnalyzed('report-123')

      expect(analyzed.status).toBe(AnalysisStatus.ANALYZED)
      expect(analyzed.reportId).toBe('report-123')
    })

    it('should throw when transitioning from RECEIVED to ANALYZED', () => {
      const analysis = makeAnalysis(AnalysisStatus.RECEIVED)
      expect(() => analysis.markAnalyzed('report-123')).toThrow(
        InvalidAnalysisStatusTransitionException,
      )
    })
  })

  describe('markError', () => {
    it('should transition from PROCESSING to ERROR with errorMessage', () => {
      const analysis = makeAnalysis(AnalysisStatus.PROCESSING)
      const errored = analysis.markError('Processing failed')

      expect(errored.status).toBe(AnalysisStatus.ERROR)
      expect(errored.errorMessage).toBe('Processing failed')
    })

    it('should throw when transitioning from ANALYZED to ERROR (terminal state)', () => {
      const analysis = makeAnalysis(AnalysisStatus.ANALYZED)
      expect(() => analysis.markError('oops')).toThrow(InvalidAnalysisStatusTransitionException)
    })
  })

  describe('isTerminal', () => {
    it('should return true for ANALYZED status', () => {
      expect(makeAnalysis(AnalysisStatus.ANALYZED).isTerminal()).toBe(true)
    })

    it('should return true for ERROR status', () => {
      expect(makeAnalysis(AnalysisStatus.ERROR).isTerminal()).toBe(true)
    })

    it('should return false for RECEIVED status', () => {
      expect(makeAnalysis(AnalysisStatus.RECEIVED).isTerminal()).toBe(false)
    })

    it('should return false for PROCESSING status', () => {
      expect(makeAnalysis(AnalysisStatus.PROCESSING).isTerminal()).toBe(false)
    })
  })
})
