# 🎵 Bulk Import Guide - Thai Lyrics & Chords

## Overview

The bulk import feature allows you to quickly import Thai lyrics and chords separately, with automatic matching based on timestamps.

## ✨ New Features

### 1. 📝 Bulk Import Thai Lyrics
- Import all Thai lyrics at once with timestamps
- Automatically calculates end times based on next line's start time
- Replaces existing lyrics (with confirmation)

### 2. 🎸 Bulk Import Chords
- Import chords with English lyrics for reference
- Automatically matches chords to Thai lyrics by timestamp
- Also imports English translations if not already present

---

## 📝 How to Use: Bulk Import Thai Lyrics

### Format
```
MM:SS Thai text here
MM:SS More Thai text
MM:SS.ms Even more text (milliseconds optional)
```

### Example
```
00:15 ฉันรักเธอ
00:20 เธอรู้ไหม
00:25 ว่าฉันรักเธอ
00:30.5 มากแค่ไหน
```

### Steps
1. Click **"📝 Bulk Import Thai Lyrics"** button in the Video Editor
2. Paste your formatted Thai lyrics in the text area
3. Click **"Import Thai Lyrics"**
4. Wait for confirmation and page refresh

### Notes
- Each line MUST start with timestamp in `MM:SS` or `MM:SS.ms` format
- Thai text comes after the timestamp
- End times are automatically calculated
- Last line gets +5 seconds duration

---

## 🎸 How to Use: Bulk Import Chords

### Format
```
MM:SS Chords English lyrics
MM:SS MoreChords More English text
```

### Example
```
00:15 C G Am I love you
00:20 F C G Do you know
00:25 Am F C That I love you
00:30 Dm G C How much I do
```

### Steps
1. **IMPORTANT**: Import Thai lyrics first!
2. Click **"🎸 Bulk Import Chords"** button
3. Paste your formatted chords with English lyrics
4. Click **"Import Chords"**
5. Wait for matching results and page refresh

### Chord Matching Logic
- Chords are matched to Thai lyrics by timestamp
- A chord entry matches a Thai lyric if its timestamp falls within the lyric's time range
- Format for chords: Uppercase letter (A-G) followed by optional modifiers (m, 7, maj7, sus4, etc.)
- Multiple chords separated by spaces: `C G Am F`

### Example Workflow
```
Thai Lyric: 00:15 - 00:20  "ฉันรักเธอ"
Chord Entry: 00:15 C G Am I love you
Result: Thai lyric gets chords "C G Am" and translation "I love you"
```

---

## 📊 API Endpoints

### Bulk Thai Lyrics Import
**POST** `/api/lyrics/bulk-import`
```json
{
  "videoId": "video-id-here",
  "lyricsText": "00:15 ฉันรักเธอ\n00:20 เธอรู้ไหม"
}
```

**Response**
```json
{
  "success": true,
  "imported": 2,
  "message": "Successfully imported 2 Thai lyrics"
}
```

### Bulk Chords Import
**POST** `/api/lyrics/bulk-chords`
```json
{
  "videoId": "video-id-here",
  "chordsText": "00:15 C G Am I love you\n00:20 F C G Do you know"
}
```

**Response**
```json
{
  "success": true,
  "imported": 2,
  "matched": 2,
  "totalLyrics": 2,
  "message": "Successfully matched 2 chords to Thai lyrics (2 chord entries imported)"
}
```

---

## 🔧 Technical Details

### Thai Lyrics Import Algorithm
1. Parse each line for timestamp pattern: `(\d+):(\d+(?:\.\d+)?)\s+(.+)`
2. Convert MM:SS to seconds
3. Calculate end time from next line's start time
4. Create lyric objects with order index
5. Delete existing lyrics
6. Bulk insert new lyrics

### Chords Matching Algorithm
1. Parse chord lines for: `(\d+):(\d+(?:\.\d+)?)\s+([A-G#bmaj79sus4dim\s]+)\s+(.*)`
2. Extract timestamp, chords, and English text
3. For each Thai lyric:
   - Find chord entry where `timestamp >= startTime && timestamp < endTime`
   - Update lyric with matched chords
   - Add English text as translation (if empty)
4. Return match statistics

### Supported Chord Formats
- **Major**: C, D, E, F, G, A, B
- **Minor**: Cm, Dm, Em, Am, etc.
- **Seventh**: C7, D7, E7, etc.
- **Major 7th**: Cmaj7, Dmaj7, etc.
- **Suspended**: Csus4, Dsus4, etc.
- **Diminished**: Cdim, Ddim, etc.
- **Sharp/Flat**: C#, Bb, etc.
- **Multiple chords**: Separated by spaces

---

## 🎯 Best Practices

### Workflow Recommendation
1. **Add video** to your library
2. **Import Thai lyrics** using bulk import
3. **Import chords** with English lyrics
4. **Review and adjust** using manual editor
5. **Save** and publish

### Time Estimates
- Bulk Thai lyrics import: **10-30 seconds**
- Bulk chords import: **10-30 seconds**
- Manual adjustments: **2-5 minutes**
- **Total**: ~3-6 minutes per song

### Tips
- Keep formatting consistent
- Double-check timestamps before import
- Use milliseconds (.5) for precision
- Import Thai lyrics before chords
- Review matched chords for accuracy

---

## ❌ Removed: ChordMini API

The ChordMini free API has been removed due to reliability issues. The bulk import method is:
- ✅ **More reliable** - no external API dependency
- ✅ **Faster** - no audio processing delay
- ✅ **More accurate** - you provide the exact chords
- ✅ **More flexible** - works with any chord notation

---

## 🆘 Troubleshooting

### "No valid lyrics found"
- Check timestamp format: `MM:SS` (e.g., `00:15`)
- Ensure Thai text comes after timestamp
- Remove empty lines

### "No Thai lyrics found for this video"
- Import Thai lyrics first before importing chords
- Make sure you're editing the correct video

### "Imported X chords but matched Y"
- Some chord timestamps don't match Thai lyric ranges
- Check that timestamps align with Thai lyrics
- Adjust timestamps if needed

### Chords not showing up
- Refresh the page after import
- Check browser console for errors
- Verify chords were saved to database

---

**Last Updated**: 2025-01-14
**Status**: ✅ Fully Functional
