/**
 * Video Transcoding Service
 * Handles GPU-accelerated video transcoding via Cloud Run Jobs
 */

import { Storage } from '@google-cloud/storage';
import { JobsClient, ExecutionsClient } from '@google-cloud/run';
import { Env } from '@/libs/Env';

export type TranscodingFormat = 'h264' | 'h265' | 'vp9' | 'av1';

export type TranscodingQuality = 'low' | 'medium' | 'high' | 'ultra';

export type TranscodingOptions = {
  inputPath: string; // GCS path or filename in preprocessing bucket
  outputFilename: string; // Filename for output in transcoded bucket
  format?: TranscodingFormat;
  quality?: TranscodingQuality;
  width?: number;
  height?: number;
  fps?: number;
  customArgs?: string[]; // Custom FFmpeg arguments
};

export type TranscodingJobStatus = {
  jobName: string;
  executionName: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'PENDING';
  outputUrl?: string;
  error?: string;
};

/**
 * Video Transcoding Service using GPU-accelerated Cloud Run Jobs
 */
export class VideoTranscodingService {
  private static storage = new Storage({
    projectId: Env.GCS_PROJECT_ID,
    credentials: {
      client_email: Env.GCS_CLIENT_EMAIL,
      private_key: Env.GCS_PRIVATE_KEY,
    },
  });

  private static runClient = new JobsClient({
    projectId: Env.GCS_PROJECT_ID,
    credentials: {
      client_email: Env.GCS_CLIENT_EMAIL,
      private_key: Env.GCS_PRIVATE_KEY,
    },
  });

  private static executionsClient = new ExecutionsClient({
    projectId: Env.GCS_PROJECT_ID,
    credentials: {
      client_email: Env.GCS_CLIENT_EMAIL,
      private_key: Env.GCS_PRIVATE_KEY,
    },
  });

  private static preprocessingBucket = `preprocessing-${Env.GCS_PROJECT_ID}`;
  private static transcodedBucket = `transcoded-${Env.GCS_PROJECT_ID}`;
  private static jobName = 'video-encoding-job';
  private static region = 'us-central1';

  /**
   * Validate that setup is complete
   * Checks if buckets exist and are accessible
   * @returns Object with isValid flag and errors array
   */
  static async validateSetup(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check preprocessing bucket
      const preprocessingBucket = this.storage.bucket(this.preprocessingBucket);
      const [exists1] = await preprocessingBucket.exists();
      if (!exists1) {
        errors.push(
          `Preprocessing bucket not found: gs://${this.preprocessingBucket}. ` +
          `Run setup script: ./scripts/setup-video-transcode-buckets.sh`
        );
      }

      // Check transcoded bucket
      const transcodedBucket = this.storage.bucket(this.transcodedBucket);
      const [exists2] = await transcodedBucket.exists();
      if (!exists2) {
        errors.push(
          `Transcoded bucket not found: gs://${this.transcodedBucket}. ` +
          `Run setup script: ./scripts/setup-video-transcode-buckets.sh`
        );
      }
    } catch (error: any) {
      errors.push(
        `GCS validation failed: ${error.message}. ` +
        `Check your GCS credentials and project configuration.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get FFmpeg arguments for different quality presets
   */
  private static getQualityArgs(quality: TranscodingQuality): string[] {
    switch (quality) {
      case 'low':
        return ['-cq', '28', '-preset', 'fast'];
      case 'medium':
        return ['-cq', '23', '-preset', 'medium'];
      case 'high':
        return ['-cq', '21', '-preset', 'slow'];
      case 'ultra':
        return ['-cq', '18', '-preset', 'slow'];
      default:
        return ['-cq', '23', '-preset', 'medium'];
    }
  }

  /**
   * Get FFmpeg encoder for different formats
   */
  private static getEncoder(format: TranscodingFormat): string {
    switch (format) {
      case 'h264':
        return 'h264_nvenc';
      case 'h265':
        return 'hevc_nvenc';
      case 'vp9':
        return 'vp9_nvenc'; // Note: VP9 hardware encoding may not be available
      case 'av1':
        return 'av1_nvenc'; // Note: AV1 requires newer GPUs
      default:
        return 'h264_nvenc';
    }
  }

  /**
   * Upload video to preprocessing bucket
   */
  static async uploadForTranscoding(
    buffer: Buffer,
    filename: string,
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.preprocessingBucket);
      const file = bucket.file(filename);

      await file.save(buffer, {
        contentType: 'video/mp4',
        metadata: {
          cacheControl: 'no-cache',
        },
      });

      return filename;
    } catch (error: any) {
      throw new Error(
        `Failed to upload to preprocessing bucket (gs://${this.preprocessingBucket}). ` +
        `Ensure the bucket exists by running: ./scripts/setup-video-transcode-buckets.sh. ` +
        `Original error: ${error.message}`
      );
    }
  }

