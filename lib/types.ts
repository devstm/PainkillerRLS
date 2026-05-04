export interface TableClassification {
  table: string
  ownershipColumn: string | null
  pattern: string
  sensitivity: 'public' | 'private' | 'admin-only'
}

export type PipelineStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface PipelineProgressEvent {
  step: number;
  status: PipelineStepStatus;
  label: string;
  migration?: string;
  error?: string;
}
