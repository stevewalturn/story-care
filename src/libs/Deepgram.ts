import { createClient } from '@deepgram/sdk';

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

if (!deepgramApiKey) {
  throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
}

const deepgram = createClient(deepgramApiKey);

export interface TranscriptionOptions {
  language?: string;
  diarize?: boolean;
  punctuate?: boolean;
  utterances?: boolean;
  model?: string;
}

export interface DeepgramUtterance {
  channel: number;
  speaker: number;
  start: number;
  end: number;
  transcript: string;
  confidence: number;
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export interface TranscriptionResult {
  text: string;
  utterances: DeepgramUtterance[];
  words: DeepgramWord[];
  duration: number;
  channels: number;
}

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
  } = options;

  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
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
      throw new Error(`Deepgram error: ${error.message}`);
    }

    const channel = result.results.channels[0];
    const alternative = channel?.alternatives[0];

    if (!alternative) {
      throw new Error('No transcription results found');
    }

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
      duration: result.metadata?.duration || 0,
      channels: result.results.channels.length,
    };
  } catch (error) {
    console.error('Deepgram transcription error:', error);
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
  } = options;

  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
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
      throw new Error(`Deepgram error: ${error.message}`);
    }

    const channel = result.results.channels[0];
    const alternative = channel?.alternatives[0];

    if (!alternative) {
      throw new Error('No transcription results found');
    }

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
      duration: result.metadata?.duration || 0,
      channels: result.results.channels.length,
    };
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    throw error;
  }
}

export { deepgram };
