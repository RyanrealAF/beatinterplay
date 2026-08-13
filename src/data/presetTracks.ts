import { AudioTrack } from '../types';

export const DEFAULT_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'trap-120-cadence',
    name: '120 BPM Cyber Trap Stems',
    bpm: 120,
    genre: 'Trap / Micro-Sync',
    description: '16th-note syncopated vocal chops over heavy kick & hi-hat transients.',
    lyrics: [
      { id: '1', type: 'cue', text: 'INTRO (00:00 - 00:04)', timestamp: 0.5, pocket: 'on', offsetMs: 0, subdivision: 0 },
      { id: '2', type: 'line', text: "Lock the <em>cadence</em> to the sub-frequency grid", timestamp: 2.0, pocket: 'on', offsetMs: +1.2, subdivision: 0, note: 'Direct 16th-note transient alignment' },
      { id: '3', type: 'line', text: "Switching <em>triplets</em> while the hi-hats ride the edge", timestamp: 4.0, pocket: 'pushing', offsetMs: +8.4, subdivision: 1, note: 'Slightly ahead of grid (+8.4ms)' },
      { id: '4', type: 'cue', text: 'VERSE 1 (00:06 - 00:16)', timestamp: 6.0, pocket: 'on', offsetMs: 0, subdivision: 0 },
      { id: '5', type: 'line', text: "Digital <em>transients</em> popping on the second beat", timestamp: 8.0, pocket: 'on', offsetMs: -0.5, subdivision: 0, note: 'Dead-center pocket accuracy' },
      { id: '6', type: 'line', text: "Laid-back <em>vocal flow</em> slipping behind the snare", timestamp: 10.0, pocket: 'laid-back', offsetMs: -14.2, subdivision: 3, note: 'Deep pocket lag (-14.2ms)' },
      { id: '7', type: 'line', text: "Fast 32nd <em>chop</em> re-syncing with the kick drum", timestamp: 12.0, pocket: 'pushing', offsetMs: +5.8, subdivision: 2, note: 'Pushing tempo edge' },
      { id: '8', type: 'line', text: "16th note <em>subdivision</em> locked at ninety-six percent", timestamp: 14.0, pocket: 'on', offsetMs: +2.1, subdivision: 0, note: 'On-grid resolution' },
    ],
  },
  {
    id: 'boombap-90-laidback',
    name: '90 BPM Laid-Back Boom Bap Stems',
    bpm: 90,
    genre: 'Classic Boom Bap',
    description: 'Relaxed groove featuring vocals riding comfortably behind the snare.',
    lyrics: [
      { id: 'b1', type: 'cue', text: 'HEAD NOD INTRO', timestamp: 0.8, pocket: 'on', offsetMs: 0, subdivision: 0 },
      { id: 'b2', type: 'line', text: "Riding <em>behind the snare</em> with effortless precision", timestamp: 2.66, pocket: 'laid-back', offsetMs: -18.5, subdivision: 3, note: 'Classic late pocket node' },
      { id: 'b3', type: 'line', text: "Vinyl <em>crackle</em> blended into the vocal formant", timestamp: 5.33, pocket: 'behind', offsetMs: -12.0, subdivision: 2, note: 'Warm groove delay' },
      { id: 'b4', type: 'cue', text: 'HOOK POCKET', timestamp: 8.00, pocket: 'on', offsetMs: 0, subdivision: 0 },
      { id: 'b5', type: 'line', text: "Keep the <em>bounce steady</em> as the kick hits heavy", timestamp: 10.66, pocket: 'on', offsetMs: +0.8, subdivision: 0, note: 'Precision anchor' },
      { id: 'b6', type: 'line', text: "Sub-bass <em>resonance</em> catching every syncopation", timestamp: 13.33, pocket: 'laid-back', offsetMs: -15.4, subdivision: 3, note: 'Laid back flow' },
    ],
  },
  {
    id: 'drill-140-pushing',
    name: '140 BPM Fast Drill Micro-Attack Stems',
    bpm: 140,
    genre: 'Drill / Fast Attack',
    description: 'Rapid vocal delivery pushing slightly ahead of sliding 808s and crisp snares.',
    lyrics: [
      { id: 'd1', type: 'cue', text: 'COUNT IN', timestamp: 0.4, pocket: 'on', offsetMs: 0, subdivision: 0 },
      { id: 'd2', type: 'line', text: "Rapid <em>attack</em> cutting straight through the 808 slide", timestamp: 1.71, pocket: 'pushing', offsetMs: +12.4, subdivision: 1, note: 'Aggressive lead (+12.4ms)' },
      { id: 'd3', type: 'line', text: "Syncopated <em>counter-melody</em> on the off-beat hat", timestamp: 3.42, pocket: 'pushing', offsetMs: +9.1, subdivision: 1, note: 'High urgency flow' },
      { id: 'd4', type: 'line', text: "Triple <em>transient</em> spike alignment on the fourth bar", timestamp: 5.14, pocket: 'on', offsetMs: +1.5, subdivision: 0, note: 'Exact beat hit' },
      { id: 'd5', type: 'line', text: "Staccato <em>cadence</em> hitting every sixteenth node", timestamp: 6.85, pocket: 'pushing', offsetMs: +11.0, subdivision: 2, note: 'Rapid attack offset' },
    ],
  },
  {
    id: 'afro-105-bounce',
    name: '105 BPM Afrobeats Poly-Rhythmic Stems',
    bpm: 105,
    genre: 'Afrobeats / Syncopated',
    description: '16th-note cross-rhythms with smooth vocal phrasing floating across subdivisions.',
    lyrics: [
      { id: 'a1', type: 'cue', text: 'PERCUSSION SHAKER INTRO', timestamp: 0.5, pocket: 'on', offsetMs: 0, subdivision: 0 },
      { id: 'a2', type: 'line', text: "Poly-rhythmic <em>bounce</em> swaying between beat two and three", timestamp: 2.28, pocket: 'on', offsetMs: +3.8, subdivision: 2, note: 'Syncopated groove' },
      { id: 'a3', type: 'line', text: "Warm vocal <em>formant</em> gliding over logarithmic percussion", timestamp: 4.57, pocket: 'laid-back', offsetMs: -7.5, subdivision: 3, note: 'Smooth flow glide' },
      { id: 'a4', type: 'line', text: "Rimshot <em>transients</em> anchoring the micro-timing grid", timestamp: 6.85, pocket: 'on', offsetMs: +0.4, subdivision: 0, note: 'Grid snap point' },
    ],
  },
];

export const PRESET_TRACKS = DEFAULT_AUDIO_TRACKS;
