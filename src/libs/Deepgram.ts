import type { TraceMetadata } from './LangfuseTracing';
import { createClient } from '@deepgram/sdk';
import { flushLangfuse } from './Langfuse';
import {
  createTrace,
  createTranscriptionGeneration,
  endTranscriptionGeneration,

} from './LangfuseTracing';

function getDeepgramClient() {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramApiKey) {
    throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
  }
  return createClient(deepgramApiKey);
}

export type TranscriptionOptions = {
  language?: string;
  diarize?: boolean;
  punctuate?: boolean;
  utterances?: boolean;
  model?: string;
  traceMetadata?: TraceMetadata;
};

export type DeepgramUtterance = {
  channel: number;
  speaker: number;
  start: number;
  end: number;
  transcript: string;
  confidence: number;
};

export type DeepgramWord = {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
};

export type TranscriptionResult = {
  text: string;
  utterances: DeepgramUtterance[];
  words: DeepgramWord[];
  duration: number;
  channels: number;
};

/**
 * Transcribe audio file from URL using Deepgram
 */
export async function transcribeAudio(
  audioUrl: string,
  options: TranscriptionOptions = {},
): Promise<TranscriptionResult> {
  const {
    language = 'en',
    diarize = true,
    punctuate = true,
    utterances = true,
    model = 'nova-2',
    traceMetadata,
  } = options;

  // Create Langfuse trace and generation
  const trace = createTrace('deepgram-transcription', {
    ...traceMetadata,
    tags: ['deepgram', 'transcription', model, ...(traceMetadata?.tags || [])],
  });

  // Update trace with input for better visibility in dashboard
  if (trace) {
    trace.update({
      input: { audioUrl, model, language, diarize },
    });
  }

  const generation = createTranscriptionGeneration(trace, 'transcribe-audio', {
    model,
    input: {
      audioUrl,
      language,
      diarize,
    },
    metadata: {
      provider: 'deepgram',
    },
  });

  try {
    const { result, error } = await getDeepgramClient().listen.prerecorded.transcribeUrl(
      {
        url: audioUrl,
      },
      {
        language,
        model,
        diarize,
        punctuate,
        utterances,
        smart_format: true,
      },
    );

    if (error) {
      const errorMessage = `Deepgram error: ${error.message}`;

      endTranscriptionGeneration(generation, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const channel = result.results.channels[0];
    const alternative = channel?.alternatives[0];

    if (!alternative) {
      const errorMessage = 'No transcription results found';

      endTranscriptionGeneration(generation, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const durationSeconds = result.metadata?.duration || 0;
    const durationMinutes = durationSeconds / 60;

    // End generation with success (cost is calculated in endTranscriptionGeneration)
    endTranscriptionGeneration(generation, model, {
      output: {
        textLength: alternative.transcript.length,
        utteranceCount: result.results.utterances?.length || 0,
        wordCount: alternative.words?.length || 0,
      },
      durationMinutes,
    });

    // Update trace with output
    if (trace) {
      trace.update({
        output: {
          textLength: alternative.transcript.length,
          utteranceCount: result.results.utterances?.length || 0,
          wordCount: alternative.words?.length || 0,
          durationSeconds,
        },
      });
    }

    // Flush asynchronously (don't block response)
    flushLangfuse().catch(console.error);

    return {
      text: alternative.transcript,
      utterances: (result.results.utterances || []).map((u: any) => ({
        channel: u.channel,
        speaker: u.speaker,
        start: u.start,
        end: u.end,
        transcript: u.transcript,
        confidence: u.confidence,
      })),
      words: (alternative.words || []).map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
        speaker: w.speaker,
      })),
      duration: durationSeconds,
      channels: result.results.channels.length,
    };
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    if (generation) {
      endTranscriptionGeneration(generation, model, {
        output: null,
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
        level: 'ERROR',
      });
      flushLangfuse().catch(console.error);
    }
    throw error;
  }
}

/**
 * Transcribe audio file from buffer
 */
export async function transcribeAudioBuffer(
  audioBuffer: Buffer,
  options: TranscriptionOptions = {},
): Promise<TranscriptionResult> {
  const {
    language = 'en',
    diarize = true,
    punctuate = true,
    utterances = true,
    model = 'nova-2',
    traceMetadata,
  } = options;

  // Create Langfuse trace and generation
  const trace = createTrace('deepgram-transcription', {
    ...traceMetadata,
    tags: ['deepgram', 'transcription', model, 'buffer', ...(traceMetadata?.tags || [])],
  });

  // Update trace with input for better visibility in dashboard
  if (trace) {
    trace.update({
      input: { bufferSize: audioBuffer.length, model, language, diarize },
    });
  }

  const generation = createTranscriptionGeneration(trace, 'transcribe-audio-buffer', {
    model,
    input: {
      bufferSize: audioBuffer.length,
      language,
      diarize,
    },
    metadata: {
      provider: 'deepgram',
    },
  });

  try {
    const { result, error } = await getDeepgramClient().listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        language,
        model,
        diarize,
        punctuate,
        utterances,
        smart_format: true,
      },
    );

    if (error) {
      const errorMessage = `Deepgram error: ${error.message}`;

      endTranscriptionGeneration(generation, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const channel = result.results.channels[0];
    const alternative = channel?.alternatives[0];

    if (!alternative) {
      const errorMessage = 'No transcription results found';

      endTranscriptionGeneration(generation, model, {
        output: null,
        statusMessage: errorMessage,
        level: 'ERROR',
      });
      await flushLangfuse();

      throw new Error(errorMessage);
    }

    const durationSeconds = result.metadata?.duration || 0;
    const durationMinutes = durationSeconds / 60;

    // End generation with success (cost is calculated in endTranscriptionGeneration)
    endTranscriptionGeneration(generation, model, {
      output: {
        textLength: alternative.transcript.length,
        utteranceCount: result.results.utterances?.length || 0,
        wordCount: alternative.words?.length || 0,
      },
      durationMinutes,
    });

    // Update trace with output
    if (trace) {
      trace.update({
        output: {
          textLength: alternative.transcript.length,
          utteranceCount: result.results.utterances?.length || 0,
          wordCount: alternative.words?.length || 0,
          durationSeconds,
        },
      });
    }

    // Flush asynchronously (don't block response)
    flushLangfuse().catch(console.error);

    return {
      text: alternative.transcript,
      utterances: (result.results.utterances || []).map((u: any) => ({
        channel: u.channel,
        speaker: u.speaker,
        start: u.start,
        end: u.end,
        transcript: u.transcript,
        confidence: u.confidence,
      })),
      words: (alternative.words || []).map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
        speaker: w.speaker,
      })),
      duration: durationSeconds,
      channels: result.results.channels.length,
    };
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    if (generation) {
      endTranscriptionGeneration(generation, model, {
        output: null,
        statusMessage: error instanceof Error ? error.message : 'Unknown error',
        level: 'ERROR',
      });
      flushLangfuse().catch(console.error);
    }
    throw error;
  }
}
