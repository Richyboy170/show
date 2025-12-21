# 🤖 AI-Powered Lyric Correction Guide

## Overview

The AI Fix feature uses OpenAI GPT-4 to automatically correct problematic lyrics that were imported with wrong timestamps, sequences, or ordering issues.

## ✨ Key Features

- **Selective Correction**: Choose only the lyrics that need fixing
- **Smart Analysis**: AI considers context from surrounding lyrics
- **Multiple Fixes**: Corrects timestamps, sequences, and ordering
- **Batch Processing**: Fix multiple lyrics at once
- **Safe Updates**: Only changes selected lyrics, leaves others untouched

---

## 🎯 When to Use AI Fix

### Perfect For:
- ✅ Wrong timestamp sequences (overlapping times)
- ✅ Lyrics out of order after bulk import
- ✅ Duration issues (too long/short)
- ✅ Gaps between consecutive lyrics
- ✅ Order numbers not sequential

### Example Problems AI Can Fix:

**Problem 1: Overlapping Timestamps**
```
Line 1: 00:15 - 00:25 (10 seconds)
Line 2: 00:20 - 00:30 (overlaps with Line 1!)
```
**AI Fix**: Adjusts to 00:15-00:20, 00:20-00:30

**Problem 2: Wrong Sequence**
```
Line 1: 00:30 - 00:35
Line 2: 00:15 - 00:20 (should be before Line 1!)
```
**AI Fix**: Swaps order or adjusts timestamps

**Problem 3: Unrealistic Durations**
```
Line 1: 00:15 - 01:45 (90 seconds - too long!)
```
**AI Fix**: Adjusts to reasonable 5-10 second duration

---

## 📖 How to Use

### Step-by-Step Guide

1. **Navigate to Video Editor**
   - Go to Admin Dashboard
   - Click "Edit" on the video with wrong lyrics

2. **Activate Selection Mode**
   - Click **"🤖 AI Fix Wrong Lyrics"** button
   - The button will turn orange: "✓ Selection Mode Active"

3. **Select Problematic Lyrics**
   - Checkboxes appear next to each lyric
   - Click checkboxes to select lyrics with wrong timestamps
   - **OR** click "Select All" to select everything

4. **Review Selection**
   - Selected lyrics show: "✓ Selected for AI Fix"
   - Counter shows: "🤖 AI Fix Mode (X selected)"

5. **Run AI Fix**
   - Click **"🤖 Fix X Selected Lyrics"** button
   - Confirm the action
   - Wait for AI processing (~5-15 seconds)

6. **Review Results**
   - Page automatically refreshes
   - Check fixed timestamps and ordering
   - Manually adjust if needed

---

## 🔧 How It Works Technically

### AI Analysis Process

1. **Context Gathering**
   - Fetches ALL lyrics from the video
   - Identifies selected vs non-selected lyrics
   - Gets video metadata (duration, title)

2. **AI Prompt**
   - Sends all lyrics + context to GPT-4
   - AI analyzes temporal relationships
   - Considers surrounding lyric context
   - Applies timing rules (see below)

3. **Correction Rules**
   - Timestamps must be sequential (startTime < endTime)
   - No overlapping between consecutive lines
   - Reasonable durations (2-10 seconds typical)
   - Small gaps between lines (0.1-0.5s)
   - Maintain overall sequence/order

4. **Database Update**
   - AI returns corrected timestamps + ordering
   - Batch updates selected lyrics
   - Preserves Thai text and chords

### API Endpoint

**POST** `/api/lyrics/ai-fix`

**Request:**
```json
{
  "videoId": "video-id-here",
  "selectedLyricIds": ["lyric-1-id", "lyric-2-id", "lyric-3-id"]
}
```

**Response:**
```json
{
  "success": true,
  "fixed": 3,
  "message": "AI successfully fixed 3 lyrics",
  "details": [
    {
      "id": "lyric-1-id",
      "startTime": 15.5,
      "endTime": 18.0,
      "order": 0
    },
    ...
  ]
}
```

---

## 🎨 UI Features

### Selection Mode Controls

**Main Button**
- Inactive: Yellow gradient "🤖 AI Fix Wrong Lyrics"
- Active: Orange/red gradient "✓ Selection Mode Active"

**Control Panel** (when active)
- Shows selection count: "(X selected)"
- **Select All**: Quick-select all lyrics
- **Clear Selection**: Deselect all
- **Fix Button**: Process selected lyrics with AI

### Lyric Cards in Selection Mode

**Visual Changes:**
- Checkbox appears next to play button
- Selected lyrics show: "✓ Selected for AI Fix" badge
- Orange accent color for selected items

---

## 💡 Best Practices

### Strategy for Best Results

1. **Start Small**
   - Test with 2-3 problematic lyrics first
   - Verify AI fixes are correct
   - Then process larger batches

