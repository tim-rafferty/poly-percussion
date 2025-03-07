
import { TrackData, SampleType } from '@/types/sequencer';

export const TRACK_COLORS = [
  '#4AE0B8', // mint
  '#E08D7F', // coral
  '#E0E04A', // yellow
  '#4AE04A', // green
  '#4ACCE0', // teal
  '#E04A4A', // red
  '#FFFFFF', // white
  '#4AE07F', // light green
];

export const getSampleForTrack = (index: number): SampleType => {
  switch (index % 8) {
    case 0: return 'kick';
    case 1: return 'snare';
    case 2: return 'hihat';
    case 3: return 'clap';
    case 4: return 'tom';
    case 5: return 'rim';
    case 6: return 'cowbell';
    default: return 'cymbal';
  }
};

export const createInitialTracks = (count: number = 8): TrackData[] => {
  return Array(count).fill(null).map((_, i) => ({
    id: i,
    color: TRACK_COLORS[i],
    active: false,
    position: 0,
    amplitude: 0,
    speed: 1 + (i * 0.25),
    timeSignature: 4,
    volume: -10,
    attack: 0.01,
    decay: 0.5,
    sample: getSampleForTrack(i),
    muted: false,
    soloed: false,
    oscillating: false,
    lastTriggerTime: 0,
    direction: 'left-to-right'
  }));
};
