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
  audioTracks?: Array<{
    audioUrl: string;
    volume: number;
    startTimeSeconds?: number;
  }>;
  loopAudio?: boolean;
  fitAudioToDuration?: boolean;
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
    // Validate inputs
    if (!videoPaths || videoPaths.length === 0) {
      throw new Error('No video paths provided for concatenation');
    }

    // Check that all files exist and are valid
    const validPaths: string[] = [];
    for (const videoPath of videoPaths) {
      if (!fs.existsSync(videoPath)) {
        console.error(`[CONCAT] File does not exist: ${videoPath}`);
        continue;
      }

      const stats = fs.statSync(videoPath);
      if (stats.size === 0) {
        console.error(`[CONCAT] File is empty: ${videoPath}`);
        continue;
      }

      validPaths.push(videoPath);
      console.log(`[CONCAT] Valid file: ${videoPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }

    if (validPaths.length === 0) {
      throw new Error('No valid video files found for concatenation');
    }

    // Create concat file
    const concatFilePath = path.join(this.tempDir, 'concat-list.txt');
    const concatContent = validPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatFilePath, concatContent);

    console.log(`[CONCAT] Created concat file with ${validPaths.length} videos`);
    console.log(`[CONCAT] Concat content:\n${concatContent}`);

    // Use re-encode instead of stream copy to ensure compatibility
    const command = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c:v libx264 -c:a aac -pix_fmt yuv420p "${outputPath}" -y`;

    console.log(`[CONCAT] Running command: ${command}`);
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
   * Merge multiple audio tracks with volume control
   */
  private static async mergeAudioTracks(
    audioPaths: string[],
    volumes: number[],
    outputPath: string,
  ): Promise<void> {
    if (audioPaths.length === 0) {
      throw new Error('No audio tracks to merge');
    }

    if (audioPaths.length === 1) {
      // Single track - just copy with volume adjustment
      const volumeDb = 20 * Math.log10(volumes[0]! / 100);
      const command = `ffmpeg -i "${audioPaths[0]}" -af "volume=${volumeDb}dB" -c:a aac "${outputPath}" -y`;
      await execAsync(command);
      return;
    }

    // Multiple tracks - use amix filter
    const inputs = audioPaths.map(p => `-i "${p}"`).join(' ');
    const weights = volumes.map(v => v / 100).join(' ');
    const command = `ffmpeg ${inputs} -filter_complex "amix=inputs=${audioPaths.length}:duration=longest:weights=${weights}" -c:a aac "${outputPath}" -y`;

    await execAsync(command);
  }

  /**
   * Loop audio to fit video duration with crossfade
   */
  private static async loopAudioToFit(
    audioPath: string,
    targetDuration: number,
    outputPath: string,
  ): Promise<void> {
    // Get audio duration
    const metadata = await this.getVideoMetadata(audioPath);
    const audioDuration = parseFloat(metadata.format.duration);

    if (audioDuration >= targetDuration) {
      // Audio is already long enough, just trim it
      const command = `ffmpeg -i "${audioPath}" -t ${targetDuration} -c:a aac "${outputPath}" -y`;
      await execAsync(command);
      return;
    }

    // Calculate how many loops we need
    const loopCount = Math.ceil(targetDuration / audioDuration);

    // Create a concat file for looping
    const concatFilePath = path.join(this.tempDir, 'audio-loop-concat.txt');
    const concatContent = Array(loopCount)
      .fill(`file '${audioPath}'`)
      .join('\n');
    fs.writeFileSync(concatFilePath, concatContent);

    // Concatenate with crossfade between loops
    const fadeTime = Math.min(2, audioDuration * 0.1); // 2s or 10% of audio duration
    const command = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -af "afade=t=out:st=${targetDuration - fadeTime}:d=${fadeTime}" -t ${targetDuration} -c:a aac "${outputPath}" -y`;

    await execAsync(command);
  }

  /**
   * Fit audio to video duration by trimming/cutting to exact length
   */
  private static async fitAudioToDuration(
    audioPath: string,
    targetDuration: number,
    outputPath: string,
  ): Promise<void> {
    // Simple trim command - cut audio at target duration
    // -t: trim to exact duration
    // -c:a aac: re-encode to AAC codec
    const command = `ffmpeg -i "${audioPath}" -t ${targetDuration} -c:a aac "${outputPath}" -y`;

    await execAsync(command);
  }

  /**
   * Process audio tracks for scene assembly
   * Downloads, merges, and applies loop/fit settings
   */
  private static async processAudioTracks(
    audioTracks: Array<{
      audioUrl: string;
      volume: number;
      startTimeSeconds?: number;
    }>,
    videoDuration: number,
    loopAudio: boolean,
    fitAudio: boolean,
  ): Promise<string | null> {
    if (audioTracks.length === 0) {
      return null;
    }

    this.ensureTempDir();

    // Download all audio tracks
    const downloadedPaths: string[] = [];
    const volumes: number[] = [];

    for (let i = 0; i < audioTracks.length; i++) {
      const track = audioTracks[i]!;
      const audioFilename = `audio-track-${i}.m4a`;
      const audioPath = await this.downloadMedia(track.audioUrl, audioFilename);
      downloadedPaths.push(audioPath);
      volumes.push(track.volume);
    }

    // Merge audio tracks if multiple
    const mergedPath = path.join(this.tempDir, 'audio-merged.m4a');
    await this.mergeAudioTracks(downloadedPaths, volumes, mergedPath);

    // Apply loop or fit if requested
    const finalAudioPath = path.join(this.tempDir, 'audio-final.m4a');

    if (loopAudio) {
      await this.loopAudioToFit(mergedPath, videoDuration, finalAudioPath);
    } else if (fitAudio) {
      await this.fitAudioToDuration(mergedPath, videoDuration, finalAudioPath);
    } else {
      // Just use merged audio as-is
      fs.copyFileSync(mergedPath, finalAudioPath);
    }

    return finalAudioPath;
  }

  /**
   * Main assembly function - assemble scene from clips with multi-audio support
   * Supports up to 60 seconds of video
   */
  static async assembleScene(options: AssembleOptions): Promise<string> {
    const {
      clips,
      outputPath,
      width = 1920,
      height = 1080,
      fps = 30,
      audioTrack,
      audioTracks = [],
      loopAudio = false,
      fitAudioToDuration = false,
    } = options;

    // Check FFmpeg availability
    const hasFFmpeg = await this.checkFFmpeg();
    if (!hasFFmpeg) {
      throw new Error('FFmpeg is not installed or not available in PATH');
    }

    this.ensureTempDir();

    try {
      // Validate clips array
      if (!clips || clips.length === 0) {
        throw new Error('No clips provided for assembly');
      }

      console.log(`[ASSEMBLE] Starting assembly of ${clips.length} clips`);

      const processedClips: string[] = [];

      // Process each clip
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        if (!clip) {
          console.warn(`[ASSEMBLE] Clip ${i} is undefined, skipping`);
          continue;
        }

        const clipId = `clip-${i}`;
        console.log(`[ASSEMBLE] Processing clip ${i}: type=${clip.type}, duration=${clip.duration}s`);

        try {
          // Download media
          const ext = clip.type === 'image' ? 'jpg' : 'mp4';
          const downloadedPath = await this.downloadMedia(
            clip.mediaUrl,
            `${clipId}-source.${ext}`,
          );

          console.log(`[ASSEMBLE] Downloaded clip ${i} to ${downloadedPath}`);

          const processedPath = path.join(this.tempDir, `${clipId}-processed.mp4`);

          if (clip.type === 'image') {
            // Convert image to video
            console.log(`[ASSEMBLE] Converting image to video: ${downloadedPath}`);
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
            console.log(`[ASSEMBLE] Trimming video: ${downloadedPath} (start: ${clip.startTime}s, duration: ${clip.duration}s)`);
            await this.trimVideo(
              downloadedPath,
              clip.startTime,
              clip.duration,
              processedPath,
            );
          }

          // Verify the processed file exists and has content
          if (fs.existsSync(processedPath)) {
            const stats = fs.statSync(processedPath);
            console.log(`[ASSEMBLE] Clip ${i} processed successfully: ${processedPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            processedClips.push(processedPath);
          } else {
            console.error(`[ASSEMBLE] Processed file does not exist: ${processedPath}`);
          }
        } catch (clipError) {
          console.error(`[ASSEMBLE] Error processing clip ${i}:`, clipError);
          // Continue with other clips instead of failing completely
        }
      }

      // Check if we have any processed clips
      if (processedClips.length === 0) {
        throw new Error('No clips were successfully processed. Check the logs for details.');
      }

      console.log(`[ASSEMBLE] Successfully processed ${processedClips.length} out of ${clips.length} clips`);

      // Concatenate all clips
      const tempOutputPath = path.join(this.tempDir, 'assembled-temp.mp4');
      await this.concatenateVideos(processedClips, tempOutputPath);

      // Get video duration for validation and audio processing
      const metadata = await this.getVideoMetadata(tempOutputPath);
      const videoDuration = parseFloat(metadata.format.duration);

      // Validate 60-second limit
      if (videoDuration > 60) {
        throw new Error(
          `Video duration (${videoDuration.toFixed(1)}s) exceeds 60-second limit`,
        );
      }

      console.log('[ASSEMBLE] Video assembled, duration:', videoDuration);

      // Handle audio tracks (new multi-audio approach or legacy single track)
      let finalOutputPath = outputPath;

      if (audioTracks.length > 0) {
        // New approach: multiple audio tracks with loop/fit options
        console.log('[ASSEMBLE] Processing multiple audio tracks');
        const processedAudioPath = await this.processAudioTracks(
          audioTracks,
          videoDuration,
          loopAudio,
          fitAudioToDuration,
        );

        if (processedAudioPath) {
          await this.addAudioTrack(tempOutputPath, processedAudioPath, outputPath);
          console.log('[ASSEMBLE] Audio tracks added to video');
        } else {
          fs.copyFileSync(tempOutputPath, outputPath);
        }
      } else if (audioTrack) {
        // Legacy approach: single audio track
        const audioPath = await this.downloadMedia(audioTrack, 'audio-track.m4a');
        await this.addAudioTrack(tempOutputPath, audioPath, outputPath);
      } else {
        // No audio
        fs.copyFileSync(tempOutputPath, outputPath);
      }

      return finalOutputPath;
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
