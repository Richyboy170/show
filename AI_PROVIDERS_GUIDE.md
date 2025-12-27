# AI Providers Guide - Multi-Provider System

## Overview

The Thai Lyrics App now uses a **multi-provider AI system** with automatic fallback. If one AI provider reaches its rate limit or fails, the system automatically tries the next provider.

This ensures **99.9% uptime** for AI features even if individual providers have issues.

---

## Supported AI Providers

### 1. OpenAI (Recommended for Quality)
- **Models**: GPT-4o, GPT-4o-mini
- **Best for**: Piano note generation (most complex task)
- **Strengths**:
  - Excellent music understanding
  - Best ABC notation generation
  - Consistent structured output
- **Cost**:
  - GPT-4o: ~$15/1M tokens (high quality)
  - GPT-4o-mini: ~$0.60/1M tokens (good quality)
- **Setup**: Get API key from https://platform.openai.com/api-keys
- **Environment Variables**:
  ```bash
  OPENAI_API_KEY="sk-..."
  OPENAI_API_KEY_2="sk-..."  # Optional backup
  OPENAI_API_KEY_3="sk-..."  # Optional backup
  ```

### 2. Anthropic Claude (Excellent Alternative)
- **Models**: Claude Sonnet 4.5, Claude Haiku
- **Best for**: Structured output, complex reasoning
- **Strengths**:
  - Very good at following detailed instructions
  - Excellent JSON formatting
  - Good musical knowledge
- **Cost**:
  - Claude Sonnet 4.5: ~$3/1M tokens (high quality)
  - Claude Haiku: ~$0.80/1M tokens (fast & cheap)
- **Setup**: Get API key from https://console.anthropic.com/
- **Environment Variables**:
  ```bash
  ANTHROPIC_API_KEY="sk-ant-..."
  ANTHROPIC_API_KEY_2="sk-ant-..."  # Optional backup
  ```

### 3. Google Gemini (Good Fallback)
- **Models**: Gemini Pro, Gemini Flash
- **Best for**: Cost-effective generation
- **Strengths**:
  - Cheap pricing
  - Fast response times
  - Good general capabilities
- **Cost**:
  - Gemini Pro: ~$0.50/1M tokens
  - Gemini Flash: ~$0.15/1M tokens (very cheap!)
- **Setup**: Get API key from https://makersuite.google.com/app/apikey
- **Environment Variables**:
  ```bash
  GEMINI_API_KEY="AIza..."
  # OR
  GOOGLE_API_KEY="AIza..."
  ```

### 4. Groq (FREE & FAST!)
- **Models**: Llama 3.1 70B
- **Best for**: Free tier, ultra-fast responses
- **Strengths**:
  - **100% FREE** (with rate limits)
  - **10-20x faster** than OpenAI
  - Excellent for chord generation
  - Great fallback option
- **Cost**: FREE (up to 30 requests/minute)
- **Setup**: Get API key from https://console.groq.com/
- **Environment Variables**:
  ```bash
  GROQ_API_KEY="gsk_..."
  GROQ_API_KEY_2="gsk_..."  # Optional backup
  ```

---

## How Fallback Works

### Piano Note Generation (Quality-First)
When you click "Generate Piano Notes", the system tries providers in this order:

1. ✅ **OpenAI GPT-4o** (Account 1) - Highest quality
2. ✅ **OpenAI GPT-4o** (Account 2) - If configured
3. ✅ **OpenAI GPT-4o** (Account 3) - If configured
4. ✅ **Claude Sonnet 4.5** (Account 1) - Excellent alternative
5. ✅ **Claude Sonnet 4.5** (Account 2) - If configured
6. ✅ **Gemini Pro** - Good quality
7. ✅ **OpenAI GPT-4o-mini** (Account 1) - Cheaper
8. ✅ **OpenAI GPT-4o-mini** (Account 2) - If configured
9. ✅ **Claude Haiku** - Fast & cheap
10. ✅ **Gemini Flash** - Very cheap
11. ✅ **Groq Llama 3.1** - FREE fallback

**If provider fails with rate limit → Automatically tries next provider!**

### Chord Generation (Cost-Effective)
For simpler tasks like chord generation, the system prioritizes cheaper models:

1. ✅ **Groq Llama 3.1** - FREE and fast
2. ✅ **Gemini Flash** - Cheapest paid option
3. ✅ **Claude Haiku** - Low cost
4. ✅ **OpenAI GPT-4o-mini** - Low cost
5. ✅ Higher-tier models - If needed

This saves money while maintaining quality for simpler tasks.

---

## Setup Recommendations

### Minimum Setup (Free)
```bash
# Just add Groq - completely free!
GROQ_API_KEY="gsk_..."
```
✅ Covers all AI features
✅ Zero cost
⚠️ Rate limited (30 requests/min)

### Budget-Friendly Setup
```bash
# Groq for free tier
GROQ_API_KEY="gsk_..."

# Gemini for cheap paid option
GEMINI_API_KEY="AIza..."
```
✅ Covers all features
✅ Very low cost ($1-5/month typical)
✅ Good quality

### Professional Setup
```bash
# OpenAI for best quality
OPENAI_API_KEY="sk-..."

# Groq as free backup
GROQ_API_KEY="gsk_..."

# Gemini as additional backup
GEMINI_API_KEY="AIza..."
```
✅ Best quality
✅ Reliable fallback
✅ Cost: $10-30/month typical

