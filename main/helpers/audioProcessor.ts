import ffmpegStatic from 'ffmpeg-ffprobe-static';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logMessage } from './logger';
import { getMd5, ensureTempDir } from './fileUtils';

// 设置ffmpeg路径 (使用ffmpeg-ffprobe-static消除冗余)
const ffmpegPath = ffmpegStatic.ffmpegPath.replace(
  'app.asar',
  'app.asar.unpacked',
);

/**
 * 使用ffmpeg提取音频
 */
export const extractAudio = (
  videoPath: string,
  audioPath: string,
  event: any = null,
  file: any = null,
) => {
  const onProgress = (percent = 0) => {
    logMessage(`extract audio progress ${Math.round(percent)}%`, 'info');
    if (event && file) {
      event.sender.send('taskProgressChange', file, 'extractAudio', percent);
    }
  };

  return new Promise((resolve, reject) => {
    try {
      // Build ffmpeg command arguments
      const args = [
        '-i',
        videoPath,
        '-vn', // No video
        '-ar',
        '16000', // Audio sample rate
        '-ac',
        '1', // Audio channels (mono)
        '-acodec',
        'pcm_s16le', // Audio codec
        '-y', // Overwrite output file
        audioPath,
      ];

      logMessage(
        `extract audio start: ${ffmpegPath} ${args.join(' ')}`,
        'info',
      );
      onProgress(0);

      const ffmpegProcess = spawn(ffmpegPath, args);
      let duration = 0;
      let lastProgress = 0;

      // Parse stderr for progress information
      ffmpegProcess.stderr.on('data', (data) => {
        const dataStr = data.toString();

        // Extract duration if not yet found
        if (duration === 0) {
          const durationMatch = dataStr.match(
            /Duration: (\d{2}):(\d{2}):(\d{2})\.\d+/,
          );
          if (durationMatch) {
            const hours = parseInt(durationMatch[1], 10);
            const minutes = parseInt(durationMatch[2], 10);
            const seconds = parseInt(durationMatch[3], 10);
            duration = hours * 3600 + minutes * 60 + seconds;
          }
        }

        // Extract current time for progress
        const timeMatch = dataStr.match(/time=(\d{2}):(\d{2}):(\d{2})\.\d+/);
        if (timeMatch && duration > 0) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = parseInt(timeMatch[3], 10);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const percent = Math.min(100, (currentTime / duration) * 100);

          // Only update progress if it changed significantly (avoid too many updates)
          if (percent - lastProgress >= 1) {
            lastProgress = percent;
            onProgress(percent);
          }
        }
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          logMessage('extract audio done!', 'info');
          onProgress(100);
          resolve(true);
        } else {
          const error = `ffmpeg process exited with code ${code}`;
          logMessage(`extract audio error: ${error}`, 'error');
          reject(new Error(error));
        }
      });

      ffmpegProcess.on('error', (err) => {
        logMessage(`extract audio error: ${err.message}`, 'error');
        reject(err);
      });
    } catch (err) {
      logMessage(`ffmpeg extract audio error: ${err}`, 'error');
      reject(new Error(`${err}: ffmpeg extract audio error!`));
    }
  });
};

/**
 * 从视频中提取音频
 */
export async function extractAudioFromVideo(event: any, file: any) {
  const { filePath } = file;
  event.sender.send('taskFileChange', { ...file, extractAudio: 'loading' });
  const tempDir = ensureTempDir();

  logMessage(`tempDir: ${tempDir}`, 'info');
  const md5FileName = getMd5(filePath);
  const tempAudioFile = path.join(tempDir, `${md5FileName}.wav`);
  file.tempAudioFile = tempAudioFile;

  if (fs.existsSync(tempAudioFile)) {
    logMessage(`Using existing audio file: ${tempAudioFile}`, 'info');
    event.sender.send('taskFileChange', { ...file, extractAudio: 'done' });
    return tempAudioFile;
  }

  await extractAudio(filePath, tempAudioFile, event, file);
  event.sender.send('taskFileChange', { ...file, extractAudio: 'done' });
  return tempAudioFile;
}