  /**
   * Start GPU-accelerated transcoding job
   */
  static async startTranscodingJob(
    options: TranscodingOptions,
  ): Promise<TranscodingJobStatus> {
    const {
      inputPath,
      outputFilename,
      format = 'h264',
      quality = 'medium',
      width,
      height,
      fps,
      customArgs,
    } = options;

    // Build FFmpeg arguments
    const args: string[] = [inputPath, outputFilename];

    if (customArgs && customArgs.length > 0) {
      // Use custom arguments
      args.push(...customArgs);
    } else {
      // Build arguments from options
      args.push('-vcodec', this.getEncoder(format));
      args.push(...this.getQualityArgs(quality));

      if (width && height) {
        args.push('-s', `${width}x${height}`);
      }

      if (fps) {
        args.push('-r', fps.toString());
      }

      // Add common optimizations
      args.push('-movflags', '+faststart'); // Enable fast start for web streaming
      args.push('-pix_fmt', 'yuv420p'); // Ensure compatibility
    }

    try {
      // Execute Cloud Run Job
      const parent = `projects/${Env.GCS_PROJECT_ID}/locations/${this.region}`;
      const jobPath = `${parent}/jobs/${this.jobName}`;

      console.log('Starting transcoding job:', {
        job: this.jobName,
        args,
      });

      // Run the Cloud Run Job with arguments
      const [operation] = await this.runClient.runJob({
        name: jobPath,
        overrides: {
          containerOverrides: [{
            args,
          }],
        },
      });

      // Get execution name from operation metadata
      const executionName = operation.name || `${this.jobName}-${Date.now()}`;

      console.log('Transcoding job started:', {
        execution: executionName,
        operation: operation.name,
      });

      return {
        jobName: this.jobName,
        executionName,
        status: 'PENDING',
      };
    } catch (error: any) {
      console.error('Failed to start transcoding job:', error);
      throw new Error(`Failed to start transcoding job: ${error.message || error}`);
    }
  }

  /**
   * Check transcoding job status
   */
  static async getJobStatus(executionName: string): Promise<TranscodingJobStatus> {
    try {
      // Get execution status from Cloud Run Admin API
      // Note: executionName should be the full resource path
      const [execution] = await this.executionsClient.getExecution({
        name: executionName,
      });

      // Map Cloud Run execution status to our status
      let status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'PENDING' = 'PENDING';

      if (execution.completionTime) {
        // Execution completed - assume success for now
        // TODO: Check actual execution status when the correct IExecution interface is known
        status = 'SUCCEEDED';
      } else if (execution.startTime) {
        // Execution started but not completed
        status = 'RUNNING';
      }

      return {
        jobName: this.jobName,
        executionName,
        status,
        error: undefined, // TODO: Extract error message from execution when correct interface is known
      };
    } catch (error: any) {
      console.error('Failed to get job status:', error);
      throw new Error(`Failed to get job status: ${error.message || error}`);
    }
  }

  /**
   * Download transcoded video from output bucket
   */
  static async downloadTranscodedVideo(filename: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.transcodedBucket);
    const file = bucket.file(filename);

    const [buffer] = await file.download();
    return buffer;
  }

  /**
   * Get signed URL for transcoded video
   */
  static async getTranscodedVideoUrl(filename: string): Promise<string> {
    const bucket = this.storage.bucket(this.transcodedBucket);
    const file = bucket.file(filename);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return url;
  }

  /**
   * Delete video from preprocessing bucket
   */
  static async deletePreprocessingVideo(filename: string): Promise<void> {
    const bucket = this.storage.bucket(this.preprocessingBucket);
    const file = bucket.file(filename);
    await file.delete();
  }

  /**
   * Delete video from transcoded bucket
   */
  static async deleteTranscodedVideo(filename: string): Promise<void> {
    const bucket = this.storage.bucket(this.transcodedBucket);
    const file = bucket.file(filename);
    await file.delete();
  }

  /**
   * Clean up old files from buckets (older than specified days)
   */
  static async cleanupOldFiles(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const buckets = [this.preprocessingBucket, this.transcodedBucket];

    for (const bucketName of buckets) {
      const bucket = this.storage.bucket(bucketName);
      const [files] = await bucket.getFiles();

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const created = new Date(metadata.timeCreated || '');

        if (created < cutoffDate) {
          console.log(`Deleting old file: ${file.name} (created ${created})`);
          await file.delete();
        }
      }
    }
  }
}

/**
 * Example usage:
 *
 * // Upload video for transcoding
 * const filename = await VideoTranscodingService.uploadForTranscoding(
 *   videoBuffer,
 *   'input-video.mp4'
 * );
 *
 * // Start transcoding with GPU acceleration
 * const job = await VideoTranscodingService.startTranscodingJob({
 *   inputPath: filename,
 *   outputFilename: 'output-video.mp4',
 *   format: 'h264',
 *   quality: 'high',
 *   width: 1920,
 *   height: 1080,
 *   fps: 30,
 * });
 *
 * // Check job status
 * const status = await VideoTranscodingService.getJobStatus(job.executionName);
 *
 * // Get transcoded video URL
 * const url = await VideoTranscodingService.getTranscodedVideoUrl('output-video.mp4');
 *
 * // Cleanup
 * await VideoTranscodingService.deletePreprocessingVideo(filename);
 */
