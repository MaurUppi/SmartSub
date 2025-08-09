import ffmpegStatic from 'ffmpeg-ffprobe-static';
import { spawn } from 'child_process';
import { logMessage } from './storeManager';

// Use ffmpeg from ffmpeg-ffprobe-static (eliminates redundancy with ffmpeg-static)
const ffmpegPath = ffmpegStatic.ffmpegPath.replace(
  'app.asar',
  'app.asar.unpacked',
);

export const extractAudio = (videoPath: string, audioPath: string) => {
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

          // Only log significant progress changes
          if (percent - lastProgress >= 5) {
            lastProgress = percent;
            logMessage(
              `extract audio progress ${Math.round(percent)}%`,
              'info',
            );
          }
        }
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          logMessage('extract audio done!', 'info');
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
