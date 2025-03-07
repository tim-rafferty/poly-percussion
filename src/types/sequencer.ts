
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
  sample: SampleType;
  muted: boolean;
  soloed: boolean;
  oscillating: boolean;
  lastTriggerTime: number;
  direction: Direction;
}
