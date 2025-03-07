
import { TrackData, SampleType } from '@/types/sequencer';

export const TRACK_COLORS = [
  '#F1FAB8', // Light mint
  '#F8DB88', // Light yellow
  '#E39552', // Light orange
  '#C64634', // Medium orange
  '#AD1F2E', // Medium red
  '#790D42', // Dark red
  '#4E024B', // Burgundy
  '#150027', // Deep purple
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
