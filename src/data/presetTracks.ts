import { AudioTrack, WordTiming, LyricItem } from '../types';

export const RAW_CANT_DO_IT_LIKE_ME_WORDS: WordTiming[] = [
  { text: "CAN'T", start: 1.712, end: 1.945, micro_ms: -23.5, stressed: false, line_id: 1 },
  { text: "DO", start: 1.982, end: 2.110, micro_ms: 46.5, stressed: false, line_id: 1 },
  { text: "IT", start: 2.125, end: 2.240, micro_ms: -28.5, stressed: false, line_id: 1 },
  { text: "LIKE", start: 2.270, end: 2.450, micro_ms: 116.5, stressed: false, line_id: 1 },
  { text: "ME", start: 2.485, end: 2.820, micro_ms: -23.5, stressed: true, line_id: 1 },
  { text: "CAN'T", start: 3.110, end: 3.320, micro_ms: 8.0, stressed: false, line_id: 2 },
  { text: "DO", start: 3.350, end: 3.480, micro_ms: -23.8, stressed: false, line_id: 2 },
  { text: "IT", start: 3.500, end: 3.610, micro_ms: 126.2, stressed: false, line_id: 2 },
  { text: "LIKE", start: 3.640, end: 3.810, micro_ms: -13.8, stressed: false, line_id: 2 },
  { text: "ME", start: 3.850, end: 4.190, micro_ms: -23.8, stressed: true, line_id: 2 },
  { text: "AIN'T", start: 4.490, end: 4.710, micro_ms: 32.2, stressed: false, line_id: 3 },
  { text: "A", start: 4.730, end: 4.810, micro_ms: -217.8, stressed: false, line_id: 3 },
  { text: "BRAG", start: 4.850, end: 5.210, micro_ms: -97.8, stressed: true, line_id: 3 },
  { text: "IT'S", start: 5.860, end: 6.010, micro_ms: 26.2, stressed: false, line_id: 4 },
  { text: "A", start: 6.030, end: 6.110, micro_ms: -223.8, stressed: false, line_id: 4 },
  { text: "FACT", start: 6.150, end: 6.540, micro_ms: -103.8, stressed: true, line_id: 4 },
  { text: "SAME", start: 7.210, end: 7.420, micro_ms: -18.2, stressed: false, line_id: 5 },
  { text: "BLOCK", start: 7.450, end: 7.880, micro_ms: 221.8, stressed: true, line_id: 5 },
  { text: "SAME", start: 8.570, end: 8.790, micro_ms: -28.2, stressed: false, line_id: 6 },
  { text: "CORNER", start: 8.820, end: 9.250, micro_ms: 221.8, stressed: true, line_id: 6 },
  { text: "SAME", start: 9.930, end: 10.150, micro_ms: -38.2, stressed: false, line_id: 7 },
  { text: "SPOT", start: 10.180, end: 10.610, micro_ms: 211.8, stressed: true, line_id: 7 },
  { text: "SAME", start: 11.290, end: 11.510, micro_ms: -48.2, stressed: false, line_id: 8 },
  { text: "TALK", start: 11.540, end: 11.980, micro_ms: 201.8, stressed: true, line_id: 8 },
  { text: "YEARS", start: 12.630, end: 12.910, micro_ms: -28.2, stressed: false, line_id: 9 },
  { text: "KEPT", start: 12.950, end: 13.180, micro_ms: 291.8, stressed: false, line_id: 9 },
  { text: "MOVING", start: 13.220, end: 13.680, micro_ms: -128.2, stressed: true, line_id: 9 },
  { text: "YOU", start: 14.010, end: 14.190, micro_ms: -308.2, stressed: false, line_id: 10 },
  { text: "STAYED", start: 14.230, end: 14.580, micro_ms: -88.2, stressed: false, line_id: 10 },
  { text: "RIGHT", start: 14.620, end: 14.910, micro_ms: 301.8, stressed: true, line_id: 10 },
  { text: "THERE", start: 14.950, end: 15.380, micro_ms: -228.2, stressed: true, line_id: 10 },
  { text: "EVERY", start: 16.710, end: 16.980, micro_ms: -28.2, stressed: false, line_id: 11 },
  { text: "TIME", start: 17.020, end: 17.380, micro_ms: -348.2, stressed: true, line_id: 11 },
  { text: "THAT", start: 17.410, end: 17.550, micro_ms: 41.8, stressed: false, line_id: 11 },
  { text: "I", start: 17.580, end: 17.680, micro_ms: 211.8, stressed: false, line_id: 11 },
  { text: "CIRCLE", start: 17.720, end: 18.050, micro_ms: -368.2, stressed: true, line_id: 11 },
  { text: "I", start: 18.090, end: 18.190, micro_ms: 2.0, stressed: false, line_id: 11 },
  { text: "NOTICE", start: 18.230, end: 18.590, micro_ms: 142.0, stressed: true, line_id: 11 },
  { text: "THE", start: 18.620, end: 18.720, micro_ms: -248.0, stressed: false, line_id: 11 },
  { text: "PATTERN", start: 18.760, end: 19.180, micro_ms: -108.0, stressed: true, line_id: 11 },
  { text: "SAME", start: 19.430, end: 19.680, micro_ms: -108.0, stressed: false, line_id: 12 },
  { text: "FACES", start: 19.720, end: 20.080, micro_ms: -488.0, stressed: true, line_id: 12 },
  { text: "STILL", start: 20.120, end: 20.350, micro_ms: -88.0, stressed: false, line_id: 12 },
  { "text": "POSTED", start: 20.390, end: 20.810, micro_ms: 182.0, stressed: true, line_id: 12 },
  { text: "SAME", start: 20.850, end: 21.080, micro_ms: -208.0, stressed: false, line_id: 12 },
  { text: "TALK", start: 21.120, end: 21.410, micro_ms: 62.0, stressed: true, line_id: 12 },
  { text: "GETTING", start: 21.450, end: 21.720, micro_ms: -378.0, stressed: false, line_id: 12 },
  { text: "TATTERED", start: 21.760, end: 22.210, micro_ms: -68.0, stressed: true, line_id: 12 }
];

