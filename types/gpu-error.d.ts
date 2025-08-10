/**
 * GPU Error Handling Type Definitions
 * @since 2025.1
 */

import { IpcMainEvent } from 'electron';
import { IFiles } from './types';

export interface ProcessingError extends Error {
  code?: string;
  errno?: number;
  path?: string;
  syscall?: string;
  addonType?: string;
  recoveryAttempts?: number;
}

export interface ErrorRecoveryContext {
  originalError: ProcessingError;
  event: IpcMainEvent;
  file: IFiles;
  formData: any;
  retryCount: number;
  maxRetries: number;
  recoveryStrategies: RecoveryStrategy[];
}

export interface RecoveryStrategy {
  name: string;
  canHandle: (error: ProcessingError) => boolean;
  execute: (context: ErrorRecoveryContext) => Promise<string>;
  priority: number;
}
