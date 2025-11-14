import OpenAI from 'openai';
import Groq from 'groq-sdk';
import fs from 'fs';

interface TranscriptionProvider {
  name: string;
  transcribe: (audioPath: string) => Promise<any>;
}

/**
 * Get all configured AI providers in priority order
 */
function getProviders(): TranscriptionProvider[] {
  const providers: TranscriptionProvider[] = [];

  // OpenAI Whisper (Primary)
  const openaiKeys = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY_2,
    process.env.OPENAI_API_KEY_3
  ].filter(Boolean);

  openaiKeys.forEach((key, index) => {
    if (key) {
      providers.push({
        name: `OpenAI Whisper ${index > 0 ? `(Account ${index + 1})` : ''}`,
        transcribe: async (audioPath: string) => {
          const openai = new OpenAI({ apiKey: key });
          const audioFile = fs.createReadStream(audioPath);

          return await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'th',
            response_format: 'verbose_json',
            timestamp_granularities: ['word', 'segment']
          });
        }
      });
    }
  });

  // Groq (Free Whisper alternative - VERY FAST!)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: 'Groq Whisper (Fast & Free)',
      transcribe: async (audioPath: string) => {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const audioFile = fs.createReadStream(audioPath);

        return await groq.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-large-v3',
          language: 'th',
          response_format: 'verbose_json',
          timestamp_granularities: ['word', 'segment']
        });
      }
    });
  }

  return providers;
}

/**
 * Transcribe audio with automatic fallback across multiple providers
 */
export async function transcribeWithFallback(
  audioPath: string,
  progressCallback?: (progress: number, message: string) => void
): Promise<any> {
  const providers = getProviders();

  if (providers.length === 0) {
    throw new Error('No AI transcription providers configured. Please add API keys to your .env file.');
  }

  console.log(`[Transcription] Found ${providers.length} configured providers`);

  let lastError: Error | null = null;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    try {
      console.log(`[Transcription] Trying provider ${i + 1}/${providers.length}: ${provider.name}`);
      progressCallback?.(40 + (i * 10), `Transcribing with ${provider.name}...`);

      const result = await provider.transcribe(audioPath);

      console.log(`[Transcription] ✅ Success with ${provider.name}`);
      console.log(`[Transcription] Duration: ${result.duration}s, Segments: ${result.segments?.length || 0}`);

      return result;

    } catch (error: any) {
      console.error(`[Transcription] ❌ ${provider.name} failed:`, error.message);
      lastError = error;

      // Check if it's a quota/billing error
      const isQuotaError = error.message?.includes('429') ||
                          error.message?.includes('quota') ||
                          error.message?.includes('exceeded') ||
                          error.status === 429;

      if (isQuotaError) {
        console.log(`[Transcription] Quota exceeded for ${provider.name}, trying next provider...`);
      } else {
        // For non-quota errors, might want to retry or skip based on error type
        console.log(`[Transcription] Error with ${provider.name}: ${error.message}`);
      }

      // If this isn't the last provider, continue to next
      if (i < providers.length - 1) {
        progressCallback?.(40 + (i * 10) + 5, `Trying alternative provider...`);
        continue;
      }
    }
  }

  // All providers failed
  console.error('[Transcription] ❌ All providers failed');
  throw new Error(
    `All ${providers.length} transcription provider(s) failed. ` +
    `Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Please check your API keys and billing status.`
  );
}

/**
 * Check if any transcription providers are configured
 */
export function hasTranscriptionProvider(): boolean {
  return getProviders().length > 0;
}

/**
 * Get list of configured provider names
 */
export function getConfiguredProviders(): string[] {
  return getProviders().map(p => p.name);
}