2. **Context Matters**
   - Select consecutive lyrics together
   - AI uses surrounding context for better fixes
   - Don't select scattered individual lyrics

3. **Review After Fix**
   - Always check AI corrections
   - Use manual editor for fine-tuning
   - AI is smart but not perfect

4. **Combine with Manual**
   - Use AI for bulk timestamp fixes
   - Manual edit for precise adjustments
   - Best workflow: AI → Manual review → Save

### Typical Workflow

```
Step 1: Bulk import Thai lyrics
  ↓
Step 2: Notice some wrong sequences/timestamps
  ↓
Step 3: Enable AI Fix mode
  ↓
Step 4: Select problematic lyrics (3-10 at a time)
  ↓
Step 5: Run AI fix
  ↓
Step 6: Review and manually adjust if needed
  ↓
Step 7: Save and continue
```

---

## ⚙️ Configuration

### OpenAI API Key

The AI Fix feature requires an OpenAI API key in your `.env` file:

```bash
# Primary key
OPENAI_API_KEY="sk-..."

# Fallback keys (optional)
OPENAI_API_KEY_2="sk-..."
OPENAI_API_KEY_3="sk-..."
```

The system will automatically try fallback keys if the primary is over quota.

### Model Used

- **Model**: `gpt-4o-mini`
- **Temperature**: 0.3 (precise, deterministic)
- **Response Format**: JSON only
- **Cost**: ~$0.01-0.03 per fix operation

### Timeout

- **Max Duration**: 60 seconds
- **Typical Processing**: 5-15 seconds for 10-20 lyrics

---

## 🆘 Troubleshooting

### "OpenAI API key not configured"
**Solution**: Add `OPENAI_API_KEY` to your `.env` file

### "No valid selected lyrics found"
**Causes**:
- Selected lyrics don't have IDs (not saved yet)
- Selection was cleared

**Solution**: Save lyrics first, then use AI fix

### "AI returned invalid fixes"
**Causes**:
- OpenAI API rate limit
- Malformed AI response
- Connection timeout

**Solution**:
1. Wait a few seconds and retry
2. Check API key quota
3. Select fewer lyrics at once

### AI fixes are slightly wrong
**This is normal!** AI provides educated guesses based on:
- Song title and context
- Temporal patterns
- Typical lyric durations

**Solution**: Use AI for bulk fixes, then manually fine-tune

### Selected lyrics don't show checkbox
**Cause**: Lyrics haven't been saved to database yet (no ID)

**Solution**: Save the video first, then use AI fix

---

## 🔐 Security & Privacy

### What Data is Sent to OpenAI?

**Sent:**
- Lyric text (Thai and English)
- Timestamps (startTime, endTime)
- Video title and duration
- Order information

**NOT Sent:**
- User information
- Video URLs
- Private keys
- Other videos' data

### Data Usage

- OpenAI processes data according to their [API Data Usage Policy](https://openai.com/policies/api-data-usage-policies)
- Data is not used for model training (API requests)
- Temporary processing only

---

## 📊 Comparison: AI Fix vs Manual Edit

| Feature | AI Fix | Manual Edit |
|---------|--------|-------------|
| **Speed** | 5-15 seconds for 10+ lyrics | 1-2 min per lyric |
| **Accuracy** | 85-95% | 100% |
| **Best For** | Bulk corrections, sequences | Precise adjustments |
| **Cost** | ~$0.01-0.03 per batch | Free |
| **Difficulty** | One click | Requires knowledge |
| **Context Aware** | Yes (analyzes all lyrics) | Manual judgment |

**Recommended Workflow**: AI Fix → Manual Review → Save

---

## 🚀 Advanced Tips

### Fixing Large Imports

For videos with 50+ lyrics with multiple issues:

1. **Split into sections** (chorus, verse, bridge)
2. **Fix each section separately** (10-15 lyrics at a time)
3. **Review section boundaries** manually
4. **Run AI fix again** if needed for refinement

### Combining with Bulk Import

```
1. Bulk import Thai lyrics (may have timestamp issues)
2. Review and identify problem sections
3. Use AI fix on problem sections
4. Bulk import chords (timestamps now correct)
5. Final manual review
6. Save and publish
```

### Handling Edge Cases

**Long spoken intros**: Manually adjust first lyric
**Instrumental breaks**: Check gaps manually
**Outro**: Last lyric might need manual duration adjustment

---

## 📈 Success Metrics

After using AI Fix, you should see:
- ✅ No overlapping timestamps
- ✅ Sequential ordering (0, 1, 2, 3...)
- ✅ Consistent gaps (~0.1-0.5s between lines)
- ✅ Realistic durations (2-10s per line)
- ✅ Correct temporal sequence

---

**Last Updated**: 2025-01-14
**Status**: ✅ Fully Functional
**Powered By**: OpenAI GPT-4o-mini
