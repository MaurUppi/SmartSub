// Re-export consolidated types from central location
export type { Subtitle, TranslationResult } from '../../../types';

export interface TranslationConfig {
  sourceLanguage: string;
  targetLanguage: string;
  provider: Provider;
  translator: TranslatorFunction;
}

export type TranslatorFunction = (
  text: string[],
  config: any,
  from: string,
  to: string,
) => Promise<string>;

export interface Provider {
  type: string;
  id: string;
  name: string;
  isAi: boolean;
  prompt?: string;
  systemPrompt?: string;
  useBatchTranslation?: boolean;
  batchSize?: number;
  [key: string]: any;
}
