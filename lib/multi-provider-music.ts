import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

interface MusicGenerationProvider {
  name: string;
  model: string;
  generate: (systemPrompt: string, userPrompt: string) => Promise<string>;
  costTier: 'free' | 'low' | 'medium' | 'high'; // For prioritization
}

/**
 * Get all configured AI providers for music generation in priority order
 * Priority: High-quality models first, then fallback to cheaper/free options
 */
function getProviders(): MusicGenerationProvider[] {
  const providers: MusicGenerationProvider[] = [];

  // === OPENAI PROVIDERS (Best for music) ===
  const openaiKeys = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_API_KEY_2,
    process.env.OPENAI_API_KEY_3
  ].filter(Boolean) as string[];

  openaiKeys.forEach((key, index) => {
    if (key) {
      // GPT-4o (Most capable)
      providers.push({
        name: `OpenAI GPT-4o${index > 0 ? ` (Account ${index + 1})` : ''}`,
        model: 'gpt-4o',
        costTier: 'high',
        generate: async (systemPrompt: string, userPrompt: string) => {
          const openai = new OpenAI({ apiKey: key });
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 8000
          });
          return response.choices[0]?.message?.content || '';
        }
      });

      // GPT-4o-mini (Cheaper fallback)
      providers.push({
        name: `OpenAI GPT-4o-mini${index > 0 ? ` (Account ${index + 1})` : ''}`,
        model: 'gpt-4o-mini',
        costTier: 'low',
        generate: async (systemPrompt: string, userPrompt: string) => {
          const openai = new OpenAI({ apiKey: key });
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 6000
          });
          return response.choices[0]?.message?.content || '';
        }
      });
    }
  });

  // === ANTHROPIC CLAUDE (Excellent for structured output) ===
  const anthropicKeys = [
    process.env.ANTHROPIC_API_KEY,
    process.env.ANTHROPIC_API_KEY_2
  ].filter(Boolean) as string[];

  anthropicKeys.forEach((key, index) => {
    if (key) {
      // Claude Sonnet 4.5 (Best balance)
      providers.push({
        name: `Claude Sonnet 4.5${index > 0 ? ` (Account ${index + 1})` : ''}`,
        model: 'claude-sonnet-4-5-20250929',
        costTier: 'medium',
        generate: async (systemPrompt: string, userPrompt: string) => {
          const anthropic = new Anthropic({ apiKey: key });
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8000,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ]
          });
          return response.content[0]?.type === 'text' ? response.content[0].text : '';
        }
      });

      // Claude Haiku (Fastest, cheapest)
      providers.push({
        name: `Claude Haiku${index > 0 ? ` (Account ${index + 1})` : ''}`,
        model: 'claude-3-5-haiku-20241022',
        costTier: 'low',
        generate: async (systemPrompt: string, userPrompt: string) => {
          const anthropic = new Anthropic({ apiKey: key });
          const response = await anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 6000,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ]
          });
          return response.content[0]?.type === 'text' ? response.content[0].text : '';
        }
      });
    }
  });

  // === GOOGLE GEMINI (Good fallback) ===
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY
  ].filter(Boolean) as string[];

  geminiKeys.forEach((key, index) => {
    if (key) {
      // Gemini Pro
      providers.push({
        name: `Google Gemini Pro${index > 0 ? ` (Account ${index + 1})` : ''}`,
        model: 'gemini-pro',
        costTier: 'medium',
        generate: async (systemPrompt: string, userPrompt: string) => {
          const genAI = new GoogleGenerativeAI(key!);
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

          const result = await model.generateContent({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
            }
          });

          return result.response.text();
        }
      });

      // Gemini Flash (Faster)
      providers.push({
        name: `Google Gemini Flash${index > 0 ? ` (Account ${index + 1})` : ''}`,
        model: 'gemini-1.5-flash',
        costTier: 'low',
        generate: async (systemPrompt: string, userPrompt: string) => {
          const genAI = new GoogleGenerativeAI(key!);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const result = await model.generateContent({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 6000,
            }
          });

          return result.response.text();
        }
      });
    }
  });

  // === GROQ (FREE and FAST!) ===
  const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2
  ].filter(Boolean) as string[];

  groqKeys.forEach((key, index) => {
    if (key) {
      providers.push({
        name: `Groq Llama 3.1 70B${index > 0 ? ` (Account ${index + 1})` : ''}`,
        model: 'llama-3.1-70b-versatile',
        costTier: 'free',
        generate: async (systemPrompt: string, userPrompt: string) => {
          const groq = new Groq({ apiKey: key });
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 8000
          });
          return response.choices[0]?.message?.content || '';
        }
      });
    }
  });

  // Sort by cost tier: high -> medium -> low -> free (best quality first)
  const tierOrder = { high: 0, medium: 1, low: 2, free: 3 };
  providers.sort((a, b) => tierOrder[a.costTier] - tierOrder[b.costTier]);

  return providers;
}

