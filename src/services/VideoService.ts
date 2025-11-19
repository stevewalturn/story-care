import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { deleteFile, listFiles, uploadFile } from '@/libs/GCS';

const execAsync = promisify(exec);

export type VideoClip = {
  mediaUrl: string;
  startTime: number;
  duration: number;
  type: 'image' | 'video';
};

export type AssembleOptions = {
  clips: VideoClip[];
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
  audioTrack?: string;
};

/**
 * Video assembly service using FFmpeg
 * Requires ffmpeg to be installed on the system
 */
export class VideoService {
  private static tempDir = '/tmp/video-assembly';

  /**
   * Check if FFmpeg is installed
   */
  static async checkFFmpeg(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      console.error('FFmpeg not found. Please install FFmpeg.');
      return false;
    }
  }

  /**
   * Ensure temp directory exists
   */
  private static ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Download media file to temp directory
   */
  private static async downloadMedia(url: string, filename: string): Promise<string> {
    const filepath = path.join(this.tempDir, filename);

    // If it's a local file path, just copy it
    if (url.startsWith('/') || url.startsWith('./')) {
      fs.copyFileSync(url, filepath);
      return filepath;
    }

    // Download from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    return filepath;
  }

  /**
   * Convert image to video clip with specified duration
   */
  private static async imageToVideo(
    imagePath: string,
    duration: number,
    outputPath: string,
    width: number = 1920,
    height: number = 1080,
    fps: number = 30,
  ): Promise<void> {
    const command = `ffmpeg -loop 1 -i "${imagePath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2" -r ${fps} "${outputPath}" -y`;

    await execAsync(command);
  }

  /**
   * Trim video clip to specified duration
   */
  private static async trimVideo(
    videoPath: string,
    startTime: number,
    duration: number,
    outputPath: string,
  ): Promise<void> {
    const command = `ffmpeg -i "${videoPath}" -ss ${startTime} -t ${duration} -c:v libx264 -c:a aac "${outputPath}" -y`;

    await execAsync(command);
  }

  /**
   * Concatenate multiple video clips
   */
  private static async concatenateVideos(
    videoPaths: string[],
    outputPath: string,
  ): Promise<void> {
    // Create concat file
    const concatFilePath = path.join(this.tempDir, 'concat-list.txt');
    const concatContent = videoPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatFilePath, concatContent);

    const command = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}" -y`;

    await execAsync(command);
  }

  /**
   * Add audio track to video
   */
  private static async addAudioTrack(
    videoPath: string,
    audioPath: string,
    outputPath: string,
  ): Promise<void> {
    const command = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`;

    await execAsync(command);
  }

  /**
   * Main assembly function - assemble scene from clips
   */
  static async assembleScene(options: AssembleOptions): Promise<string> {
    const { clips, outputPath, width = 1920, height = 1080, fps = 30, audioTrack } = options;

    // Check FFmpeg availability
    const hasFFmpeg = await this.checkFFmpeg();
    if (!hasFFmpeg) {
      throw new Error('FFmpeg is not installed or not available in PATH');
    }

    this.ensureTempDir();

    try {
      const processedClips: string[] = [];

      // Process each clip
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (!clip) {
          continue;
        }

        const clipId = `clip-${i}`;

        // Download media
        const ext = clip.type === 'image' ? 'jpg' : 'mp4';
        const downloadedPath = await this.downloadMedia(
          clip.mediaUrl,
          `${clipId}-source.${ext}`,
        );

        const processedPath = path.join(this.tempDir, `${clipId}-processed.mp4`);

        if (clip.type === 'image') {
          // Convert image to video
          await this.imageToVideo(
            downloadedPath,
            clip.duration,
            processedPath,
            width,
            height,
            fps,
          );
        } else {
          // Trim video if needed
          await this.trimVideo(
            downloadedPath,
            clip.startTime,
            clip.duration,
            processedPath,
          );
        }

        processedClips.push(processedPath);
      }

      // Concatenate all clips
      const tempOutputPath = path.join(this.tempDir, 'assembled-temp.mp4');
      await this.concatenateVideos(processedClips, tempOutputPath);

      // Add audio track if provided
      if (audioTrack) {
        const audioPath = await this.downloadMedia(audioTrack, 'audio-track.mp3');
        await this.addAudioTrack(tempOutputPath, audioPath, outputPath);
      } else {
        // Just move/copy the file
        fs.copyFileSync(tempOutputPath, outputPath);
      }

      return outputPath;
    } catch (error) {
      console.error('Error assembling scene:', error);
      throw error;
    } finally {
      // Cleanup temp files (optional - comment out for debugging)
      // this.cleanupTempFiles();
    }
  }

  /**
   * Clean up temporary files
   */
  static cleanupTempFiles(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * Get video metadata (duration, resolution, etc.)
   */
  static async getVideoMetadata(videoPath: string): Promise<any> {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const { stdout } = await execAsync(command);
    return JSON.parse(stdout);
  }

  /**
   * Generate thumbnail from video at specified timestamp
   */
  static async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timestamp: number = 1,
  ): Promise<string> {
    const command = `ffmpeg -i "${videoPath}" -ss ${timestamp} -vframes 1 -q:v 2 "${outputPath}" -y`;
    await execAsync(command);
    return outputPath;
  }

  /**
   * Upload assembled video and thumbnail to GCS
   */
  static async uploadToGCS(
    videoPath: string,
    sceneId: string,
  ): Promise<{ videoUrl: string; thumbnailUrl: string; videoPath: string; thumbnailPath: string }> {
    const timestamp = Date.now();
    const videoFilename = `scene-${sceneId}-${timestamp}.mp4`;
    const thumbnailFilename = `scene-${sceneId}-${timestamp}-thumb.jpg`;

    // Generate thumbnail
    const thumbnailPath = path.join(this.tempDir, thumbnailFilename);
    await this.generateThumbnail(videoPath, thumbnailPath, 1);

    // Read files as buffers
    const videoBuffer = fs.readFileSync(videoPath);
    const thumbnailBuffer = fs.readFileSync(thumbnailPath);

    // Upload video to GCS
    const videoResult = await uploadFile(videoBuffer, videoFilename, {
      folder: `scenes/${sceneId}`,
      contentType: 'video/mp4',
      makePublic: false,
    });

    // Upload thumbnail to GCS
    const thumbnailResult = await uploadFile(thumbnailBuffer, thumbnailFilename, {
      folder: `scenes/${sceneId}`,
      contentType: 'image/jpeg',
      makePublic: false,
    });

    return {
      videoUrl: videoResult.url,
      thumbnailUrl: thumbnailResult.url,
      videoPath: videoResult.path,
      thumbnailPath: thumbnailResult.path,
    };
  }

  /**
   * Delete scene files from GCS
   */
  static async deleteFromGCS(sceneId: string): Promise<void> {
    try {
      // Delete all files in the scene folder
      const prefix = `scenes/${sceneId}/`;
      const files = await listFiles(prefix);

      // Delete all files with this prefix
      await Promise.all(files.map(file => deleteFile(file)));

      console.log(`Deleted ${files.length} files for scene ${sceneId}`);
    } catch (error) {
      console.error('Error deleting scene files from GCS:', error);
      throw error;
    }
  }
}
