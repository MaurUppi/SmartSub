import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { logMessage, store } from './storeManager';

/**
 * 计算字符串的MD5哈希值
 */
export function getMd5(str: string) {
  return createHash('md5').update(str).digest('hex');
}

/**
 * 获取临时目录路径
 */
export function getTempDir() {
  const settings = store.get('settings');

  // 判断是否使用自定义临时目录
  if (settings.useCustomTempDir && settings.customTempDir) {
    // 确保自定义目录存在
    const customDir = settings.customTempDir as string;
    if (!fs.existsSync(customDir)) {
      try {
        fs.mkdirSync(customDir, { recursive: true });
      } catch (error) {
        logMessage(
          `无法创建自定义临时目录: ${error.message}，将使用默认临时目录`,
          'error',
        );
        return path.join(app.getPath('temp'), 'whisper-subtitles');
      }
    }
    return customDir;
  }

  // 默认临时目录
  return path.join(app.getPath('temp'), 'whisper-subtitles');
}

/**
 * 确保临时目录存在
 */
export function ensureTempDir() {
  const tempDir = getTempDir();
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Convert milliseconds to SRT timestamp format (HH:MM:SS,mmm)
 */
function millisecondsToSrtTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Convert whisper transcription objects to SRT format tuples
 */
function normalizeTranscriptionData(
  transcription: any,
): [string, string, string][] {
  if (!transcription) {
    return [];
  }

  // Handle array format (expected)
  if (Array.isArray(transcription)) {
    return transcription.map((item) => {
      if (Array.isArray(item) && item.length >= 3) {
        // Already in tuple format [startTime, endTime, text]
        return [item[0], item[1], item[2]];
      } else if (item && typeof item === 'object') {
        // Object format {start, end, text} - convert to tuple format
        const startTime =
          typeof item.start === 'number'
            ? millisecondsToSrtTime(item.start)
            : String(item.start || '00:00:00,000');
        const endTime =
          typeof item.end === 'number'
            ? millisecondsToSrtTime(item.end)
            : String(item.end || '00:00:01,000');
        const text = String(item.text || '');
        return [startTime, endTime, text];
      }
      // Fallback for malformed items
      return ['00:00:00,000', '00:00:01,000', String(item || '')];
    });
  }

  // Handle non-array input gracefully
  return [];
}

/**
 * 格式化SRT内容
 */
export function formatSrtContent(
  subtitles: [string, string, string][] | any,
): string {
  // Normalize input data to expected format
  const normalizedSubtitles =
    Array.isArray(subtitles) &&
    subtitles.length > 0 &&
    Array.isArray(subtitles[0])
      ? (subtitles as [string, string, string][]) // Already in correct format
      : normalizeTranscriptionData(subtitles); // Convert from object format

  if (normalizedSubtitles.length === 0) {
    return '';
  }

  return normalizedSubtitles
    .map((subtitle, index) => {
      const [startTime, endTime, text] = subtitle;
      // SRT格式：序号 + 时间码 + 文本 + 空行
      return `${index + 1}\n${startTime.replace('.', ',')} --> ${endTime.replace('.', ',')}\n${text.trim()}\n`;
    })
    .join('\n');
}

/**
 * 创建或清空文件
 */
export async function createOrClearFile(filePath: string): Promise<void> {
  try {
    await fs.promises.writeFile(filePath, '');
  } catch (error) {
    logMessage(`Failed to create/clear file: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 向文件追加内容
 */
export async function appendToFile(
  filePath: string,
  content: string,
): Promise<void> {
  try {
    await fs.promises.appendFile(filePath, content);
  } catch (error) {
    logMessage(`Failed to append to file: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 读取文件内容并按行分割
 */
export async function readFileContent(filePath: string): Promise<string[]> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content.split('\n');
  } catch (error) {
    logMessage(`Failed to read file: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 封装文件对象
 */
export function wrapFileObject(filePath: string) {
  return {
    filePath,
    fileName: path.basename(filePath, path.extname(filePath)),
    fileNameWithoutExtension: path.basename(filePath),
    fileExtension: path.extname(filePath),
    directory: path.dirname(filePath),
    uuid: Math.random().toString(36).substring(2),
  };
}