/**
 * Generate music notation with automatic fallback across multiple AI providers
 */
export async function generateWithFallback(
  systemPrompt: string,
  userPrompt: string,
  progressCallback?: (progress: number, message: string) => void,
  preferCheap: boolean = false // Set to true to prioritize cheaper models
): Promise<string> {
  let providers = getProviders();

  if (providers.length === 0) {
    throw new Error(
      'No AI providers configured. Please add at least one API key to your .env file:\n' +
      '- OPENAI_API_KEY\n' +
      '- ANTHROPIC_API_KEY\n' +
      '- GEMINI_API_KEY\n' +
      '- GROQ_API_KEY (FREE!)'
    );
  }

  // If preferCheap is true, reverse the order to try cheaper models first
  if (preferCheap) {
    providers = providers.reverse();
  }

  console.log(`[Music-AI] Found ${providers.length} configured providers`);
  console.log(`[Music-AI] Priority: ${preferCheap ? 'Cost-effective' : 'Quality-first'}`);

  let lastError: Error | null = null;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    try {
      console.log(`[Music-AI] Trying provider ${i + 1}/${providers.length}: ${provider.name}`);
      progressCallback?.(50 + (i * 10), `Generating with ${provider.name}...`);

      const result = await provider.generate(systemPrompt, userPrompt);

      console.log(`[Music-AI] ✅ Success with ${provider.name}`);
      console.log(`[Music-AI] Response length: ${result.length} characters`);

      return result;

    } catch (error: any) {
      console.error(`[Music-AI] ❌ ${provider.name} failed:`, error.message);
      lastError = error;

      // Check if it's a rate limit or quota error
      const isQuotaError = error.message?.includes('429') ||
                          error.message?.includes('quota') ||
                          error.message?.includes('exceeded') ||
                          error.message?.includes('rate_limit') ||
                          error.message?.includes('insufficient_quota') ||
                          error.status === 429 ||
                          error.code === 'rate_limit_exceeded';

      const isBillingError = error.message?.includes('billing') ||
                             error.message?.includes('payment') ||
                             error.code === 'insufficient_quota';

      if (isQuotaError) {
        console.log(`[Music-AI] ⚠️  Rate limit/quota exceeded for ${provider.name}, trying next provider...`);
      } else if (isBillingError) {
        console.log(`[Music-AI] ⚠️  Billing issue with ${provider.name}, trying next provider...`);
      } else {
        console.log(`[Music-AI] ⚠️  Error with ${provider.name}: ${error.message}`);
      }

      // If this isn't the last provider, continue to next
      if (i < providers.length - 1) {
        progressCallback?.(50 + (i * 10) + 5, `Trying alternative provider...`);
        continue;
      }
    }
  }

  // All providers failed
  console.error('[Music-AI] ❌ All providers failed');
  throw new Error(
    `All ${providers.length} AI provider(s) failed. ` +
    `Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Please check your API keys and billing status, or add more providers to your .env file.`
  );
}

/**
 * Check if any music generation providers are configured
 */
export function hasMusicProvider(): boolean {
  return getProviders().length > 0;
}

/**
 * Get list of configured provider names
 */
export function getConfiguredProviders(): string[] {
  return getProviders().map(p => `${p.name} [${p.costTier}]`);
}

/**
 * Get count of providers by tier
 */
export function getProviderStats(): { total: number; byTier: Record<string, number> } {
  const providers = getProviders();
  const byTier: Record<string, number> = { high: 0, medium: 0, low: 0, free: 0 };

  providers.forEach(p => {
    byTier[p.costTier]++;
  });

  return {
    total: providers.length,
    byTier
  };
}