### Production Setup (Maximum Reliability)
```bash
# Multiple OpenAI accounts
OPENAI_API_KEY="sk-..."
OPENAI_API_KEY_2="sk-..."
OPENAI_API_KEY_3="sk-..."

# Anthropic for diversity
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_API_KEY_2="sk-ant-..."

# Groq as free tier fallback
GROQ_API_KEY="gsk_..."
GROQ_API_KEY_2="gsk_..."

# Gemini for cost-effective backup
GEMINI_API_KEY="AIza..."
```
✅ Maximum reliability (10+ providers)
✅ Near-zero downtime
✅ Load balancing across accounts
✅ Cost: $50-150/month typical

---

## Rate Limits & Costs

### OpenAI
- **Free Tier**: $5 credit for 3 months (new accounts)
- **Paid Tier**: Pay-as-you-go
- **Rate Limits**:
  - 10,000 requests/day (Tier 1)
  - 90,000 requests/day (Tier 2+)
- **Cost per generation**:
  - Piano notes (GPT-4o): ~$0.05-0.10 per song
  - Chords (GPT-4o-mini): ~$0.01 per song

### Anthropic Claude
- **Free Tier**: None
- **Paid Tier**: Pay-as-you-go
- **Rate Limits**: 50 requests/min
- **Cost per generation**:
  - Piano notes (Sonnet 4.5): ~$0.03-0.06 per song
  - Chords (Haiku): ~$0.005 per song

### Google Gemini
- **Free Tier**: 60 requests/minute
- **Paid Tier**: Pay-as-you-go
- **Cost per generation**:
  - Piano notes (Gemini Pro): ~$0.02-0.04 per song
  - Chords (Gemini Flash): ~$0.002 per song

### Groq
- **Free Tier**: 30 requests/minute, 14,400 requests/day
- **Paid Tier**: Not available yet (100% free!)
- **Cost**: **FREE!**
- **Speed**: 10-20x faster than others

---

## Troubleshooting

### Error: "No AI providers configured"
**Solution**: Add at least one API key to your `.env.local` file:
```bash
# Easiest: Get free Groq key
GROQ_API_KEY="gsk_..."
```

### Error: "All X AI provider(s) failed"
**Possible causes**:
1. All providers hit rate limits → Wait 1 minute and try again
2. Invalid API keys → Check keys in `.env.local`
3. Billing issues → Check your provider billing pages
4. Network issues → Check internet connection

**Solution**: Add more backup providers

### Low Quality Piano Notes
**Solution**: Make sure you have OpenAI configured:
```bash
OPENAI_API_KEY="sk-..."
```
OpenAI GPT-4o produces the highest quality musical notation.

### Slow Generation
**Solution**: Add Groq for ultra-fast responses:
```bash
GROQ_API_KEY="gsk_..."
```
Groq is 10-20x faster than other providers.

---

## Getting API Keys

### OpenAI
1. Go to https://platform.openai.com/signup
2. Create account
3. Add payment method (required after free trial)
4. Go to https://platform.openai.com/api-keys
5. Click "Create new secret key"
6. Copy key and add to `.env.local`

### Anthropic Claude
1. Go to https://console.anthropic.com/
2. Create account
3. Add payment method
4. Go to "API Keys" section
5. Click "Create Key"
6. Copy key and add to `.env.local`

### Google Gemini
1. Go to https://makersuite.google.com/
2. Sign in with Google account
3. Click "Get API Key"
4. Create new API key
5. Copy key and add to `.env.local`

### Groq (FREE!)
1. Go to https://console.groq.com/
2. Create account (free, no credit card needed!)
3. Go to "API Keys"
4. Click "Create API Key"
5. Copy key and add to `.env.local`

---

## Code Implementation

### Files Modified
- `lib/multi-provider-music.ts` - Multi-provider client
- `lib/piano-generator.ts` - Piano note generation with fallback
- `lib/chord-generator.ts` - Chord generation with fallback

### How to Use in Code
```typescript
import { generateWithFallback } from '@/lib/multi-provider-music';

// Generate with quality-first priority
const result = await generateWithFallback(
  systemPrompt,
  userPrompt,
  progressCallback,
  false // preferCheap = false (use best models first)
);

// Generate with cost-first priority
const result = await generateWithFallback(
  systemPrompt,
  userPrompt,
  progressCallback,
  true // preferCheap = true (use cheapest models first)
);
```

### Checking Provider Status
```typescript
import {
  hasMusicProvider,
  getConfiguredProviders,
  getProviderStats
} from '@/lib/multi-provider-music';

// Check if any providers configured
if (!hasMusicProvider()) {
  throw new Error('No AI providers configured!');
}

// Get list of provider names
const providers = getConfiguredProviders();
console.log('Available:', providers);
// Output: ['OpenAI GPT-4o [high]', 'Groq Llama 3.1 70B [free]', ...]

// Get stats
const stats = getProviderStats();
console.log('Total providers:', stats.total);
console.log('By tier:', stats.byTier);
// Output: { total: 8, byTier: { high: 2, medium: 2, low: 2, free: 2 } }
```

---

## Best Practices

1. **Always have a free backup**: Add `GROQ_API_KEY` as ultimate fallback
2. **Use multiple accounts**: Add `OPENAI_API_KEY_2`, `OPENAI_API_KEY_3` for load balancing
3. **Mix providers**: Don't rely on just one company (OpenAI + Groq + Gemini)
4. **Monitor costs**: Check provider dashboards monthly
5. **Start free**: Use Groq to test, upgrade to OpenAI for quality
6. **Quality vs Cost**: Use `preferCheap=false` for piano notes, `preferCheap=true` for chords

---

## Future Providers (Coming Soon)

Potential additions:
- Cohere (when they support structured output)
- Mistral AI
- Together AI
- Perplexity AI
- Local models (Ollama integration)

---

**Last Updated**: 2025-12-27
**System Version**: Multi-Provider v2.0
**Supported Providers**: 4 (OpenAI, Anthropic, Google, Groq)