export const BEAT_GRID_88 = [
  0.375, 1.057, 1.739, 2.420, 3.102, 3.784, 4.466, 5.148,
  5.830, 6.511, 7.193, 7.875, 8.557, 9.239, 9.920, 10.602,
  11.284, 11.966, 12.648, 13.330, 14.011, 14.693, 15.375, 16.057,
  16.739, 17.420, 18.102, 18.784, 19.466, 20.148, 20.830, 21.511, 22.193
];

export const DOWNBEATS_88 = [
  0.375, 3.102, 5.830, 8.557, 11.284, 14.011, 16.739, 19.466, 22.193
];

export function buildLyricsFromWords(words: WordTiming[]): LyricItem[] {
  const lineMap = new Map<number, WordTiming[]>();
  words.forEach((w) => {
    const lineId = w.line_id || 1;
    if (!lineMap.has(lineId)) {
      lineMap.set(lineId, []);
    }
    lineMap.get(lineId)!.push(w);
  });

  const lyrics: LyricItem[] = [
    { id: 'cue-intro', type: 'cue', text: 'HOOK INTRO (00:00 - 00:04)', timestamp: 0.38, pocket: 'on', offsetMs: 0, subdivision: 0 }
  ];

  lineMap.forEach((lineWords, lineId) => {
    if (lineWords.length === 0) return;
    const startSec = lineWords[0].start;
    const avgOffset = lineWords.reduce((acc, curr) => acc + curr.micro_ms, 0) / lineWords.length;
    const textFormatted = lineWords.map((w) => (w.stressed ? `<em>${w.text}</em>` : w.text)).join(' ');

    let pocket: LyricItem['pocket'] = 'on';
    if (avgOffset > 25) pocket = 'pushing';
    else if (avgOffset > 5) pocket = 'ahead';
    else if (avgOffset < -25) pocket = 'laid-back';
    else if (avgOffset < -5) pocket = 'behind';

    if (lineId === 5) {
      lyrics.push({
        id: 'cue-verse',
        type: 'cue',
        text: 'CADENCE FLOW (00:07 - 00:22)',
        timestamp: 6.8,
        pocket: 'on',
        offsetMs: 0,
        subdivision: 0
      });
    }

    lyrics.push({
      id: `line-${lineId}`,
      type: 'line',
      text: textFormatted,
      timestamp: parseFloat(startSec.toFixed(3)),
      pocket,
      offsetMs: parseFloat(avgOffset.toFixed(1)),
      subdivision: 0,
      words: lineWords,
      line_id: lineId,
      note: `Line ${lineId} • ${lineWords.filter((w) => w.stressed).map((w) => w.text).join('/')} (Stress) • ${avgOffset >= 0 ? '+' : ''}${avgOffset.toFixed(1)}ms`
    });
  });

  return lyrics;
}

export const DEFAULT_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'cant-do-it-like-me-88',
    name: "88 BPM 'Can't Do It Like Me' (Vocal Cadence & Stems)",
    bpm: 88,
    genre: 'Hip-Hop / Micro-Sync Flow',
    description: 'Precision word-level micro-timing grid with stressed accents and sub-millisecond cadence analysis.',
    lyrics: buildLyricsFromWords(RAW_CANT_DO_IT_LIKE_ME_WORDS),
    beatGrid: BEAT_GRID_88,
    downbeats: DOWNBEATS_88,
    words: RAW_CANT_DO_IT_LIKE_ME_WORDS
  },
  {
    id: 'cant-do-it-like-me-inst-88',
    name: "88 BPM 'Can't Do It Like Me' (Instrumental Beat Grid)",
    bpm: 88,
    genre: 'Instrumental / 4/4 Beat Grid',
    description: 'Isolated 88 BPM drum and bass transients with 16th-note subdivision anchors and downbeat markers.',
    lyrics: [
      { id: 'cue-inst-intro', type: 'cue', text: '4/4 METRIC ANCHOR GRID', timestamp: 0.38, pocket: 'on', offsetMs: 0, subdivision: 0 },
      { id: 'cue-inst-bar1', type: 'line', text: 'DOWNBEAT 1 • 808 SUB & TRANSIENT LOCK', timestamp: 0.375, pocket: 'on', offsetMs: 0, subdivision: 0, note: 'Bar 1 Downbeat' },
      { id: 'cue-inst-bar2', type: 'line', text: 'DOWNBEAT 2 • SNARE TRANSIENT SNAP', timestamp: 3.102, pocket: 'on', offsetMs: 0, subdivision: 0, note: 'Bar 2 Downbeat' },
      { id: 'cue-inst-bar3', type: 'line', text: 'DOWNBEAT 3 • 16TH HI-HAT COUNTERPOINT', timestamp: 5.830, pocket: 'on', offsetMs: 0, subdivision: 0, note: 'Bar 3 Downbeat' },
      { id: 'cue-inst-bar4', type: 'line', text: 'DOWNBEAT 4 • SUBDIVISION CADENCE REPEAT', timestamp: 8.557, pocket: 'on', offsetMs: 0, subdivision: 0, note: 'Bar 4 Downbeat' },
    ],
    beatGrid: BEAT_GRID_88,
    downbeats: DOWNBEATS_88,
    words: []
  }
];

export const PRESET_TRACKS = DEFAULT_AUDIO_TRACKS;
