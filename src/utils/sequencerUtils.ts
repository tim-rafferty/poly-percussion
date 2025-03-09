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
  const defaultTimeSignatures = [2, 3, 1, 2, 4, 2, 4, 4];
  
  return Array(count).fill(null).map((_, i) => ({
    id: i,
    color: TRACK_COLORS[i],
    active: false,
    position: 0,
    amplitude: 2.0, // Maximum amplitude
    speed: 0.5, // Half speed
    timeSignature: defaultTimeSignatures[i],
    volume: 0, // Maximum volume (0 dB)
    attack: 0.01,
    decay: 0.5,
    pitch: 0, // Default pitch (no shift)
    sample: getSampleForTrack(i),
    muted: false,
    soloed: false,
    oscillating: false,
    lastTriggerTime: 0,
    direction: 'left-to-right',
    isDragging: false,
    // Default delay parameters
    delayEnabled: false,
    delayTime: 0.3,     // 300ms default delay time
    delayFeedback: 0.3, // 30% feedback by default
    delayMix: 0.3,      // 30% wet signal by default
    customSample: null
  }));
};
