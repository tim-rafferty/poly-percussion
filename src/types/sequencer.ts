export type SampleType = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'rim' | 'cowbell' | 'cymbal';
export type Direction = 'left-to-right' | 'right-to-left';

export interface TrackData {
  id: number;
  color: string;
  active: boolean;
  position: number;
  amplitude: number;
  speed: number;
  timeSignature: number;
  volume: number;
  attack: number;
  decay: number;
  pitch: number;  // Pitch control (-12 to 12 semitones)
  sample: SampleType;
  muted: boolean;
  soloed: boolean;
  oscillating: boolean;
  lastTriggerTime: number;
  direction: Direction;
  isDragging: boolean;
  // Delay effect parameters
  delayEnabled: boolean;
  delayTime: number;    // Delay time in seconds (0.1 to 1.0)
  delayFeedback: number; // Feedback amount (0 to 1.0)
  delayMix: number;     // Wet/dry mix (0 to 1.0)
  // Custom sample parameters
  customSample: {
    enabled: boolean;
    buffer: AudioBuffer | null;
    name: string;
    originalPitch: number; // Base pitch of the sample (MIDI note number)
  } | null;
}
