import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

type SampleName = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'rim' | 'cowbell' | 'cymbal';

interface UseToneOptions {
  onReady?: () => void;
}

export function useTone({ onReady }: UseToneOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0);
  const samplers = useRef<Record<SampleName, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth>>({} as any);
  const masterVolumeNode = useRef<Tone.Volume | null>(null);
  
  useEffect(() => {
    if (Tone.context.state === 'suspended') {
      const handleInteraction = async () => {
        await Tone.start();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      };
      
      document.addEventListener('click', handleInteraction);
      document.addEventListener('keydown', handleInteraction);
      
      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      };
    }
  }, []);

  useEffect(() => {
    masterVolumeNode.current = new Tone.Volume(masterVolume).toDestination();
    
    const samples: Record<SampleName, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth> = {
      'kick': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      }).connect(masterVolumeNode.current),
      'snare': new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0
        }
      }).connect(masterVolumeNode.current),
      'hihat': new Tone.MetalSynth({
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.01
        }
      }).connect(masterVolumeNode.current),
      'clap': new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: {
          attack: 0.001,
          decay: 0.3,
          sustain: 0
        }
      }).connect(masterVolumeNode.current),
      'tom': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      }).connect(masterVolumeNode.current),
      'rim': new Tone.MetalSynth({
        harmonicity: 3.1,
        modulationIndex: 16,
        resonance: 8000,
        octaves: 0.5,
        envelope: {
          attack: 0.001,
          decay: 0.05,
          release: 0.01
        }
      }).connect(masterVolumeNode.current),
      'cowbell': new Tone.MetalSynth({
        harmonicity: 4.1,
        modulationIndex: 8,
        resonance: 2000,
        octaves: 0.7,
        envelope: {
          attack: 0.001,
          decay: 0.4,
          release: 0.01
        }
      }).connect(masterVolumeNode.current),
      'cymbal': new Tone.MetalSynth({
        harmonicity: 8,
        modulationIndex: 40,
        resonance: 500,
        octaves: 2,
        envelope: {
          attack: 0.001,
          decay: 1,
          release: 0.3
        }
      }).connect(masterVolumeNode.current)
    };
    
    samplers.current = samples;
    setIsLoaded(true);
    
    if (onReady) {
      onReady();
    }
    
    return () => {
      Object.values(samples).forEach(sampler => sampler.dispose());
      if (masterVolumeNode.current) {
        masterVolumeNode.current.dispose();
      }
    };
  }, [onReady]);

  useEffect(() => {
    if (masterVolumeNode.current) {
      masterVolumeNode.current.volume.value = masterVolume;
    }
  }, [masterVolume]);

  const playSound = (sampleName: SampleName, duration: number = 0.5, volume: number = -10) => {
    if (!samplers.current[sampleName]) return;
    
    const synth = samplers.current[sampleName];
    
    const vol = new Tone.Volume(volume);
    synth.connect(vol);
    vol.connect(masterVolumeNode.current || Tone.Destination);
    
    if (synth instanceof Tone.MembraneSynth) {
      synth.triggerAttackRelease('C2', duration);
    } else if (synth instanceof Tone.MetalSynth) {
      synth.triggerAttackRelease(duration);
    } else if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease(duration);
    } else {
      synth.triggerAttackRelease('C3', duration);
    }
  };

  const setBpm = (bpm: number) => {
    Tone.Transport.bpm.value = bpm;
  };

  const startTransport = () => {
    Tone.Transport.start();
  };

  const stopTransport = () => {
    Tone.Transport.stop();
  };

  const getCurrentTime = () => {
    return Tone.now();
  };

  return {
    isLoaded,
    playSound,
    setBpm,
    startTransport,
    stopTransport,
    getCurrentTime,
    masterVolume,
    setMasterVolume,
  };
}

export default useTone;
