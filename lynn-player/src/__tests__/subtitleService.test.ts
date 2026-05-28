import { describe, it, expect } from 'vitest';

interface SubtitleLine {
  startTime: number;
  endTime: number;
  text: string;
}

const parseSRT = (content: string): SubtitleLine[] => {
  const lines: SubtitleLine[] = [];
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const parts = block.split('\n');
    if (parts.length >= 3) {
      const timeMatch = parts[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (timeMatch) {
        const startTime =
          parseInt(timeMatch[1]) * 3600 +
          parseInt(timeMatch[2]) * 60 +
          parseInt(timeMatch[3]) +
          parseInt(timeMatch[4]) / 1000;
        const endTime =
          parseInt(timeMatch[5]) * 3600 +
          parseInt(timeMatch[6]) * 60 +
          parseInt(timeMatch[7]) +
          parseInt(timeMatch[8]) / 1000;
        const text = parts.slice(2).join('\n');
        lines.push({ startTime, endTime, text });
      }
    }
  }
  return lines;
};

const parseLRC = (content: string): SubtitleLine[] => {
  const lines: SubtitleLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
  const lyricLines = content.split('\n');

  for (const line of lyricLines) {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length > 0) {
      const text = line.replace(timeRegex, '').trim();
      for (const match of matches) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
        const startTime = minutes * 60 + seconds + milliseconds / 1000;
        lines.push({ startTime, endTime: startTime + 5, text });
      }
    }
  }
  return lines.sort((a, b) => a.startTime - b.startTime);
};

describe('Subtitle Service', () => {
  describe('SRT Parsing', () => {
    it('should parse basic SRT', () => {
      const srt = `
1
00:00:01,000 --> 00:00:03,000
Hello World

2
00:00:04,000 --> 00:00:06,000
Test Subtitle
`;
      const result = parseSRT(srt);
      expect(result.length).toBe(2);
      expect(result[0].text).toBe('Hello World');
      expect(result[0].startTime).toBe(1);
      expect(result[0].endTime).toBe(3);
    });

    it('should handle empty content', () => {
      const result = parseSRT('');
      expect(result.length).toBe(0);
    });
  });

  describe('LRC Parsing', () => {
    it('should parse basic LRC', () => {
      const lrc = `
[00:01.00]Hello World
[00:04.00]Test Lyric
`;
      const result = parseLRC(lrc);
      expect(result.length).toBe(2);
      expect(result[0].text).toBe('Hello World');
      expect(result[0].startTime).toBe(1);
    });

    it('should sort lyrics by time', () => {
      const lrc = `
[00:04.00]Second
[00:01.00]First
`;
      const result = parseLRC(lrc);
      expect(result[0].text).toBe('First');
      expect(result[1].text).toBe('Second');
    });
  });
});
